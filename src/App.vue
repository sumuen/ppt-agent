<template>
  <div id="app">
    <HomeView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HomeView from './views/HomeView.vue'
import { initSlides } from '@/store/slideStore'
import { useTypstCompiler } from '@/services/typstCompiler'

onMounted(async () => {
  // 初始化幻灯片数据
  initSlides()
  // 初始化 Typst 编译器（只初始化一次）
  try {
    await useTypstCompiler().init()
  } catch (error) {
    console.warn('Typst编译器初始化失败或已初始化:', error)
  }
})
</script>
