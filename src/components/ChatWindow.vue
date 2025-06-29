<template>
  <div class="chat-window">
    <div class="chat-header">
      <h2>AI 助手</h2>
      <button @click="clearChat" class="clear-btn">清空对话</button>
    </div>
    
    <div class="messages-container" ref="messagesContainer">
      <div v-if="messages.length === 0 && isInitialized" class="empty-state">
        <p>暂无对话内容</p>
      </div>
      <div v-else-if="messages.length === 0" class="loading-state">
        <p>正在加载...</p>
      </div>
      
      <div 
        v-for="(message, index) in messages" 
        :key="message.id || `msg-${index}`" 
        class="message"
        :class="`message-${message.role}`"
      >
        <div 
          class="message-header" 
          @click="toggleMessageCollapse(message.id || `msg-${index}`)"
          :class="{ 'clickable': true }"
        >
          <div class="header-left">
            <span class="collapse-icon">
              {{ isMessageCollapsed(message.id || `msg-${index}`) ? '▶' : '▼' }}
            </span>
            <span class="role-badge" :class="`role-${message.role}`">
              {{ getRoleDisplayName(message.role) }}
            </span>
          </div>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        
        <div 
          class="message-content" 
          v-show="!isMessageCollapsed(message.id || `msg-${index}`)"
        >
          <template v-if="message.role === 'tool'">
            <div class="tool-result">
              <strong>工具: {{ message.name }}</strong>
              <pre>{{ formatToolContent(message.content) }}</pre>
            </div>
          </template>
          
          <template v-else-if="message.tool_calls && message.tool_calls.length > 0">
            <div class="tool-calls">
              <p>正在调用工具...</p>
              <div v-for="toolCall in message.tool_calls" :key="toolCall.id" class="tool-call">
                <strong>{{ toolCall.function.name }}</strong>
                <pre>{{ JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2) }}</pre>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div 
              class="text-content" 
              :class="{ 'markdown-content': message.role === 'assistant' }"
              v-html="message.role === 'assistant' ? renderMarkdown(message.content || '') : message.content"
            ></div>
          </template>
        </div>
      </div>
    </div>
    
    <div class="input-container">
      <input 
        type="text" 
        v-model="newMessage" 
        @keydown="handleKeydown"
        @compositionstart="isComposing = true"
        @compositionend="isComposing = false"
        placeholder="输入消息与AI助手对话..."
        :disabled="isLoading"
        class="message-input"
      />
      <button 
        @click="sendMessage" 
        :disabled="!newMessage.trim() || isLoading"
        class="send-btn"
      >
        {{ isLoading ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { marked } from 'marked'
import { processAIConversation } from '@/services/chatService'
import { Message } from '@/types'
import { useChatMessages } from '@/store/chatStore'
import { initSlides } from '@/store/slideStore'
import { initPptMeta } from '@/store/pptMeta'
import './ChatWindow.css' // 引入外部 CSS 文件

const messagesContainer = ref<HTMLElement>()
const newMessage = ref('')
const isLoading = ref(false)
const isInitialized = ref(false)
const isComposing = ref(false) // 输入法组合状态
const collapsedMessages = ref<Set<string>>(new Set()) // 折叠的消息ID集合

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true,    // GitHub Flavored Markdown
})

// 使用新的 store
const { messagesRef: messages, addMessage, clearMessages, initChat } = useChatMessages()

onMounted(async () => {
  // 初始化 stores
  initChat()
  initSlides()
  initPptMeta()
  
  isInitialized.value = true
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
})

// 监听消息变化，自动滚动到底部并初始化折叠状态
watch(
  () => messages.value.length,
  async () => {
    // 初始化新消息的折叠状态
    messages.value.forEach((message, index) => {
      const messageId = message.id || `msg-${index}`
      initMessageCollapseState(message, messageId)
    })
    
    await nextTick()
    scrollToBottom()
  }
)

const getRoleDisplayName = (role: string) => {
  const roleMap: Record<string, string> = {
    'system': '系统',
    'user': '用户',
    'assistant': 'AI助手',
    'tool': '工具'
  }
  return roleMap[role] || role
}

// 折叠控制函数
const toggleMessageCollapse = (messageId: string) => {
  if (collapsedMessages.value.has(messageId)) {
    collapsedMessages.value.delete(messageId)
  } else {
    collapsedMessages.value.add(messageId)
  }
}

const isMessageCollapsed = (messageId: string) => {
  return collapsedMessages.value.has(messageId)
}

// 初始化消息折叠状态 - system 消息默认折叠
const initMessageCollapseState = (message: any, messageId: string) => {
  if (message.role === 'system' && !collapsedMessages.value.has(messageId)) {
    collapsedMessages.value.add(messageId)
  }
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString()
}

const formatToolContent = (content: string | undefined) => {
  if (!content) return ''
  try {
    const obj = JSON.parse(content)
    if (typeof obj === 'string') return obj
    return JSON.stringify(obj, null, 2)
  } catch {
    return content
  }
}

// Markdown 渲染函数
const renderMarkdown = (content: string) => {
  try {
    return marked(content)
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return content
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const clearChat = async () => {
  if (confirm('确定要清空所有对话吗？')) {
    clearMessages()
    newMessage.value = ''
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return
  
  isLoading.value = true
  
  try {
    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: newMessage.value.trim(),
      timestamp: Date.now()
    }
    addMessage(userMessage)
    newMessage.value = ''
    
    // 调用 service 处理整个对话流程
    await processAIConversation(messages.value, addMessage)
    
  } catch (error) {
    addMessage({
      role: 'assistant',
      content: `抱歉，发生了错误: ${(error as Error).message}`,
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}
</script>

<style scoped>
/* <style> 标签内容已移至 ChatWindow.css，这里保持为空或删除 */
</style>