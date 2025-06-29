<template>
  <div class="home-view">
    <!-- 左侧：编辑器面板 -->
    <div class="left-panel">
      <SlideEditor />
    </div>
    
    <!-- 中间：预览面板 -->
    <div class="center-panel">
      <SlidePreview />
    </div>
    
    <!-- 右侧：聊天面板 -->
    <div class="right-panel">
      <ChatWindow />
    </div>
    
    <button @click="showSettings = true" class="settings-button">Settings</button>
    <SettingsDialog :show="showSettings" @update:show="showSettings = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatWindow from '@/components/ChatWindow.vue'
import SlideEditor from '@/components/SlideEditor.vue'
import SlidePreview from '@/components/SlidePreview.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { initSlides } from '@/store/slideStore'
import { initPptMeta } from '@/store/pptMeta'
import './HomeView.css'

const showSettings = ref(false)

onMounted(() => {
  // 确保所有 store 都被初始化
  initSlides()
  initPptMeta()
})
</script>
