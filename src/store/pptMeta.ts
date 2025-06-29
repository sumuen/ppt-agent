import { ref } from 'vue'

// PPT 元信息状态
const totalPages = ref(3)
const projectTitle = ref('PPT-AGENT')
const projectDescription = ref('AI-Driven Typst Slide Editor')

// 初始化元信息
export function initPptMeta() {
  totalPages.value = 3
  projectTitle.value = 'PPT-AGENT'
  projectDescription.value = 'AI-Driven Typst Slide Editor'
}

// 获取总页数
export function getTotalPages(): number {
  return totalPages.value
}

// 设置总页数
export function setTotalPages(pages: number): void {
  totalPages.value = pages
}

// 获取项目标题
export function getProjectTitle(): string {
  return projectTitle.value
}

// 设置项目标题
export function setProjectTitle(title: string): void {
  projectTitle.value = title
}

// 获取项目描述
export function getProjectDescription(): string {
  return projectDescription.value
}

// 设置项目描述
export function setProjectDescription(description: string): void {
  projectDescription.value = description
}

// 导出响应式状态访问器
export function usePptMeta() {
  return {
    totalPages: totalPages.value,
    totalPagesRef: totalPages,
    projectTitle: projectTitle.value,
    projectTitleRef: projectTitle,
    projectDescription: projectDescription.value,
    projectDescriptionRef: projectDescription,
    getTotalPages,
    setTotalPages,
    getProjectTitle,
    setProjectTitle,
    getProjectDescription,
    setProjectDescription,
    initPptMeta
  }
}
