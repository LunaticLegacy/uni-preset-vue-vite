<template>
  <layout page-title="项目详情">
    <view class="detail-page">
      <!-- Tasks Section -->
      <view class="tasks-section">
        <view class="page-root">
          <view class="page-card">
            <view class="card-header">
              <view class="header-title-section">
                <text class="page-title">{{ projectName }}</text>
                <text class="project-desc" v-if="projectDescription">{{ projectDescription }}</text>
              </view>
            </view>

            <view class="card-body">
              <view v-if="tasksLoading" class="list-state">加载中...</view>
              <view v-else-if="tasksError" class="list-state error">{{ tasksError }}</view>
              <view v-else-if="tasks.length === 0" class="list-state">暂无任务</view>
              <view v-else class="tasks-container">
                <view v-for="task in tasks" :key="task.id" class="task-item">
                  <view class="task-header" @click="toggleTaskExpand(null, task.id)">
                    <view class="expand-indicator">{{ isTaskExpanded(null, task.id) ? '▼' : '▶' }}</view>
                    <view class="task-info">
                      <text class="task-title">{{ task.title }}</text>
                      <text class="task-meta">{{ task.status }} · {{ task.priority }}</text>
                      <text v-if="task.subtasks && task.subtasks.length > 0" class="subtask-count">{{ task.subtasks.length }} 个子任务</text>
                    </view>
                  </view>

                  <view v-if="isTaskExpanded(null, task.id)" class="task-details">
                    <view class="detail-section">
                      <view class="section-title">描述</view>
                      <text class="detail-text">{{ task.description || '无描述' }}</text>
                    </view>

                    <view class="detail-section">
                      <view class="section-title">基本信息</view>
                      <view class="info-row">
                        <text class="info-label">优先级:</text>
                        <text class="info-value">{{ task.priority }}</text>
                      </view>
                      <view class="info-row">
                        <text class="info-label">状态:</text>
                        <text class="info-value">{{ task.status }}</text>
                      </view>
                      <view class="info-row">
                        <text class="info-label">预计时间:</text>
                        <text class="info-value">{{ task.estimated_minutes }} 分钟</text>
                      </view>
                    </view>

                    <view v-if="task.subtasks && task.subtasks.length > 0" class="detail-section">
                      <view class="section-title">子任务</view>
                      <view class="subtasks-list">
                        <view v-for="(subtask, idx) in task.subtasks" :key="subtask.id || idx" class="subtask-item">
                          <view class="subtask-header" @click="toggleTaskExpand(task.id, subtask.id)">
                            <view v-if="subtask.subtasks && subtask.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(task.id, subtask.id) ? '▼' : '▶' }}</view>
                            <view v-else class="expand-indicator-empty">·</view>
                            <view class="subtask-info">
                              <text class="subtask-title">{{ subtask.title }}</text>
                              <text class="subtask-meta">{{ subtask.status }} · {{ subtask.priority }}</text>
                            </view>
                          </view>
                          <view v-if="subtask.description" class="subtask-desc">{{ subtask.description }}</view>
                          
                          <view v-if="subtask.subtasks && subtask.subtasks.length > 0 && isTaskExpanded(task.id, subtask.id)" class="nested-subtasks">
                            <view v-for="(nested, nidx) in subtask.subtasks" :key="nested.id || nidx" class="nested-subtask-item">
                              <view class="nested-subtask-header" @click="toggleTaskExpand(subtask.id, nested.id)">
                                <view v-if="nested.subtasks && nested.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(subtask.id, nested.id) ? '▼' : '▶' }}</view>
                                <view v-else class="expand-indicator-empty">·</view>
                                <view class="nested-subtask-info">
                                  <text class="nested-subtask-title">{{ nested.title }}</text>
                                  <text class="nested-subtask-meta">{{ nested.status }} · {{ nested.priority }}</text>
                                </view>
                              </view>
                              <view v-if="nested.description" class="nested-subtask-desc">{{ nested.description }}</view>
                              
                              <view v-if="nested.subtasks && nested.subtasks.length > 0 && isTaskExpanded(subtask.id, nested.id)" class="deep-nested-subtasks">
                                <view v-for="(deep, didx) in nested.subtasks" :key="deep.id || didx" class="deep-nested-subtask-item">
                                  <view class="deep-nested-subtask-header" @click="toggleTaskExpand(nested.id, deep.id)">
                                    <view v-if="deep.subtasks && deep.subtasks.length > 0" class="expand-indicator">{{ isTaskExpanded(nested.id, deep.id) ? '▼' : '▶' }}</view>
                                    <view v-else class="expand-indicator-empty">·</view>
                                    <view class="deep-nested-subtask-info">
                                      <text class="deep-nested-subtask-title">{{ deep.title }}</text>
                                      <text class="deep-nested-subtask-meta">{{ deep.status }} · {{ deep.priority }}</text>
                                    </view>
                                  </view>
                                  <view v-if="deep.description" class="deep-nested-subtask-desc">{{ deep.description }}</view>
                                </view>
                              </view>
                            </view>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- AI Assistant Chat Section -->
      <view class="chat-page">
        <scroll-view class="chat-history" scroll-y="true" :scroll-into-view="scrollIntoId" scroll-with-animation="true">
          <view class="chat-padding-top"></view>

          <view
            v-for="(message, index) in messages"
            :key="index"
            :id="'msg-' + index"
            :class="['msg-row', message.role]"
          >
            <view class="avatar" v-if="message.role === 'assistant'">AI</view>

            <view class="msg-bubble">
              <view
                v-if="message.thinkingMeta && (message.thinkingMeta.active || message.thinking)"
                class="msg-thinking"
              >
                <view class="thinking-head" @click="toggleThinking(index)">
                  <view class="thinking-title">
                    思考过程
                    <text class="thinking-duration">
                      {{ message.thinkingMeta.active ? (message.thinkingMeta.durationSec + ' s · 思考中') : (message.thinkingMeta.durationSec + ' s') }}
                    </text>
                  </view>
                  <view class="thinking-toggle">
                    {{ message.thinkingMeta.open ? '收起' : '展开' }}
                  </view>
                </view>

                <view v-if="message.thinkingMeta.open" class="thinking-content" v-html="formatMessage(message.thinking)"></view>
              </view>
              
              <view v-if="message.content" class="msg-content" v-html="formatMessage(message.content)"></view>

              <view v-if="message.jsonData" class="json-card">
                <view class="json-title">任务计划</view>

                <view class="json-kv">
                  <view class="json-k">目标</view>
                  <view class="json-v" v-if="message.jsonData.main_goal">{{ message.jsonData.main_goal }}</view>
                  <view class="json-v json-muted" v-else>（目标生成中…）</view>
                </view>

                <view class="json-section-title">主任务</view>
                <view v-if="!message.jsonData.tasks || !message.jsonData.tasks.length" class="json-muted">（主任务生成中…）</view>
                <view v-for="(t, ti) in message.jsonData.tasks" :key="ti" class="task-card">
                  <view class="task-head">
                    <view class="task-name">{{ ti + 1 }}. {{ t.title }}</view>
                    <view class="task-meta">{{ t.priority }} · {{ t.estimated_time }} {{ t.estimated_time_unit }}</view>
                    <view v-if="t.task_id" class="task-action">
                      <button class="task-edit-btn" @click="editTask(t, [messages.length - 1, 'jsonData', 'tasks', ti])">编辑</button>
                    </view>
                  </view>
                  <view class="task-desc">{{ t.description }}</view>

                  <view v-if="editingTask && editingTask.task_id === t.task_id" class="task-edit-modal">
                    <view class="modal-overlay" @click="cancelEdit"></view>
                    <view class="modal-content">
                      <view class="modal-header">
                        <text class="modal-title">编辑任务</text>
                        <view class="close-btn" @click="cancelEdit">×</view>
                      </view>
                      <view class="modal-body">
                        <view class="form-row">
                          <label>标题</label>
                          <input v-model="editingTask.title" class="edit-input" />
                        </view>
                        <view class="form-row">
                          <label>描述</label>
                          <textarea v-model="editingTask.description" class="edit-textarea"></textarea>
                        </view>
                        <view class="form-row">
                          <label>优先级</label>
                          <picker :range="['low', 'medium', 'high']" @change="(e) => editingTask.priority = ['low', 'medium', 'high'][e.detail.value]">
                            <view class="picker-input">{{ editingTask.priority || '选择' }}</view>
                          </picker>
                        </view>
                        <view class="form-row">
                          <label>状态</label>
                          <picker :range="['backlog', 'in_progress', 'done']" @change="(e) => editingTask.status = ['backlog', 'in_progress', 'done'][e.detail.value]">
                            <view class="picker-input">{{ editingTask.status || '选择' }}</view>
                          </picker>
                        </view>
                        <view class="form-row">
                          <label>估计时间（分钟）</label>
                          <input v-model.number="editingTask.estimated_minutes" type="number" class="edit-input" />
                        </view>
                      </view>
                      <view class="modal-footer">
                        <button class="btn-cancel" @click="cancelEdit">取消</button>
                        <button class="btn-submit" @click="submitTaskEdit">保存</button>
                      </view>
                    </view>
                  </view>

                  <view class="task-times">
                    <view class="time-item">
                      <text class="time-label">开始时间:</text>
                      <input type="date" v-model="t.startDate" class="time-input" />
                    </view>
                    <view class="time-item">
                      <text class="time-label">结束时间:</text>
                      <input type="date" v-model="t.endDate" class="time-input" />
                    </view>
                  </view>

                  <RecursiveSubtasks
                    :subtasks="t.subtasks"
                    :level="1"
                    v-if="t.subtasks && t.subtasks.length">
                  </RecursiveSubtasks>
                </view>

                <view class="json-section-title">总结</view>
                <view class="json-summary" v-if="message.jsonData.summary">{{ message.jsonData.summary }}</view>
                <view class="json-muted" v-else>（总结生成中…）</view>
              </view>
            </view>

            <view class="avatar user-avatar" v-if="message.role === 'user'">我</view>
          </view>

          <view class="chat-padding-bottom"></view>
        </scroll-view>

        <view
          class="composer"
          :class="[
            $parent.isSidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar'
          ]"
        >
          <view class="composer-wrapper">
            <textarea
              class="composer-input"
              v-model="userInput"
              placeholder="给 AI 发消息…（最多20000字符）"
              @input="onInputChange"
              :style="{ height: textareaHeight + 'px' }"
            />
            <view v-if="userInput.length > 15000" class="char-counter">
              <view class="progress-bar" :style="{ width: (userInput.length / 20000 * 100) + '%' }"></view>
              <text class="char-text">{{ userInput.length }}/20000</text>
            </view>
            <view v-else-if="userInput.length > 0" class="char-count">{{ userInput.length }}/20000</view>
          </view>
          <button class="composer-send" :disabled="!userInput.trim() || userInput.length > 20000" @click="sendMessage">发送</button>
        </view>
      </view>
    </view>
  </layout>
</template>

<script src="./detail.js"></script>
<style src="./detail.css"></style>
