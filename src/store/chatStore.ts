import { ref } from 'vue'
import { Message } from '@/types'
import { SYSTEM_PROMPT } from '@/config/constants'

// 使用 Vue 3 的 ref 创建全局响应式状态
const messages = ref<Message[]>([])
const isInitialized = ref(false)

// 初始化聊天消息
export function initChat() {
  if (!isInitialized.value) {
    messages.value = [{
      role: 'system',
      content: SYSTEM_PROMPT,
      id: 'system-' + Date.now(),
      timestamp: Date.now()
    }]
    isInitialized.value = true
  }
}

// 添加消息
export function addMessage(message: Message) {
  const messageWithId = {
    ...message,
    id: message.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: message.timestamp || Date.now()
  }
  messages.value.push(messageWithId)
}

// 清空消息（保留系统消息）
export function clearMessages() {
  messages.value = [{
    role: 'system',
    content: SYSTEM_PROMPT,
    id: 'system-' + Date.now(),
    timestamp: Date.now()
  }]
}

// 导出响应式状态
export function useChatMessages() {
  return {
    messages: messages.value,
    messagesRef: messages, // 用于响应式绑定
    addMessage,
    clearMessages,
    initChat
  }
}
