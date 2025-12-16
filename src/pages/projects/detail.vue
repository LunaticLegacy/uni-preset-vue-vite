<template>
  <layout page-title="AI 助手">
    <view class="chat-page">
      <!-- history -->
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
            
            <!-- assistant normal text / user text -->
            <view v-if="message.content" class="msg-content" v-html="formatMessage(message.content)"></view>

            <!-- JSON render (task plan) -->
            <view v-if="message.jsonData" class="json-card">
              <view class="json-title">任务计划</view>

              <view class="json-kv">
                <view class="json-k">目标</view>
                <view class="json-v">{{ message.jsonData.main_goal }}</view>
              </view>

              <view class="json-section-title">主任务</view>
              <view v-for="(t, ti) in message.jsonData.tasks" :key="ti" class="task-card">
                <view class="task-head">
                  <view class="task-name">{{ ti + 1 }}. {{ t.title }}</view>
                  <view class="task-meta">{{ t.priority }} · {{ t.estimated_time }} {{ t.estimated_time_unit }}</view>
                </view>
                <view class="task-desc">{{ t.description }}</view>
                
                <!-- 显示任务的起始时间和结束时间 -->
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

                <!-- 递归渲染子任务 -->
                <RecursiveSubtasks 
                  :subtasks="t.subtasks" 
                  :level="1"
                  v-if="t.subtasks && t.subtasks.length">
                </RecursiveSubtasks>
              </view>

              <view class="json-section-title">总结</view>
              <view class="json-summary">{{ message.jsonData.summary }}</view>
            </view>
          </view>

          <view class="avatar user-avatar" v-if="message.role === 'user'">我</view>
        </view>

        <view class="chat-padding-bottom"></view>
      </scroll-view>

      <!-- composer -->
      <view 
        class="composer" 
        :class="[
          $parent.isSidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar'
        ]"
      >
        <input
          class="composer-input"
          v-model="userInput"
          placeholder="给 AI 发消息…"
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button class="composer-send" :disabled="!userInput.trim()" @click="sendMessage">发送</button>
      </view>
    </view>
  </layout>
</template>

<script src="./detail.js"></script>
<style src="./detail.css"></style>