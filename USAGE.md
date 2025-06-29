# 使用说明

## 解决API密钥问题

如果您遇到 "Authentication failed" 或 401 错误，请按以下步骤操作：

### 1. 获取有效的DeepSeek API密钥

1. 访问 [DeepSeek官网](https://www.deepseek.com/)
2. 注册账户并登录
3. 进入API管理页面
4. 创建新的API密钥
5. 复制完整的API密钥（通常以 `sk-` 开头）

### 2. 配置API密钥

1. 在应用右上角点击 **设置** 按钮
2. 在 "API Key" 字段中粘贴您的完整API密钥
3. 确认 "API Base URL" 为：`https://api.deepseek.com/v1`
4. 点击 **"Test Connection"** 按钮测试连接
5. 如果测试成功，点击 **"Save"** 保存设置

### 3. 常见问题

**Q: 为什么我的API密钥无效？**
- 确保复制了完整的API密钥，没有遗漏任何字符
- 检查API密钥是否已过期
- 确认您的DeepSeek账户有足够的余额

**Q: 如何清除旧的无效密钥？**
- 打开浏览器开发者工具（F12）
- 在控制台中输入：`localStorage.removeItem('apiKey')`
- 刷新页面并重新设置API密钥

**Q: 连接测试失败怎么办？**
- 检查网络连接
- 确认API密钥格式正确
- 尝试重新生成API密钥

### 4. 开发模式启动

```bash
npm install
npm run dev
```

### 5. 生产构建

```bash
npm run build
```

## 功能特性

- ✅ AI驱动的Typst幻灯片编辑
- ✅ 实时预览和编译
- ✅ 页面管理（在预览界面）
- ✅ PDF导出功能
- ✅ 智能编辑模式管理
- ✅ 错误处理和恢复

## 联系支持

如果遇到其他问题，请检查：
1. 浏览器控制台的错误信息
2. 网络连接状态
3. API服务的可用性

---
*最后更新：2024年6月29日*
