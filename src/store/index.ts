// 统一的 store 导出
export * from './chatStore'
export * from './slideStore'
export * from './settingsStore'
export * from './editModeManager'

// 初始化所有 stores
export function initStores() {
  const { initChat } = require('./chatStore')
  const { initSlides } = require('./slideStore')
  const { initSettings } = require('./settingsStore')
  
  initChat()
  initSlides()
  initSettings()
}
