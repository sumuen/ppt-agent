/**
 * 变更追踪器
 * 负责追踪幻灯片和项目描述的修改状态
 * 遵循单一职责原则和最佳工程实践
 */

import { ref, reactive } from 'vue'
import type { 
  DirtyState, 
  RecentOperation, 
  ChangeContext, 
  ChangeRecord, 
  OperationType,
  OperationResult 
} from '@/types/changes'
import { acquireAIEditLock, releaseEditLock, canAIEdit } from './editModeManager'

// 响应式状态
const dirtyState = reactive<DirtyState>({
  pages: new Set<number>(),
  summary: false
})

const recentOperation = ref<RecentOperation | null>(null)
const changeHistory = ref<ChangeRecord[]>([])

// 生成唯一ID
const generateId = () => `change_${Date.now()}_${Math.random().toString(36).slice(2)}`

/**
 * 标记页面为dirty状态
 */
export function markPageDirty(pageNumber: number) {
  dirtyState.pages.add(pageNumber)
  recordRecentOperation('modify', `第${pageNumber}页`)
}

/**
 * 标记项目描述为dirty状态
 */
export function markSummaryDirty() {
  dirtyState.summary = true
  recordRecentOperation('summary_modify', '项目描述')
}

/**
 * 清除页面的dirty状态
 */
export function clearPageDirty(pageNumber: number) {
  dirtyState.pages.delete(pageNumber)
}

/**
 * 清除项目描述的dirty状态
 */
export function clearSummaryDirty() {
  dirtyState.summary = false
}

/**
 * 清除所有dirty状态
 */
export function clearAllDirty() {
  dirtyState.pages.clear()
  dirtyState.summary = false
  recentOperation.value = null
}

/**
 * 记录最近操作
 */
function recordRecentOperation(type: OperationType, target: string) {
  recentOperation.value = {
    type,
    target,
    timestamp: Date.now()
  }
}

/**
 * 生成AI上下文信息
 * 这是核心方法，每次API调用都会使用
 */
export function generateAIContext(): ChangeContext {
  return {
    dirtyPages: Array.from(dirtyState.pages).sort(),
    isDirtySummary: dirtyState.summary,
    recentOperation: recentOperation.value || undefined
  }
}

/**
 * 生成人类可读的变更摘要
 */
export function generateChangeSummary(): string {
  const parts: string[] = []
  
  if (dirtyState.pages.size > 0) {
    const pageList = Array.from(dirtyState.pages).sort().join(',')
    parts.push(`第${pageList}页已修改`)
  }
  
  if (dirtyState.summary) {
    parts.push('项目描述已修改')
  }
  
  if (parts.length === 0) {
    return '无未保存的修改'
  }
  
  return parts.join('，')
}

/**
 * 记录变更历史（用于撤销功能）
 */
export function recordChange(
  type: OperationType,
  description: string,
  beforeState: any,
  afterState: any
): string {
  const record: ChangeRecord = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    description,
    beforeState,
    afterState
  }
  
  changeHistory.value.push(record)
  
  // 限制历史记录数量，避免内存泄漏
  if (changeHistory.value.length > 50) {
    changeHistory.value = changeHistory.value.slice(-50)
  }
  
  return record.id
}

/**
 * 获取变更追踪器状态（用于开发调试）
 */
export function getTrackerState() {
  return {
    dirtyState: { ...dirtyState, pages: Array.from(dirtyState.pages) },
    recentOperation: recentOperation.value,
    changeHistoryCount: changeHistory.value.length
  }
}

/**
 * 处理页面插入操作
 * 不标记为dirty，但需要重新映射页码
 */
export function handlePageInsert(insertPosition: number, totalPages: number) {
  // 重新映射dirty页码：插入位置及之后的页面页码+1
  const newDirtyPages = new Set<number>()
  for (const pageNum of dirtyState.pages) {
    if (pageNum >= insertPosition) {
      newDirtyPages.add(pageNum + 1)
    } else {
      newDirtyPages.add(pageNum)
    }
  }
  dirtyState.pages = newDirtyPages
  
  recordRecentOperation('insert', `第${insertPosition}页（插入后共${totalPages}页）`)
}

/**
 * 处理页面删除操作
 * 不标记为dirty，但需要重新映射页码
 */
export function handlePageDelete(deletePosition: number, totalPages: number) {
  // 重新映射dirty页码
  const newDirtyPages = new Set<number>()
  for (const pageNum of dirtyState.pages) {
    if (pageNum === deletePosition) {
      // 删除的页面不再标记为dirty
      continue
    } else if (pageNum > deletePosition) {
      // 删除位置之后的页面页码-1
      newDirtyPages.add(pageNum - 1)
    } else {
      // 删除位置之前的页面页码不变
      newDirtyPages.add(pageNum)
    }
  }
  dirtyState.pages = newDirtyPages
  
  recordRecentOperation('delete', `原第${deletePosition}页（删除后共${totalPages}页）`)
}

/**
 * AI清除所有dirty状态（AI获取内容后调用）
 */
export function aiClearAllDirty(): boolean {
  if (!canAIEdit()) {
    console.warn('用户正在编辑中，AI无法清除dirty状态')
    return false
  }
  
  acquireAIEditLock()
  
  dirtyState.pages.clear()
  dirtyState.summary = false
  recentOperation.value = null
  
  console.log('AI清除所有dirty状态')
  
  // AI操作完成后释放锁
  releaseEditLock('ai')
  
  return true
}

/**
 * AI清除特定页面的dirty状态
 */
export function aiClearPageDirty(pageNumber: number): boolean {
  if (!canAIEdit()) {
    console.warn('用户正在编辑中，AI无法清除dirty状态')
    return false
  }
  
  acquireAIEditLock()
  dirtyState.pages.delete(pageNumber)
  console.log(`AI清除第${pageNumber}页的dirty状态`)
  releaseEditLock('ai')
  
  return true
}

/**
 * AI清除项目描述的dirty状态
 */
export function aiClearSummaryDirty(): boolean {
  if (!canAIEdit()) {
    console.warn('用户正在编辑中，AI无法清除dirty状态')
    return false
  }
  
  acquireAIEditLock()
  dirtyState.summary = false
  console.log('AI清除项目描述的dirty状态')
  releaseEditLock('ai')
  
  return true
}

/**
 * 导出响应式状态供组件使用
 */
export function useChangeTracker() {
  return {
    dirtyState,
    recentOperation,
    markPageDirty,
    markSummaryDirty,
    clearPageDirty,
    clearSummaryDirty,
    clearAllDirty,
    aiClearAllDirty,
    aiClearPageDirty,
    aiClearSummaryDirty,
    handlePageInsert,
    handlePageDelete,
    generateAIContext,
    generateChangeSummary,
    recordChange,
    getTrackerState
  }
}
