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
                <view v-for="task in tasks" :key="task.id" class="task-item-wrapper">
                  <TaskItem 
                    :task="task" 
                    :expandedTaskIds="expandedTaskIds"
                    @update:expandedTaskIds="updateExpandedTaskIds"
                  />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- AI Assistant Chat Section -->
      <view class="chat-page">
        <view v-if="llmLoading" class="llm-loading">
          <text>正在加载并解析 AI 上下文…</text>
        </view>
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
                
                <view class="tasks-container">
                  <view v-for="(t, ti) in message.jsonData.tasks" :key="t.task_id || t.id || ti" class="task-item-wrapper">
                    <TaskItem 
                      :task="t" 
                      :expandedTaskIds="expandedTaskIds"
                      @update:expandedTaskIds="updateExpandedTaskIds"
                    />
                  </view>
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
