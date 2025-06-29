export interface Message {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string; }; }>;
  tool_call_id?: string;
  name?: string;
  timestamp?: number;
}

export interface Slide {
  content: string;
}

export interface SlideTools {
  get_slide_summary: () => string;
  get_slide_content: (slideNumber: number) => string;
  update_slide_content: (slideNumber: number, newContent: string) => string;
  recompile_current_slide: () => string;
  update_slide_summary: (newSummary: string) => string;
  insert_slide: (position: number, content?: string) => string;
  delete_slide: (slideNumber: number) => string;
  get_compile_status: () => string;
}
