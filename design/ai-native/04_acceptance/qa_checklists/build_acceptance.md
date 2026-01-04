# Build Acceptance Checklist v1.0

> **用途**: 每次构建后的基础验收
> **执行频率**: 每次 CI 构建成功后
> **执行者**: 自动化 + L3 测试执行

---

## 1. 构建门禁（自动化）

### 1.1 编译检查
- [ ] TypeScript 编译通过 (`npm run typecheck`)
- [ ] 无编译错误
- [ ] 无类型警告（strict mode）

### 1.2 代码规范检查
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] Prettier 格式化通过
- [ ] 无新增警告

### 1.3 单元测试
- [ ] 单元测试全部通过 (`npm run test`)
- [ ] 核心模块覆盖率 ≥ 80%
- [ ] 无跳过的测试用例

### 1.4 Schema 校验
- [ ] 事件 Schema 校验通过 (`npm run validate:events`)
- [ ] 对白数据校验通过 (`npm run validate:dialogues`)
- [ ] 卡片数据校验通过 (`npm run validate:cards`)
- [ ] Zone 数据校验通过 (`npm run validate:zones`)

### 1.5 资源校验
- [ ] 资源命名规范通过 (`npm run validate:assets:naming`)
- [ ] 资源尺寸规范通过 (`npm run validate:assets:size`)
- [ ] 无缺失引用的资源

---

## 2. 运行门禁（人工/E2E）

### 2.1 启动检查
- [ ] 游戏可正常启动
- [ ] 无控制台错误
- [ ] 启动时间 < 5秒

### 2.2 主菜单检查
- [ ] 主菜单正常显示
- [ ] 按钮可点击响应
- [ ] UI 布局正常

### 2.3 基础功能检查
- [ ] 新游戏可进入
- [ ] 对话系统可触发
- [ ] 选择系统可交互
- [ ] 存档系统可读写

### 2.4 性能检查
- [ ] 帧率 ≥ 30FPS
- [ ] 无明显卡顿
- [ ] 内存占用 < 200MB

---

## 3. 阻断条件

以下任一条件不满足，**构建不通过**：

| 类别 | 条件 |
|------|------|
| 编译 | TypeScript 编译失败 |
| 规范 | ESLint 有错误级别问题 |
| 测试 | 单元测试失败 |
| Schema | 任一 Schema 校验失败 |
| 启动 | 游戏无法启动 |
| 崩溃 | 主流程中出现崩溃 |

---

## 4. 执行记录模板

```markdown
## 构建验收记录

**构建版本**: v0.1.0-build.123
**执行时间**: 2025-12-29 15:00
**执行者**: AI/Human

### 自动化检查
- [x] TypeScript 编译: ✅
- [x] ESLint: ✅
- [x] 单元测试: ✅ (45/45)
- [x] Schema 校验: ✅
- [x] 资源校验: ✅

### 人工检查
- [x] 启动: ✅ (3.2s)
- [x] 主菜单: ✅
- [x] 基础功能: ✅
- [x] 性能: ✅ (45FPS, 120MB)

### 结果
**通过** / 不通过

### 备注
- 无
```

---

## 5. 相关文档

- QA 总纲: `docs/01_bibles/qa_bible.md`
- 冒烟测试: `docs/04_acceptance/qa_checklists/smoke.md`
- 技术总纲: `docs/01_bibles/tech_bible.md`

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 生效*

