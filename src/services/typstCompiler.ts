import { ref } from 'vue'
import { $typst } from '@myriaddreamin/typst.ts'

let isInitialized = false;
let isInitializing = false;

// 存储最后的编译错误信息
const lastCompileError = ref<string | null>(null)
const lastCompileSuccess = ref(true)

export function useTypstCompiler() {

  const init = async () => {
    if (isInitialized || isInitializing) return
    
    isInitializing = true
    
    try {
      // 获取当前页面的 base URL，确保 WASM 文件路径正确
      const baseUrl = document.baseURI.endsWith('/') ? document.baseURI : document.baseURI + '/'
      
      $typst.setCompilerInitOptions({
        getModule: () => `${baseUrl}typst_ts_web_compiler_bg.wasm`,
      })

      $typst.setRendererInitOptions({
        getModule: () => `${baseUrl}typst_ts_renderer_bg.wasm`,
      })

      isInitialized = true
    } catch (error) {
      console.warn('Typst已经初始化，跳过重复初始化')
      isInitialized = true
    } finally {
      isInitializing = false
    }
  }

  const compile = async (source: string) => {
    if (!isInitialized) {
      await init()
    }
    try {
      // 添加演示文稿样式配置，使用系统默认字体避免网络请求
      const sourceWithSlideStyle = `// 演示文稿样式配置
#set text(size: 20pt)
#set page(
  paper: "presentation-16-9",
  margin: (x: 40pt, y: 40pt),
  fill: white
)
#set heading(numbering: none)
#show heading.where(level: 1): set text(size: 32pt, weight: "bold")
#show heading.where(level: 2): set text(size: 24pt, weight: "bold")

// 为列表添加更好的间距
#set list(indent: 20pt, body-indent: 8pt)
#set enum(indent: 20pt, body-indent: 8pt)

// 添加页面边框和背景
#set page(background: rect(
  width: 100%, 
  height: 100%, 
  fill: gradient.linear(
    (white, 0%), 
    (rgb("#f8f9fa"), 100%)
  ),
  stroke: none
))

${source}`
      
      const svg = await $typst.svg({ mainContent: sourceWithSlideStyle })
      
      // 编译成功，清除错误信息
      lastCompileError.value = null
      lastCompileSuccess.value = true
      
      return svg
    } catch (error) {
      console.error('Error compiling Typst:', error)
      
      // 保存详细的错误信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      lastCompileError.value = errorMessage
      lastCompileSuccess.value = false
      
      // 生成用户友好的错误显示
      const friendlyError = generateFriendlyError(errorMessage)
      return `<div style="
        color: #721c24; 
        background-color: #f8d7da; 
        border: 1px solid #f5c6cb; 
        padding: 20px; 
        border-radius: 8px; 
        font-family: monospace;
        margin: 20px;
        max-width: 600px;
      ">
        <h3 style="margin-top: 0; color: #721c24;">⚠️ Typst 编译错误</h3>
        <p><strong>错误信息:</strong></p>
        <pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px; overflow-x: auto;">${friendlyError}</pre>
        <p style="margin-bottom: 0;"><small>💡 提示: 您可以请求AI助手帮助修复这个错误</small></p>
      </div>`
    }
  }

  // 生成用户友好的错误信息
  const generateFriendlyError = (errorMessage: string): string => {
    // 常见错误的友好提示
    const errorPatterns = [
      {
        pattern: /unknown function/i,
        suggestion: '未知函数 - 请检查函数名是否正确拼写'
      },
      {
        pattern: /unexpected token/i,
        suggestion: '语法错误 - 请检查括号、引号是否匹配'
      },
      {
        pattern: /missing argument/i,
        suggestion: '缺少参数 - 请检查函数调用的参数是否完整'
      },
      {
        pattern: /undefined variable/i,
        suggestion: '未定义变量 - 请检查变量名是否正确'
      }
    ]
    
    let friendlyMessage = errorMessage
    
    for (const { pattern, suggestion } of errorPatterns) {
      if (pattern.test(errorMessage)) {
        friendlyMessage += `\n\n建议: ${suggestion}`
        break
      }
    }
    
    return friendlyMessage
  }

  // 获取编译状态信息
  const getCompileStatus = () => {
    return {
      success: lastCompileSuccess.value,
      error: lastCompileError.value,
      hasError: !lastCompileSuccess.value && lastCompileError.value !== null
    }
  }

  // 清除编译错误
  const clearCompileError = () => {
    lastCompileError.value = null
    lastCompileSuccess.value = true
  }

  return {
    init,
    compile,
    getCompileStatus,
    clearCompileError,
    lastCompileError,
    lastCompileSuccess
  }
}