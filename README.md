# PPT-AGENT

一个基于 Vue 3 和 TypeScript 的AI驱动演示文稿编辑器，支持 Typst 格式的幻灯片创建和编辑。

## 🚀 功能特性

- **AI驱动编辑**：通过自然语言与AI助手交互，智能生成和修改幻灯片内容
- **Typst支持**：使用强大的Typst标记语言编写专业演示文稿
- **实时预览**：即时编译和渲染Typst内容，所见即所得
- **页面管理**：在预览界面进行页面切换、添加、删除操作
- **PDF导出**：一键导出整个演示文稿为PDF格式
- **智能编辑模式管理**：防止用户和AI同时编辑，避免内容冲突
- **变更追踪**：自动追踪内容修改，为AI提供上下文信息

## 🏗️ 技术架构

### 前端框架
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 静态类型检查
- **Vite** - 快速构建工具
- **Vitest** - 单元测试框架

### 核心依赖
- **@myriaddreamin/typst.ts** - Typst WebAssembly编译器
- **@myriaddreamin/typst.vue3** - Vue 3 Typst集成组件

## 📁 项目结构

```
ppt-agent/
├── public/                          # 静态资源
│   ├── typst_ts_renderer_bg.wasm   # Typst渲染器WASM
│   └── typst_ts_web_compiler_bg.wasm # Typst编译器WASM
├── src/
│   ├── main.ts                      # 应用入口点
│   ├── App.vue                      # 根组件
│   ├── assets/                      # 资源文件
│   │   └── styles/
│   │       └── main.css            # 全局样式
│   ├── components/                  # 可复用组件
│   │   ├── ChatWindow.vue          # AI聊天界面
│   │   ├── SlideEditor.vue         # 幻灯片编辑器
│   │   ├── SlidePreview.vue        # 幻灯片预览
│   │   └── SettingsDialog.vue      # 设置对话框
│   ├── config/                      # 配置文件
│   │   ├── aiConfig.ts             # AI服务配置
│   │   └── constants.ts            # 应用常量
│   ├── services/                    # 业务逻辑服务
│   │   ├── apiService.ts           # AI API服务
│   │   ├── tools.ts                # AI工具函数定义
│   │   └── typstCompiler.ts        # Typst编译服务
│   ├── store/                       # 状态管理
│   │   ├── index.ts                # Store入口
│   │   ├── slideStore.ts           # 幻灯片状态管理
│   │   ├── chatStore.ts            # 聊天状态管理
│   │   ├── settingsStore.ts        # 设置状态管理
│   │   ├── pptMeta.ts              # PPT元数据管理
│   │   ├── changeTracker.ts        # 变更追踪
│   │   └── editModeManager.ts      # 编辑模式管理
│   ├── types/                       # TypeScript类型定义
│   │   ├── index.ts                # 通用类型
│   │   └── changes.ts              # 变更相关类型
│   ├── views/                       # 页面组件
│   │   └── HomeView.vue            # 主页面
│   └── tests/                       # 测试文件
├── package.json                     # 项目依赖配置
├── tsconfig.json                    # TypeScript配置
├── tsconfig.node.json              # Node.js TypeScript配置
├── vite.config.ts                  # Vite构建配置
├── vitest.setup.ts                 # 测试设置
├── index.html                      # HTML入口文件
├── README.md                       # 项目说明文档
└── TODO.md                         # 待办事项清单
```

## 🔧 核心模块详解

### 1. 状态管理 (store/)

#### slideStore.ts
- **功能**：管理幻灯片内容和项目摘要
- **职责**：
  - 幻灯片增删改查操作
  - 当前页面和查看模式管理
  - 与编辑模式管理器集成，支持用户/AI编辑区分

#### editModeManager.ts
- **功能**：协调用户编辑和AI编辑，防止冲突
- **核心逻辑**：
  - AI修改时用户不能编辑
  - 用户修改时AI不能编辑
  - 支持编辑锁的获取和释放
  - 自动超时释放机制

#### changeTracker.ts
- **功能**：追踪内容变更状态
- **核心逻辑**：
  - 用户编辑时标记页面为dirty
  - AI获取内容后清除dirty状态
  - 为AI提供变更上下文信息

### 2. AI服务集成 (services/)

#### tools.ts
- **功能**：定义AI可调用的工具函数
- **主要工具**：
  - `get_slide_content` - 获取幻灯片内容
  - `update_slide_content` - 更新幻灯片内容
  - `get_slide_summary` - 获取项目摘要
  - `update_slide_summary` - 更新项目摘要
  - `insert_slide` - 插入新幻灯片
  - `delete_slide` - 删除幻灯片

#### apiService.ts
- **功能**：与外部AI服务通信
- **支持**：DeepSeek等AI模型的API调用

### 3. 用户界面 (components/)

#### SlideEditor.vue
- **功能**：专注于内容编辑的文本编辑器
- **特性**：
  - 支持Typst语法的文本编辑
  - 集成编辑模式管理
  - 实时状态显示
  - 切换幻灯片内容和项目摘要编辑

#### SlidePreview.vue
- **功能**：实时预览和页面管理中心
- **特性**：
  - 实时预览Typst渲染结果
  - 页面切换控件（上一页/下一页）
  - 页面管理（添加/删除页面）
  - PDF导出功能
  - 集成Typst WebAssembly编译器

#### ChatWindow.vue
- **功能**：AI聊天交互界面
- **特性**：
  - 自然语言指令处理
  - AI工具调用执行
  - 聊天历史管理

## 🎯 核心设计原则

### 1. 编辑冲突防护
- **问题**：用户手动编辑和AI自动编辑可能产生冲突
- **解决方案**：实现简单而有效的编辑锁机制
  - AI编辑时锁定用户界面
  - 用户编辑时阻止AI修改操作
  - 自动超时释放避免死锁

### 2. 状态同步策略
- **用户操作**：立即标记为dirty，触发变更追踪
- **AI操作**：获取内容时清除dirty状态，修改时不标记dirty
- **数据流向**：单向数据流，通过store集中管理状态

### 3. 模块化架构
- **职责分离**：每个模块有明确的功能边界
- **松耦合**：模块间通过接口通信，便于测试和维护
- **可扩展性**：支持新功能的插入和现有功能的扩展

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm >= 7

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm run test
```

## 🔑 AI集成配置

项目支持通过环境变量配置AI服务：

```bash
# 在项目根目录创建 .env 文件
VITE_AI_API_URL=your_ai_api_url
VITE_AI_API_KEY=your_ai_api_key
```

## 📈 工作流程

### 典型用户场景
1. **用户输入自然语言指令** → ChatWindow.vue
2. **AI理解指令并调用工具** → apiService.ts → tools.ts
3. **工具函数修改状态** → slideStore.ts, changeTracker.ts
4. **界面实时更新** → SlideEditor.vue, SlidePreview.vue

### 编辑模式管理流程
1. **用户开始编辑** → 获取用户编辑锁
2. **AI需要修改** → 检查编辑权限，如被锁定则等待或提示
3. **AI获取内容** → 自动清除对应dirty状态
4. **编辑完成** → 释放编辑锁

## 🛠️ 开发指南

### 添加新的AI工具
1. 在 `services/tools.ts` 中定义工具函数
2. 在 `toolDefinitions` 数组中添加工具描述
3. 确保工具函数正确处理编辑模式管理

### 扩展状态管理
1. 在对应的store文件中添加新状态
2. 更新类型定义文件
3. 在组件中使用新状态

### 添加新组件
1. 在 `components/` 目录创建Vue组件
2. 使用TypeScript和组合式API
3. 集成必要的状态管理和编辑模式检查

## 🤝 贡献指南

1. Fork项目并创建feature分支
2. 遵循项目的代码风格和命名规范
3. 添加必要的测试覆盖
4. 提交Pull Request并描述变更内容

## 📝 许可证

MIT License

---

## 🔗 相关链接

- [Typst官方文档](https://typst.app/docs)
- [Vue 3官方文档](https://v3.vuejs.org/)
- [TypeScript官方文档](https://www.typescriptlang.org/)

---

*最后更新：2024年6月29日*
