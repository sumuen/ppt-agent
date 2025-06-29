import { ref } from 'vue'
import { Slide } from '@/types'
import { markPageDirty, markSummaryDirty, recordChange, handlePageInsert, handlePageDelete } from './changeTracker'
import { acquireUserEditLock, releaseEditLock, canUserEdit } from './editModeManager'
import { setTotalPages } from './pptMeta'

// 默认幻灯片内容 - 标准 Typst 演示文稿格式
const DEFAULT_SLIDES: Slide[] = [
  {
    content: `= PPT-AGENT
== AI-Driven Typst Slide Editor

A modern presentation tool powered by AI

#align(center)[
  #text(size: 14pt)[Created with AI assistance]
  
  #datetime.today().display()
]`
  },
  {
    content: `= About This Project

This project combines the power of AI with Typst's excellent typesetting capabilities.

== Key Features
- Natural language editing
- Real-time compilation  
- Smart content suggestions
- Modern web interface

== Technology Stack
- Vue 3 + TypeScript frontend
- Typst WebAssembly compiler
- AI-powered editing assistant`
  },
  {
    content: `= Technical Architecture

== Frontend Components
- *Slide Editor*: Code editor with syntax highlighting
- *Preview Panel*: Real-time Typst rendering
- *AI Assistant*: Natural language processing
- *Tool Integration*: Seamless workflow

== Backend Services  
- *Typst Compiler*: WebAssembly integration
- *API Service*: AI model communication
- *State Management*: Reactive data flow

#align(center)[
  _Building the future of presentation creation_
]`
  },
  {
    content: `= Getting Started

== Quick Start
+ Open the slide editor
+ Type your content in Typst format
+ Use the AI assistant for help
+ Preview your slides in real-time

== AI Assistant Commands
- "Add a new slide about..."
- "Change the title to..."  
- "Format this as a bullet list"
- "Create a conclusion slide"

== Next Steps
#box(fill: gray.lighten(80%), inset: 8pt, radius: 4pt)[
  Try editing this presentation and see the AI assistant in action!
]`
  }
]

// 默认项目摘要 - 使用英文
const DEFAULT_SUMMARY = `# About This Project

This project is an AI-driven Typst slide editor that supports natural language editing, real-time preview, and tool chain integration.

## Contents
1. Project Introduction
2. Technical Architecture  
3. Usage Guide

## Overview
Through the AI assistant, users can edit and manage Typst-formatted slide content using natural language.`

// 全局响应式状态
const slides = ref<Slide[]>([...DEFAULT_SLIDES])
const summary = ref<string>(DEFAULT_SUMMARY)
const currentSlide = ref(0)
// 当前查看模式：'slides' 表示查看幻灯片，'summary' 表示查看项目描述
const currentViewMode = ref<'slides' | 'summary'>('slides')
const isInitialized = ref(false)

// 初始化幻灯片
export function initSlides() {
  if (!isInitialized.value) {
    slides.value = [...DEFAULT_SLIDES]
    summary.value = DEFAULT_SUMMARY
    currentSlide.value = 0
    isInitialized.value = true
    
    // 同步更新 pptMeta 中的总页数
    setTotalPages(slides.value.length)
  }
}

// 更新幻灯片内容（用户编辑）
export function updateSlideContent(index: number, content: string, isUserEdit: boolean = true) {
  if (index >= 0 && index < slides.value.length) {
    // 如果是用户编辑，需要获取编辑锁
    if (isUserEdit) {
      if (!canUserEdit()) {
        console.warn('AI正在编辑中，用户编辑被阻止')
        return false
      }
      acquireUserEditLock()
    }
    
    const oldContent = slides.value[index].content
    slides.value[index] = { ...slides.value[index], content }
    
    // 只有用户编辑才标记为dirty
    if (isUserEdit) {
      markPageDirty(index + 1)
    }
    
    recordChange(
      'modify',
      `${isUserEdit ? '用户' : 'AI'}修改第${index + 1}页内容`,
      { content: oldContent },
      { content }
    )
    
    return true
  }
  return false
}

// 更新项目摘要（用户编辑）
export function updateSummary(newSummary: string, isUserEdit: boolean = true) {
  // 如果是用户编辑，需要获取编辑锁
  if (isUserEdit) {
    if (!canUserEdit()) {
      console.warn('AI正在编辑中，用户编辑被阻止')
      return false
    }
    acquireUserEditLock()
  }
  
  const oldSummary = summary.value
  summary.value = newSummary
  
  // 只有用户编辑才标记为dirty
  if (isUserEdit) {
    markSummaryDirty()
  }
  
  recordChange(
    'summary_modify',
    `${isUserEdit ? '用户' : 'AI'}修改项目描述`,
    { summary: oldSummary },
    { summary: newSummary }
  )
  
  return true
}

// 设置当前幻灯片
export function setCurrentSlide(index: number) {
  if (index >= 0 && index < slides.value.length) {
    currentSlide.value = index
  }
}

// 设置当前查看模式
export function setViewMode(mode: 'slides' | 'summary') {
  currentViewMode.value = mode
}

// 插入新页面
export function insertSlide(position: number, content: string = '') {
  if (position < 0 || position > slides.value.length) {
    throw new Error(`Invalid position ${position}. Must be between 0 and ${slides.value.length}`)
  }
  
  const defaultContent = content || `= New Slide

Your content here...

#align(center)[
  #text(size: 14pt)[Created by AI]
]`
  
  const newSlide = { content: defaultContent }
  slides.value.splice(position, 0, newSlide)
  
  // 如果插入位置在当前页面之前或等于，需要调整当前页面索引
  if (position <= currentSlide.value) {
    currentSlide.value += 1
  }
  
  // 处理变更追踪：重新映射dirty页码并记录操作
  handlePageInsert(position + 1, slides.value.length) // position+1因为页码从1开始
  
  // 记录变更历史（用于撤销）
  recordChange(
    'insert',
    `在第${position + 1}页插入新页面`,
    { totalPages: slides.value.length - 1 },
    { totalPages: slides.value.length, insertedContent: defaultContent }
  )
  
  // 同步更新 pptMeta 中的总页数
  setTotalPages(slides.value.length)
  
  return slides.value.length
}

// 删除页面
export function deleteSlide(slideNumber: number) {
  const index = slideNumber - 1
  
  if (index < 0 || index >= slides.value.length) {
    throw new Error(`Slide ${slideNumber} not found. Total slides: ${slides.value.length}`)
  }
  
  if (slides.value.length <= 1) {
    throw new Error('Cannot delete the last slide')
  }
  
  const deletedSlide = slides.value[index]
  slides.value.splice(index, 1)
  
  // 处理变更追踪：重新映射dirty页码
  handlePageDelete(slideNumber, slides.value.length + 1)
  
  // 记录变更
  recordChange(
    'delete',
    `删除第${slideNumber}页`,
    { totalPages: slides.value.length + 1, deletedContent: deletedSlide.content },
    { totalPages: slides.value.length }
  )
  
  // 调整当前页面索引
  if (currentSlide.value >= slides.value.length) {
    currentSlide.value = slides.value.length - 1
  } else if (currentSlide.value > index) {
    currentSlide.value -= 1
  }
  
  // 同步更新 pptMeta 中的总页数
  setTotalPages(slides.value.length)
  
  return { deletedContent: deletedSlide.content, newTotalPages: slides.value.length }
}

// 获取当前预览状态信息
export function getCurrentViewStatus() {
  if (currentViewMode.value === 'summary') {
    return {
      type: 'summary',
      description: '当前正在查看项目描述/概要页面'
    }
  } else {
    return {
      type: 'slide',
      currentPage: currentSlide.value + 1,
      totalPages: slides.value.length,
      description: `当前正在查看第 ${currentSlide.value + 1} 页幻灯片（共 ${slides.value.length} 页）`
    }
  }
}

// 导出状态和方法
export function useSlides() {
  return {
    slides: slides.value,
    slidesRef: slides,
    summary: summary.value,
    summaryRef: summary,
    currentSlide: currentSlide.value,
    currentSlideRef: currentSlide,
    currentViewMode: currentViewMode.value,
    currentViewModeRef: currentViewMode,
    updateSlideContent,
    updateSummary,
    setCurrentSlide,
    setViewMode,
    getCurrentViewStatus,
    insertSlide,
    deleteSlide,
    initSlides
  }
}
