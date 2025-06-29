<template>
  <div v-if="show" class="settings-dialog">
    <div class="dialog-content">
      <h3>AI模型设置</h3>
      
      <!-- API错误显示 -->
      <div v-if="lastApiError" class="error-message">
        <strong>API错误:</strong> {{ lastApiError }}
      </div>
      
      <div class="form-group">
        <label for="model">模型选择:</label>
        <select id="model" v-model="localModelId" @change="onModelChange">
          <optgroup v-for="group in groupedModels" :key="group.provider" :label="group.provider">
            <option 
              v-for="model in group.models" 
              :key="model.id" 
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </optgroup>
        </select>
        <div class="model-description">
          {{ currentModelConfig?.description }}
        </div>
      </div>

      <div class="form-group">
        <label for="apiKey">API密钥:</label>
        <input 
          id="apiKey" 
          type="password" 
          v-model="localApiKey" 
          :placeholder="getApiKeyPlaceholder()"
          :class="{ 'invalid': !isValidApiKey }"
        />
        <div v-if="!isValidApiKey && localApiKey" class="validation-message">
          请输入有效的API密钥
        </div>
      </div>
      
      <div class="form-group">
        <label for="apiBase">API地址:</label>
        <input 
          id="apiBase" 
          type="text" 
          v-model="localApiBase" 
          :placeholder="currentModelConfig?.defaultApiBase || 'https://api.example.com/v1'"
          :disabled="!isCustomModel_computed"
        />
        <div class="input-description">
          {{ isCustomModel_computed ? '请输入自定义API地址' : '使用模型默认API地址' }}
        </div>
      </div>

      <!-- 自定义模型配置 -->
      <div v-if="isCustomModel_computed" class="custom-model-section">
        <h4>自定义模型配置</h4>
        
        <div class="form-group">
          <label for="customModelName">模型名称:</label>
          <input 
            id="customModelName" 
            type="text" 
            v-model="localCustomModelName" 
            placeholder="例如: gpt-3.5-turbo, claude-3-sonnet"
          />
        </div>

        <div class="form-group">
          <label for="customApiBase">API地址:</label>
          <input 
            id="customApiBase" 
            type="text" 
            v-model="localCustomApiBase" 
            placeholder="https://api.example.com/v1"
          />
        </div>
      </div>
      
      <div class="button-group">
        <button @click="save" :disabled="!isFormValid" class="save-btn">保存</button>
        <button @click="close" class="cancel-btn">取消</button>
        <button @click="testConnection" :disabled="!isFormValid || isTestingConnection" class="test-btn">
          {{ isTestingConnection ? '测试中...' : '测试连接' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSettings } from '@/store/settingsStore'
import { callApi } from '@/services/apiService'
import { getAvailableModels, getModelConfig, isCustomModel, type ModelConfig } from '@/config/aiConfig'
import './SettingsDialog.css'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:show'])

const { 
  apiKey, 
  apiBase, 
  selectedModelId,
  customModelName,
  customApiBase,
  lastApiError,
  updateApiKey, 
  updateApiBase, 
  updateModel,
  updateCustomModelName,
  updateCustomApiBase,
  validateApiKey,
  clearApiError
} = useSettings()

// 本地状态
const localApiKey = ref(apiKey)
const localApiBase = ref(apiBase)
const localModelId = ref(selectedModelId)
const localCustomModelName = ref(customModelName)
const localCustomApiBase = ref(customApiBase)
const isTestingConnection = ref(false)

// 计算属性
const isValidApiKey = computed(() => validateApiKey(localApiKey.value))
const isCustomModel_computed = computed(() => isCustomModel(localModelId.value))
const currentModelConfig = computed(() => getModelConfig(localModelId.value))

// 表单验证
const isFormValid = computed(() => {
  if (!isValidApiKey.value) return false
  if (isCustomModel_computed.value) {
    return localCustomModelName.value.trim().length > 0 && localCustomApiBase.value.trim().length > 0
  }
  return true
})

// 模型分组
const groupedModels = computed(() => {
  const models = getAvailableModels()
  const groups: { [key: string]: ModelConfig[] } = {}
  
  models.forEach(model => {
    if (!groups[model.provider]) {
      groups[model.provider] = []
    }
    groups[model.provider].push(model)
  })
  
  return Object.entries(groups).map(([provider, models]) => ({
    provider,
    models
  }))
})

// 方法
const getApiKeyPlaceholder = () => {
  const config = currentModelConfig.value
  if (config?.provider === 'OpenAI') {
    return '请输入OpenAI API Key (sk-...)'
  } else if (config?.provider === 'DeepSeek') {
    return '请输入DeepSeek API Key'
  } else {
    return '请输入API密钥...'
  }
}

const onModelChange = () => {
  const config = currentModelConfig.value
  if (config && !isCustomModel(localModelId.value)) {
    localApiBase.value = config.defaultApiBase
  }
}

// 监听props变化，更新本地状态
watch(() => props.show, (show) => {
  if (show) {
    localApiKey.value = apiKey
    localApiBase.value = apiBase
    localModelId.value = selectedModelId
    localCustomModelName.value = customModelName
    localCustomApiBase.value = customApiBase
    clearApiError()
  }
})

const save = () => {
  if (!isFormValid.value) {
    return
  }
  
  updateApiKey(localApiKey.value)
  updateApiBase(localApiBase.value)
  updateModel(localModelId.value)
  
  if (isCustomModel_computed.value) {
    updateCustomModelName(localCustomModelName.value)
    updateCustomApiBase(localCustomApiBase.value)
  }
  
  close()
}

const close = () => {
  emit('update:show', false)
}

const testConnection = async () => {
  if (!isFormValid.value) {
    return
  }
  
  isTestingConnection.value = true
  
  try {
    // 保存当前的API设置
    const currentApiKey = apiKey
    const currentApiBase = apiBase
    const currentModel = selectedModelId
    const currentCustomModelName = customModelName
    const currentCustomApiBase = customApiBase
    
    // 临时更新设置进行测试
    updateApiKey(localApiKey.value)
    updateApiBase(localApiBase.value)
    updateModel(localModelId.value)
    
    if (isCustomModel_computed.value) {
      updateCustomModelName(localCustomModelName.value)
      updateCustomApiBase(localCustomApiBase.value)
    }
    
    await callApi([
      {
        role: 'system',
        content: 'You are a helpful assistant. This is a connection test.'
      },
      {
        role: 'user',
        content: 'Hello, this is a test message. Please respond briefly.'
      }
    ])
    
    alert('连接测试成功！')
    
  } catch (error) {
    console.error('Connection test failed:', error)
    // 如果测试失败，不需要恢复设置，因为用户可能想要保存这些新设置
  } finally {
    isTestingConnection.value = false
  }
}
</script>
