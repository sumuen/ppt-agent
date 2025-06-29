/**
 * 编辑模式管理器
 * 负责协调用户编辑和AI编辑，避免冲突
 */

import { ref, reactive } from 'vue'

// 编辑模式枚举
export enum EditMode {
  USER = 'user',     // 用户编辑模式
  AI = 'ai',         // AI编辑模式
  IDLE = 'idle'      // 空闲状态
}

// 编辑状态
interface EditState {
  mode: EditMode
  isLocked: boolean
  lockedBy: 'user' | 'ai' | null
  lockTimestamp: number | null
}

// 响应式编辑状态
const editState = reactive<EditState>({
  mode: EditMode.IDLE,
  isLocked: false,
  lockedBy: null,
  lockTimestamp: null
})

// 锁超时时间（毫秒），防止死锁
const LOCK_TIMEOUT = 30000 // 30秒

/**
 * 尝试获取用户编辑锁
 */
export function acquireUserEditLock(): boolean {
  // 检查是否已被AI锁定
  if (editState.isLocked && editState.lockedBy === 'ai') {
    return false
  }
  
  // 获取用户编辑锁
  editState.mode = EditMode.USER
  editState.isLocked = true
  editState.lockedBy = 'user'
  editState.lockTimestamp = Date.now()
  
  console.log('用户获取编辑锁')
  return true
}

/**
 * 尝试获取AI编辑锁
 */
export function acquireAIEditLock(): boolean {
  // 检查是否已被用户锁定
  if (editState.isLocked && editState.lockedBy === 'user') {
    return false
  }
  
  // 获取AI编辑锁
  editState.mode = EditMode.AI
  editState.isLocked = true
  editState.lockedBy = 'ai'
  editState.lockTimestamp = Date.now()
  
  console.log('AI获取编辑锁')
  return true
}

/**
 * 释放编辑锁
 */
export function releaseEditLock(requester: 'user' | 'ai'): boolean {
  // 只有锁的持有者才能释放锁
  if (editState.lockedBy !== requester) {
    return false
  }
  
  editState.mode = EditMode.IDLE
  editState.isLocked = false
  editState.lockedBy = null
  editState.lockTimestamp = null
  
  console.log(`${requester}释放编辑锁`)
  return true
}

/**
 * 强制释放锁（用于超时或错误恢复）
 */
export function forceReleaseEditLock(): void {
  editState.mode = EditMode.IDLE
  editState.isLocked = false
  editState.lockedBy = null
  editState.lockTimestamp = null
  
  console.log('强制释放编辑锁')
}

/**
 * 检查锁是否超时并自动释放
 */
export function checkAndReleaseExpiredLock(): void {
  if (editState.isLocked && editState.lockTimestamp) {
    const now = Date.now()
    if (now - editState.lockTimestamp > LOCK_TIMEOUT) {
      console.warn('编辑锁超时，自动释放')
      forceReleaseEditLock()
    }
  }
}

/**
 * 检查当前是否可以进行用户编辑
 */
export function canUserEdit(): boolean {
  checkAndReleaseExpiredLock()
  return !editState.isLocked || editState.lockedBy === 'user'
}

/**
 * 检查当前是否可以进行AI编辑
 */
export function canAIEdit(): boolean {
  checkAndReleaseExpiredLock()
  return !editState.isLocked || editState.lockedBy === 'ai'
}

/**
 * 获取当前编辑状态
 */
export function getEditState(): EditState {
  return { ...editState }
}

/**
 * 导出响应式状态供组件使用
 */
export function useEditMode() {
  return {
    editState,
    EditMode,
    acquireUserEditLock,
    acquireAIEditLock,
    releaseEditLock,
    forceReleaseEditLock,
    canUserEdit,
    canAIEdit,
    getEditState
  }
}
