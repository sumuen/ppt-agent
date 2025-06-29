/**
 * 变更追踪相关的类型定义
 * 遵循单一职责原则和最佳工程实践
 */

// 操作类型
export type OperationType = 'insert' | 'delete' | 'modify' | 'summary_modify'

// Dirty状态追踪（用于UI状态显示）
export interface DirtyState {
  pages: Set<number>      // 被修改的页面号集合
  summary: boolean        // 项目描述是否被修改
}

// 最近操作信息（用于AI上下文）
export interface RecentOperation {
  type: OperationType
  target: string          // "第X页" 或 "项目描述"
  timestamp: number
}

// AI上下文信息（每次API调用都会包含）
export interface ChangeContext {
  dirtyPages: number[]    // dirty页面列表
  isDirtySummary: boolean // 项目描述是否dirty
  recentOperation?: RecentOperation
}

// 变更记录（用于撤销功能）
export interface ChangeRecord {
  id: string
  type: OperationType
  timestamp: number
  description: string     // 人类可读的描述
  beforeState: any        // 变更前状态
  afterState: any         // 变更后状态
}

// 操作结果状态
export interface OperationResult {
  success: boolean
  message: string
  affectedPages?: number[]
}