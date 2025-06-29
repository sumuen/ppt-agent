import { callApi } from './apiService'
import { createTools } from './tools'
import { Message, SlideTools } from '@/types'

// 执行单个工具调用的辅助函数
const executeToolCall = async (toolCall: any): Promise<string> => {
  const tools: SlideTools = createTools()
  const toolName = toolCall.function.name as keyof SlideTools
  const toolArgs = JSON.parse(toolCall.function.arguments)
  
  switch (toolName) {
    case 'get_slide_content':
      return tools.get_slide_content(toolArgs.slideNumber)
    case 'update_slide_content':
      return tools.update_slide_content(toolArgs.slideNumber, toolArgs.newContent)
    case 'get_slide_summary':
      return tools.get_slide_summary()
    case 'update_slide_summary':
      return tools.update_slide_summary(toolArgs.newSummary)
    case 'recompile_current_slide':
      return tools.recompile_current_slide()
    case 'insert_slide':
      return tools.insert_slide(toolArgs.position, toolArgs.content)
    case 'delete_slide':
      return tools.delete_slide(toolArgs.slideNumber)
    case 'get_compile_status':
      return tools.get_compile_status()
    default:
      return `未知工具: ${toolName}`
  }
}

// 处理AI对话和工具调用的主函数
export const processAIConversation = async (
  messages: Message[],
  addMessage: (message: Message) => void
): Promise<void> => {
  // 使用 while 循环处理多轮 AI 对话和工具调用
  let continueConversation = true
  let maxRounds = 10 // 防止无限循环，最多 10 轮
  let currentRound = 0
  
  while (continueConversation && currentRound < maxRounds) {
    currentRound++
    
    try {
      // 调用 API
      const response = await callApi(messages)
      
      if (response.choices && response.choices.length > 0) {
        const assistantMessage = response.choices[0].message
        
        // 检查是否有工具调用
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          // 添加助手消息（可能为空内容但有工具调用）
          addMessage({
            role: assistantMessage.role,
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls
          })
          
          // 执行所有工具调用
          for (const toolCall of assistantMessage.tool_calls) {
            try {
              const toolResult = await executeToolCall(toolCall)
              
              // 添加工具结果消息
              addMessage({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: toolResult
              })
              
            } catch (toolError) {
              addMessage({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: `工具执行错误: ${(toolError as Error).message}`
              })
            }
          }
          
          // 工具调用完成后，继续让AI处理结果
          continueConversation = true
          
        } else {
          // 没有工具调用，这是最终回复
          addMessage({
            role: assistantMessage.role,
            content: assistantMessage.content || '操作已完成。'
          })
          
          // 结束对话
          continueConversation = false
        }
      } else {
        // API 响应异常
        addMessage({
          role: 'assistant',
          content: 'API 响应异常，请重试。'
        })
        continueConversation = false
      }
      
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `第 ${currentRound} 轮处理失败: ${(error as Error).message}`
      })
      continueConversation = false
    }
  }
  
  // 如果达到最大轮数限制
  if (currentRound >= maxRounds) {
    addMessage({
      role: 'assistant',
      content: '已达到最大处理轮数限制，对话结束。如需继续，请重新发送消息。'
    })
  }
}
