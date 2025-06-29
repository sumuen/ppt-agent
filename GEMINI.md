# PPT-AGENT Development Log

This file contains development notes, best practices, and decisions made during the development of the PPT-AGENT application.

## Project Overview

- **Objective**: A pure front-end application for creating presentations using natural language commands.
- **Core Technologies**:
    - Vue 3 + TypeScript
    - Typst for slide rendering (`@myriaddreamin/typst.ts`, `@myriaddreamin/typst.vue3`)
    - AI-powered commands via OpenAI/Gemini API.
    - IndexedDB for persistent storage.
- **Key Features**:
    - Chat-based interface for presentation editing.
    - Real-time preview of the rendered slides.
    - Local storage of API keys and application state.
    - Tool-based interaction with the AI model.

## Best Practices & Conventions

- **Component Structure**: Components will be organized by feature and reused where possible.
- **Composables**: Reusable logic will be extracted into composables.
- **Styling**: We will use separate CSS files for each component to ensure modularity and maintainability. Global styles will be in `src/assets/styles/main.css`.
- **API Interaction**: All API calls will be centralized in an `apiService.ts` file.
- **Code Quality**:
    - **Function Length**: Aim for functions to be concise and focused, ideally not exceeding 20-30 lines of code.
    - **File Length**: Keep files manageable, ideally not exceeding 200-300 lines for `.vue` components and 100-150 lines for `.ts` files.
    - **Readability**: Prioritize clear variable names, consistent formatting, and logical code flow.
    - **Modularity**: Break down complex logic into smaller, reusable modules or composables.