# 🤝 贡献指南

感谢你对 **Footnote** 项目的关注！本文档将帮助你了解如何参与项目开发。

---

## 📋 目录

- [行为准则](#行为准则)
- [开发环境搭建](#开发环境搭建)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

---

## 行为准则

- 尊重所有参与者
- 建设性地讨论问题
- 专注于项目目标

---

## 开发环境搭建

### 1. 克隆仓库

```bash
git clone https://github.com/YourOrg/Footnote.git
cd Footnote
```

### 2. 安装依赖

```bash
# Node.js 依赖
npm install

# Playwright 浏览器（E2E 测试需要）
npx playwright install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 运行测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e
```

---

## 开发流程

### 分支策略

| 分支 | 说明 |
|------|------|
| `main` | 主分支，保持稳定 |
| `develop` | 开发分支，功能合并目标 |
| `feature/*` | 功能分支 |
| `bugfix/*` | 问题修复分支 |
| `hotfix/*` | 紧急修复分支 |

### 开发步骤

1. 从 `develop` 创建功能分支
2. 开发并测试功能
3. 确保所有测试通过
4. 提交 Pull Request 到 `develop`

```bash
# 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 开发完成后
npm run lint
npm run typecheck
npm run test

# 提交代码
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

---

## 代码规范

### TypeScript 规范

```typescript
// ✅ 使用 const，其次 let，禁止 var
const MAX_DIALOGUE_LENGTH = 200;
let currentZone = 'C0-Z1';

// ✅ 所有函数必须有明确的返回类型
function loadDialogue(id: string): IDialogue {
  // ...
}

// ✅ 接口使用 I 前缀
interface IDialogue {
  id: string;
  text: string;
}

// ✅ 私有成员使用 _ 前缀
class NarrativeEngine {
  private _worldState: IWorldState;
}

// ❌ 避免 any
function process(data: any) { } // 不推荐
function process(data: unknown) { } // 推荐
```

### 文件命名规范

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 类/组件文件 | PascalCase | `NarrativeEngine.ts` |
| 工具函数文件 | camelCase | `formatText.ts` |
| 常量文件 | CONSTANT | `GAME_CONFIG.ts` |
| 测试文件 | *.test.ts | `narrative.test.ts` |
| 类型声明 | *.d.ts | `phaser.d.ts` |

### 目录结构

新增功能时，请遵循现有目录结构：

- `src/scenes/` - Phaser 场景
- `src/systems/` - 核心系统模块
- `src/data/` - YAML 数据文件
- `src/types/` - 类型定义

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具变动 |
| `revert` | 回退提交 |

### 示例

```bash
# 新功能
git commit -m "feat(narrative): add dialogue branching system"

# Bug 修复
git commit -m "fix(save): resolve IndexedDB quota exceeded error"

# 文档更新
git commit -m "docs: update README with new commands"

# 带详细说明
git commit -m "feat(ability): implement depth perception

- Add DepthPerceptionAbility class
- Integrate with WorldState system
- Add visual effects for depth view

Closes #123"
```

---

## Pull Request 流程

### 1. 创建 PR 前

- [ ] 代码通过 lint 检查：`npm run lint`
- [ ] 类型检查通过：`npm run typecheck`
- [ ] 单元测试通过：`npm run test`
- [ ] E2E 测试通过：`npm run test:e2e`
- [ ] 更新相关文档

### 2. PR 标题格式

与 commit 格式一致：

```
feat(narrative): add dialogue branching system
```

### 3. PR 描述模板

```markdown
## 📋 变更说明

简要描述本次变更内容。

## 🎯 关联 Issue

Closes #123

## 📝 变更类型

- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 其他

## ✅ 测试清单

- [ ] 单元测试通过
- [ ] E2E 测试通过
- [ ] 手动测试通过

## 📸 截图（如适用）

添加相关截图。
```

### 4. Code Review

- 至少需要 1 位 reviewer 批准
- 所有 CI 检查必须通过
- 解决所有 review 意见

---

## 问题反馈

### 报告 Bug

请使用 Issue 模板，包含以下信息：

1. **问题描述**：清晰描述问题
2. **复现步骤**：详细的复现步骤
3. **期望行为**：你期望发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：浏览器、系统版本等
6. **截图/日志**：如有

### 功能建议

1. **需求描述**：清晰描述需求
2. **使用场景**：在什么情况下需要
3. **解决方案**：你设想的实现方式

---

## 📚 相关资源

- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Phaser 3 文档](https://photonstorm.github.io/phaser3-docs/)
- [Vite 文档](https://vitejs.dev/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)

---

## 🙏 感谢

感谢所有为项目做出贡献的开发者！

---

*如有任何问题，欢迎在 Issue 中讨论。*

