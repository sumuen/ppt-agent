import { useSettings } from '@/store/settingsStore'
import { useSlides } from '@/store/slideStore'
import { useChangeTracker } from '@/store/changeTracker'
import { toolDefinitions } from './tools'

export async function callApi(messages: any[]) {
  const { apiKey, apiBase, model, setApiError, clearApiError } = useSettings()
  const { getCurrentViewStatus } = useSlides()
  const { generateAIContext, generateChangeSummary } = useChangeTracker()

  if (!apiKey) {
    const error = 'API key is not set. Please configure your API key in settings.'
    setApiError(error)
    throw new Error(error)
  }

  // 清除之前的错误
  clearApiError()

  // 获取当前预览状态和变更状态
  const viewStatus = getCurrentViewStatus()
  const changeContext = generateAIContext()
  const changeSummary = generateChangeSummary()
  
  // 构建上下文信息
  let contextInfo = `**当前预览状态**: ${viewStatus.description}`
  
  // 添加项目基本信息
  if (viewStatus.type === 'slide') {
    contextInfo += `\n**项目信息**: PPT-AGENT 演示文稿，总共 ${viewStatus.totalPages} 页幻灯片`
  }
  
  if (changeContext.dirtyPages.length > 0 || changeContext.isDirtySummary) {
    contextInfo += `\n**变更状态**: ${changeSummary}`
  }
  
  if (changeContext.recentOperation) {
    const timeDiff = Date.now() - changeContext.recentOperation.timestamp
    if (timeDiff < 30000) { // 30秒内的操作视为"最近"
      contextInfo += `\n**最近操作**: ${changeContext.recentOperation.target}被${
        changeContext.recentOperation.type === 'insert' ? '插入' :
        changeContext.recentOperation.type === 'delete' ? '删除' : '修改'
      }`
    }
  }
  
  // 在系统消息中添加上下文信息
  const messagesWithContext = [...messages]
  if (messagesWithContext.length > 0 && messagesWithContext[0].role === 'system') {
    messagesWithContext[0] = {
      ...messagesWithContext[0],
      content: messagesWithContext[0].content + `\n\n${contextInfo}`
    }
  }

  const requestBody = {
    model: model,
    messages: messagesWithContext,
    tools: toolDefinitions,
    tool_choice: 'auto',
    stream: false
  }

  console.log('API Request:', {
    url: `${apiBase}/chat/completions`,
    apiKey: apiKey.substring(0, 10) + '...',
    body: requestBody
  })

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API call failed with status: ${response.status} - ${response.statusText}`)
    console.error('Error response:', errorText)
    console.error('Request URL:', `${apiBase}/chat/completions`)
    console.error('API Key (first 10 chars):', apiKey.substring(0, 10) + '...')
    
    let errorMessage = `API call failed with status: ${response.status}`
    
    if (response.status === 401) {
      errorMessage = 'Authentication failed. Please check your API key in settings. The key may be invalid or expired.'
    } else if (response.status === 403) {
      errorMessage = 'Access forbidden. Your API key may not have the required permissions.'
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.'
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
    }
    
    setApiError(errorMessage)
    throw new Error(errorMessage)
  }

  return await response.json()
}
