<template>
  <div class="slide-preview">
    <div class="preview-header">
      <h2>Preview</h2>
      <div class="preview-controls">
        <button @click="downloadPDF" :disabled="isGeneratingPDF" class="download-btn">
          {{ isGeneratingPDF ? '生成中...' : '下载 PDF' }}
        </button>
      </div>
    </div>
    
    <!-- 页面切换控件 -->
    <div class="page-navigation">
      <button @click="prevSlide" :disabled="currentSlideIndex === 0" class="nav-btn">
        ← 上一页
      </button>
      <span class="page-info">第 {{ currentSlideIndex + 1 }} / {{ slides.length }} 页</span>
      <button @click="nextSlide" :disabled="currentSlideIndex >= slides.length - 1" class="nav-btn">
        下一页 →
      </button>
      <div class="page-actions">
        <button @click="addSlide" class="action-btn">添加页</button>
        <button @click="removeSlide" :disabled="slides.length <= 1" class="action-btn remove-btn">删除页</button>
      </div>
    </div>
    
    <div class="preview-content" v-html="renderedSvg"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSlides } from '@/store/slideStore'
import { useTypstCompiler } from '@/services/typstCompiler'
import './SlidePreview.css'

const { 
  slidesRef, 
  currentSlideRef, 
  setCurrentSlide, 
  insertSlide, 
  deleteSlide 
} = useSlides()
const { compile } = useTypstCompiler()
const renderedSvg = ref('')
const isGeneratingPDF = ref(false)

// 创建计算属性
const slides = computed(() => slidesRef.value)
const currentSlideIndex = computed(() => currentSlideRef.value)
const currentSlide = computed(() => slidesRef.value[currentSlideRef.value])

// 页面切换函数
const prevSlide = () => {
  if (currentSlideIndex.value > 0) {
    setCurrentSlide(currentSlideIndex.value - 1)
  }
}

const nextSlide = () => {
  if (currentSlideIndex.value < slides.value.length - 1) {
    setCurrentSlide(currentSlideIndex.value + 1)
  }
}

const addSlide = () => {
  const newSlidePosition = currentSlideIndex.value + 1
  insertSlide(newSlidePosition)
  setCurrentSlide(newSlidePosition)
}

const removeSlide = () => {
  if (slides.value.length > 1) {
    const slideToRemove = currentSlideIndex.value + 1
    deleteSlide(slideToRemove)
  }
}

// PDF下载功能
const downloadPDF = async () => {
  isGeneratingPDF.value = true
  
  try {
    await generateDirectPDF()
  } catch (error) {
    console.error('PDF生成失败:', error)
    alert('PDF生成失败，请稍后重试')
  } finally {
    isGeneratingPDF.value = false
  }
}

// 直接生成并下载PDF
const generateDirectPDF = async () => {
  // 创建一个包含所有幻灯片的HTML文档
  const htmlContent = await createPrintableHTML()
  
  // 创建Blob对象
  const blob = new Blob([htmlContent], { type: 'text/html' })
  
  // 创建对象URL
  const url = URL.createObjectURL(blob)
  
  // 在新窗口中打开，这样用户可以直接另存为PDF
  const newWindow = window.open(url, '_blank')
  
  if (newWindow) {
    // 设置新窗口的标题
    newWindow.document.title = `演示文稿_${new Date().toISOString().slice(0, 10)}.pdf`
    
    // 在窗口加载完成后自动触发打印对话框
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print()
      }, 1000)
    }
  } else {
    // 如果无法打开新窗口，创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = `演示文稿_${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// 创建可打印的HTML内容
const createPrintableHTML = async (): Promise<string> => {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>演示文稿PDF</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          body { margin: 0; }
          .slide-page { page-break-after: always; }
          .slide-page:last-child { page-break-after: avoid; }
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: #f5f5f5;
        }
        .slide-page {
          width: 297mm;
          height: 167mm;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          box-sizing: border-box;
          padding: 10mm;
          background: white;
          margin: 10mm auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .slide-content {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .slide-content svg {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .slide-number {
          position: absolute;
          bottom: 5mm;
          right: 5mm;
          font-size: 12pt;
          color: #666;
        }
        @media screen {
          .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
          }
          .controls button {
            margin: 0 5px;
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .controls button:hover {
            background: #0056b3;
          }
        }
        @media print {
          .controls { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="window.print()">打印/保存为PDF</button>
        <button onclick="window.close()">关闭</button>
      </div>
  `
  
  // 为每个幻灯片生成页面
  for (let i = 0; i < slides.value.length; i++) {
    const svg = await compile(slides.value[i].content)
    htmlContent += `
      <div class="slide-page">
        <div class="slide-content">
          ${svg}
        </div>
        <div class="slide-number">${i + 1} / ${slides.value.length}</div>
      </div>
    `
  }
  
  htmlContent += `
    </body>
    </html>
  `
  
  return htmlContent
}

watch(
  currentSlide,
  async (newSlide) => {
    if (newSlide) {
      renderedSvg.value = await compile(newSlide.content)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.slide-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-content {
  flex-grow: 1;
  border: 1px solid #eee;
  overflow: auto;
}
</style>