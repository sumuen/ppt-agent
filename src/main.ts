import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles/main.css'
import { initSettings } from '@/store/settingsStore'

const app = createApp(App)

// 初始化设置
initSettings()

app.mount('#app')