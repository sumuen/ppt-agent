import { SlideTools } from '@/types'
import { useSlides } from '@/store/slideStore'
import { usePptMeta } from '@/store/pptMeta'
import { aiClearPageDirty, aiClearSummaryDirty, aiClearAllDirty } from '@/store/changeTracker'
import { acquireAIEditLock, releaseEditLock, canAIEdit } from '@/store/editModeManager'
import { useTypstCompiler } from '@/services/typstCompiler'

export const createTools = (): SlideTools => ({
  get_slide_summary: () => {
    const { summary } = useSlides()
    // AI获取内容后清除summary的dirty状态
    aiClearSummaryDirty()
    return summary
  },
  
  get_slide_content: (slideNumber: number) => {
    try {
      const { slides } = useSlides()
      const totalPages = slides.length
      
      if (slideNumber < 1 || slideNumber > totalPages) {
        throw new Error(`Slide ${slideNumber} not found. Total slides: ${totalPages}`)
      }
      
      const index = slideNumber - 1
      if (index >= 0 && index < slides.length) {
        // AI获取内容后清除该页的dirty状态
        aiClearPageDirty(slideNumber)
        return slides[index].content
      }
      throw new Error(`Slide ${slideNumber} not found.`)
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }
  },
  
  update_slide_content: (slideNumber: number, newContent: string) => {
    try {
      if (!canAIEdit()) {
        return `Error: Cannot update slide - user is currently editing.`
      }
      
      const { updateSlideContent, slides } = useSlides()
      const totalPages = slides.length
      
      if (slideNumber < 1 || slideNumber > totalPages) {
        throw new Error(`Slide ${slideNumber} not found. Total slides: ${totalPages}`)
      }
      
      const index = slideNumber - 1
      const result = updateSlideContent(index, newContent, false) // false表示AI编辑
      
      if (result) {
        return `Slide ${slideNumber} updated successfully.`
      } else {
        return `Error: Failed to update slide ${slideNumber}.`
      }
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }
  },
  
  recompile_current_slide: () => {
    return `Current slide recompiled.`
  },
  
  update_slide_summary: (newSummary: string) => {
    try {
      if (!canAIEdit()) {
        return `Error: Cannot update summary - user is currently editing.`
      }
      
      const { updateSummary } = useSlides()
      const result = updateSummary(newSummary, false) // false表示AI编辑
      
      if (result) {
        return `Summary updated successfully.`
      } else {
        return `Error: Failed to update summary.`
      }
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }
  },
  
  insert_slide: (position: number, content?: string) => {
    try {
      if (!canAIEdit()) {
        return `Error: Cannot insert slide - user is currently editing.`
      }
      
      const { insertSlide } = useSlides()
      // 转换为0-based索引，因为AI传入的是1-based位置
      const totalPages = insertSlide(position - 1, content)
      return `Slide inserted at position ${position}. Total slides: ${totalPages}`
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }
  },
  
  delete_slide: (slideNumber: number) => {
    try {
      if (!canAIEdit()) {
        return `Error: Cannot delete slide - user is currently editing.`
      }
      
      const { deleteSlide } = useSlides()
      const result = deleteSlide(slideNumber)
      return `Slide ${slideNumber} deleted successfully. Total slides: ${result.newTotalPages}`
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }  },

  get_compile_status: () => {
    try {
      const { getCompileStatus } = useTypstCompiler()
      const status = getCompileStatus()
      
      if (status.hasError) {
        return `Compilation error: ${status.error}`
      } else {
        return "Compilation successful, no errors found."
      }
    } catch (error) {
      return `Error: ${(error as Error).message}`
    }
  }
})

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_slide_summary',
      description: 'Get the project summary, which is a live, numbered table of contents that reflects the current state of all slides.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_slide_content',
      description: 'Get the Typst source code of a specific slide',
      parameters: {
        type: 'object',
        properties: {
          slideNumber: { type: 'number', description: 'The slide number to get the content of' },
        },
        required: ['slideNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_slide_content',
      description: 'Update the Typst source code of a specific slide. The summary will be updated automatically.',
      parameters: {
        type: 'object',
        properties: {
          slideNumber: { type: 'number', description: 'The slide number to update' },
          newContent: { type: 'string', description: 'The new Typst source code' },
        },
        required: ['slideNumber', 'newContent'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recompile_current_slide',
      description: 'Recompiles the current slide to reflect changes.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_slide_summary',
      description: 'Update the project summary. This should be used to edit the text semantically while preserving the numbered list format.',
      parameters: {
        type: 'object',
        properties: {
          newSummary: { type: 'string', description: 'The new summary text, preserving the numbered list format.' },
        },
        required: ['newSummary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'insert_slide',
      description: 'Insert a new slide at the specified position',
      parameters: {
        type: 'object',
        properties: {
          position: { 
            type: 'number', 
            description: 'Position to insert the slide (1-based index). Use 1 to insert at beginning, totalPages+1 to insert at end.' 
          },
          content: { 
            type: 'string', 
            description: 'Optional initial content for the new slide. If not provided, a default template will be used.' 
          },
        },
        required: ['position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_slide',
      description: 'Delete a slide by its number',
      parameters: {
        type: 'object',
        properties: {
          slideNumber: { 
            type: 'number', 
            description: 'The slide number to delete (1-based index)' 
          },
        },
        required: ['slideNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_compile_status',
      description: 'Get the current Typst compilation status and error information. Only call this when there are compilation errors to help diagnose and fix them.',
      parameters: { type: 'object', properties: {} },
    },
  },
]
