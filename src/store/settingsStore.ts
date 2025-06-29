import { ref, computed } from 'vue'
import { DEFAULT_API_KEY, DEFAULT_API_BASE, DEFAULT_MODEL, getModelConfig, isCustomModel } from '@/config/aiConfig'

// 响应式状态
const apiKey = ref(DEFAULT_API_KEY)
const apiBase = ref(DEFAULT_API_BASE)
const model = ref(DEFAULT_MODEL)
const customModelName = ref('')
const customApiBase = ref('')
const lastApiError = ref<string | null>(null)

// 计算属性
const isApiConfigured = computed(() => !!apiKey.value)

// 计算实际使用的模型名称
const actualModelName = computed(() => {
  if (isCustomModel(model.value)) {
    return customModelName.value || 'custom-model'
  }
  const modelConfig = getModelConfig(model.value)
  return modelConfig?.modelName || model.value
})

// 计算实际使用的API Base
const actualApiBase = computed(() => {
  if (isCustomModel(model.value)) {
    return customApiBase.value || apiBase.value
  }
  const modelConfig = getModelConfig(model.value)
  return modelConfig?.defaultApiBase || apiBase.value
})

// 初始化函数 
export function initSettings() {
  // 从 localStorage 读取配置，如果没有则使用默认值
  const savedApiKey = localStorage.getItem('apiKey')
  const savedApiBase = localStorage.getItem('apiBase')
  const savedModel = localStorage.getItem('model')
  const savedCustomModelName = localStorage.getItem('customModelName')
  const savedCustomApiBase = localStorage.getItem('customApiBase')
  
  if (savedApiKey) {
    // 只有在存在且不是旧的无效密钥时才使用保存的密钥
    apiKey.value = savedApiKey
  } else {
    // 清除可能的无效密钥
    localStorage.removeItem('apiKey')
    apiKey.value = DEFAULT_API_KEY
  }
  
  if (savedApiBase) {
    apiBase.value = savedApiBase
  } else {
    // 如果没有保存的API Base，使用默认的并保存
    localStorage.setItem('apiBase', DEFAULT_API_BASE)
  }
  
  if (savedModel) {
    model.value = savedModel
  } else {
    // 如果没有保存的Model，使用默认的并保存
    localStorage.setItem('model', DEFAULT_MODEL)
  }

  if (savedCustomModelName) {
    customModelName.value = savedCustomModelName
  }

  if (savedCustomApiBase) {
    customApiBase.value = savedCustomApiBase
  }
}

// 设置函数
export function updateApiKey(key: string) {
  apiKey.value = key
  localStorage.setItem('apiKey', key)
}

export function updateApiBase(base: string) {
  apiBase.value = base
  localStorage.setItem('apiBase', base)
}

export function updateModel(newModel: string) {
  model.value = newModel
  localStorage.setItem('model', newModel)
  
  // 如果切换到非自定义模型，自动更新API Base
  if (!isCustomModel(newModel)) {
    const modelConfig = getModelConfig(newModel)
    if (modelConfig) {
      updateApiBase(modelConfig.defaultApiBase)
    }
  }
}

export function updateCustomModelName(name: string) {
  customModelName.value = name
  localStorage.setItem('customModelName', name)
}

export function updateCustomApiBase(base: string) {
  customApiBase.value = base
  localStorage.setItem('customApiBase', base)
}

// 记录API错误
export function setApiError(error: string | null) {
  lastApiError.value = error
}

// 清除API错误
export function clearApiError() {
  lastApiError.value = null
}

// 验证API密钥格式
export function validateApiKey(key: string): boolean {
  // 只检查基本的非空和最小长度，让后端处理具体格式验证
  return key.trim().length > 0
}

// 获取设置的函数
export function useSettings() {
  return {
    apiKey: apiKey.value,
    apiBase: actualApiBase.value,
    model: actualModelName.value,
    selectedModelId: model.value,
    customModelName: customModelName.value,
    customApiBase: customApiBase.value,
    lastApiError: lastApiError.value,
    isApiConfigured: isApiConfigured.value,
    apiKeyRef: apiKey,
    apiBaseRef: apiBase,
    modelRef: model,
    customModelNameRef: customModelName,
    customApiBaseRef: customApiBase,
    lastApiErrorRef: lastApiError,
    actualModelNameRef: actualModelName,
    actualApiBaseRef: actualApiBase,
    updateApiKey,
    updateApiBase,
    updateModel,
    updateCustomModelName,
    updateCustomApiBase,
    setApiError,
    clearApiError,
    validateApiKey,
    initSettings
  }
}

// 响应式引用导出
export const settingsRef = {
  apiKey,
  apiBase,
  model,
  customModelName,
  customApiBase,
  isApiConfigured,
  actualModelName,
  actualApiBase
}
