// AI模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  defaultApiBase: string;
  modelName: string;
  description: string;
}

// 预定义的模型配置
export const PREDEFINED_MODELS: ModelConfig[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    defaultApiBase: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    description: 'DeepSeek对话模型，适合一般对话任务'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    defaultApiBase: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-reasoner',
    description: 'DeepSeek R1推理模型，具有更强的推理能力'
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'DeepSeek',
    defaultApiBase: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-coder',
    description: 'DeepSeek代码模型，专为编程任务优化'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    defaultApiBase: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
    description: 'OpenAI GPT-4o模型，性能卓越的多模态模型'
  },
  {
    id: 'custom',
    name: '自定义模型',
    provider: 'Custom',
    defaultApiBase: '',
    modelName: '',
    description: '自定义配置的AI模型'
  }
];

// 根据模型ID获取配置
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return PREDEFINED_MODELS.find(model => model.id === modelId);
}

// 获取所有可用的模型
export function getAvailableModels(): ModelConfig[] {
  return PREDEFINED_MODELS;
}

// 检查是否为自定义模型
export function isCustomModel(modelId: string): boolean {
  return modelId === 'custom';
}

// 默认配置
export const DEFAULT_API_KEY = '' // 请在这里输入您的有效API密钥
export const DEFAULT_API_BASE = 'https://api.deepseek.com/v1'
export const DEFAULT_MODEL = 'deepseek-chat'
