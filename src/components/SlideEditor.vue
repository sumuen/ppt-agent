<template>
  <div class="slide-editor">
    <!-- 编辑状态提示 -->
    <div v-if="editState.isLocked && editState.lockedBy === 'ai'" class="edit-status ai-editing">
      🤖 AI正在编辑中，请稍等...
    </div>
    
    <!-- 标签切换 -->
    <div class="editor-tabs">
      <button 
        :class="{ active: activeTab === 'slides' }" 
        @click="activeTab = 'slides'"
        :disabled="isEditDisabled"
      >
        幻灯片编辑
      </button>
      <button 
        :class="{ active: activeTab === 'summary' }" 
        @click="activeTab = 'summary'"
        :disabled="isEditDisabled"
      >
        项目描述
      </button>
    </div>

    <!-- 幻灯片编辑区域 -->
    <div v-if="activeTab === 'slides'" class="slides-section">
      <div class="editor-info">
        <span class="current-slide-info">正在编辑第 {{ currentSlide + 1 }} / {{ slides.length }} 页</span>
      </div>
      <textarea 
        v-model="content" 
        :disabled="isEditDisabled"
        placeholder="输入 Typst 幻灯片内容..."
        class="slide-textarea"
        :class="{ disabled: isEditDisabled }"
      ></textarea>
    </div>

    <!-- 项目描述编辑区域 -->
    <div v-if="activeTab === 'summary'" class="summary-section">
      <div class="summary-header">
        <h3>项目描述</h3>
        <p class="summary-hint">编辑项目的整体描述和概要信息</p>
      </div>
      <textarea 
        v-model="summaryContent" 
        :disabled="isEditDisabled"
        placeholder="输入项目描述和概要..."
        class="summary-textarea"
        :class="{ disabled: isEditDisabled }"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useSlides } from '@/store/slideStore'
import { useEditMode } from '@/store/editModeManager'
import { releaseEditLock } from '@/store/editModeManager'
import './SlideEditor.css'

const { slidesRef, currentSlideRef, updateSlideContent, summaryRef, updateSummary, setViewMode } = useSlides()
const { editState, canUserEdit } = useEditMode()
const content = ref('')
const summaryContent = ref('')
const activeTab = ref<'slides' | 'summary'>('slides')

// 计算属性：检查是否可以编辑
const isEditDisabled = computed(() => !canUserEdit())

// 监听标签切换，更新查看模式
watch(activeTab, (newTab) => {
  setViewMode(newTab)
})

// 创建计算属性以便在模板中使用
const slides = computed(() => slidesRef.value)
const currentSlide = computed(() => currentSlideRef.value)

onMounted(() => {
  // 初始化内容
  const slide = slidesRef.value[currentSlideRef.value]
  if (slide) {
    content.value = slide.content
  }
  
  // 初始化 summary 内容
  summaryContent.value = summaryRef.value
})

// 监听当前幻灯片变化，更新内容
watch(
  () => [currentSlideRef.value, slidesRef.value[currentSlideRef.value]?.content],
  () => {
    const slide = slidesRef.value[currentSlideRef.value]
    if (slide) {
      content.value = slide.content
    } else {
      content.value = ''
    }
  },
  { immediate: true }
)

// 监听内容变化，更新幻灯片
watch(content, (newContent) => {
  if (!canUserEdit()) {
    console.warn('AI正在编辑中，用户输入被忽略')
    return
  }
  
  const currentIndex = currentSlideRef.value
  const currentSlideContent = slidesRef.value[currentIndex]?.content
  if (currentSlideContent !== newContent) {
    updateSlideContent(currentIndex, newContent, true) // true表示用户编辑
  }
})

// 监听 summary 变化
watch(summaryContent, (newSummary) => {
  if (!canUserEdit()) {
    console.warn('AI正在编辑中，用户输入被忽略')
    return
  }
  
  if (summaryRef.value !== newSummary) {
    updateSummary(newSummary, true) // true表示用户编辑
  }
})

// 监听 store 中的 summary 变化
watch(summaryRef, (newSummary) => {
  if (summaryContent.value !== newSummary) {
    summaryContent.value = newSummary
  }
})

// 组件卸载时释放用户编辑锁
onUnmounted(() => {
  releaseEditLock('user')
})
</script>

<style scoped>
.editor-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.current-slide-info {
  font-weight: bold;
  color: #495057;
  font-size: 14px;
}

.edit-status {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-weight: bold;
}

.ai-editing {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.slide-textarea.disabled,
.summary-textarea.disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.editor-tabs button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
