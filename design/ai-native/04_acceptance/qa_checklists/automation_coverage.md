# 自动化验收覆盖规范 v1.0

> **用途**: 定义自动化测试的覆盖目标和执行标准  
> **维护者**: L2_automation_lead  
> **更新频率**: 每里程碑更新

---

## 1. 自动化覆盖目标

### 1.1 测试类型覆盖率目标

| 测试类型 | 当前覆盖 | 目标覆盖 | 自动化比例 |
|----------|----------|----------|------------|
| 单元测试 | 88% | **95%** | 100% 自动化 |
| 集成测试 | 60% | **80%** | 100% 自动化 |
| E2E 测试 | 40% | **70%** | 90% 自动化 |
| 冒烟测试 | 70% | **100%** | 100% 自动化 |
| 回归测试 | 50% | **85%** | 95% 自动化 |

### 1.2 模块覆盖率目标

| 模块 | 单元测试 | 集成测试 | E2E |
|------|----------|----------|-----|
| NarrativeEngine | ≥95% | ≥80% | ✅ |
| WorldState | ≥95% | ≥85% | ✅ |
| AbilitySystem | ≥90% | ≥80% | ✅ |
| CounterSystem | ≥95% | ≥90% | ✅ |
| DialogueUI | ≥85% | ≥70% | ✅ |
| SaveManager | ≥90% | ≥85% | ✅ |
| EventSystem | ≥90% | ≥80% | ✅ |

---

## 2. CI/CD 自动化流水线

### 2.1 构建时自动执行

```yaml
# .github/workflows/ci.yml 要求
on: [push, pull_request]

jobs:
  build:
    steps:
      - name: TypeScript Check
        run: npm run typecheck
        # 失败即阻断
        
      - name: Lint Check
        run: npm run lint
        # 失败即阻断
        
      - name: Unit Tests
        run: npm run test:unit -- --coverage
        # 覆盖率 < 80% 即阻断
        
      - name: Schema Validation
        run: npm run validate:all
        # 失败即阻断
        
      - name: Build
        run: npm run build
        # 失败即阻断
```

### 2.2 PR 合并门禁

| 检查项 | 阻断条件 | 自动化 |
|--------|----------|--------|
| TypeScript 编译 | 任何错误 | ✅ |
| ESLint | error 级别 | ✅ |
| 单元测试 | 任何失败 | ✅ |
| 覆盖率 | < 80% | ✅ |
| Schema 校验 | 任何失败 | ✅ |
| 构建产物 | 构建失败 | ✅ |

### 2.3 定时任务

| 任务 | 频率 | 自动化 |
|------|------|--------|
| E2E 冒烟测试 | 每日 00:00 | ✅ |
| 性能基准测试 | 每周一 | ✅ |
| 安全扫描 | 每周 | ✅ |
| 依赖更新检查 | 每日 | ✅ |

---

## 3. 自动化测试脚本清单

### 3.1 npm scripts 定义

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    
    "test": "vitest run",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test tests/e2e/smoke.spec.ts",
    "test:coverage": "vitest run --coverage",
    
    "validate:all": "npm run validate:events && npm run validate:dialogues && npm run validate:cards && npm run validate:zones",
    "validate:events": "node scripts/validate-events.mjs",
    "validate:dialogues": "node scripts/validate-dialogues.mjs",
    "validate:cards": "node scripts/validate-cards.mjs",
    "validate:zones": "node scripts/validate-zones.mjs",
    "validate:assets": "node scripts/qa/asset-qc.mjs",
    
    "perf:benchmark": "node scripts/perf-benchmark.mjs",
    "perf:lighthouse": "lighthouse http://localhost:8080 --output=json"
  }
}
```

### 3.2 测试文件结构

```
tests/
├── unit/                    # 单元测试
│   ├── systems/
│   │   ├── NarrativeEngine.test.ts
│   │   ├── WorldState.test.ts
│   │   ├── AbilitySystem.test.ts
│   │   └── CounterSystem.test.ts
│   ├── ui/
│   │   ├── DialogueUI.test.ts
│   │   └── CardUI.test.ts
│   └── utils/
│       └── validators.test.ts
│
├── integration/             # 集成测试
│   ├── narrative-world.test.ts
│   ├── ability-counter.test.ts
│   └── save-load.test.ts
│
├── e2e/                     # E2E 测试
│   ├── smoke.spec.ts        # 冒烟测试
│   ├── prologue.spec.ts     # 序章流程
│   ├── dialogue.spec.ts     # 对话系统
│   ├── choice.spec.ts       # 选择系统
│   └── save.spec.ts         # 存档系统
│
└── fixtures/                # 测试数据
    ├── mock-dialogues.yaml
    ├── mock-events.yaml
    └── mock-world-state.json
```

---

## 4. 自动化验收报告格式

### 4.1 每日自动化报告

```markdown
# 自动化测试报告 - YYYY-MM-DD

## 执行概要
- 执行时间: 2026-01-19 00:00:00
- 总耗时: 12m 30s
- 触发方式: 定时任务

## 测试结果

### 单元测试
- 总用例: 191
- 通过: 191 ✅
- 失败: 0
- 覆盖率: 88.5%

### 集成测试
- 总用例: 45
- 通过: 44 ✅
- 失败: 1 ❌
- 失败用例: `ability-counter.test.ts:极端P值组合`

### E2E 冒烟测试
- 总用例: 30
- 通过: 30 ✅
- 失败: 0

### Schema 校验
- events: ✅ (156 files)
- dialogues: ✅ (23 files)
- cards: ✅ (45 files)
- zones: ✅ (57 files)

## 性能指标
- 首屏渲染: 1.8s (目标 <3s) ✅
- 帧率: 58 FPS (目标 ≥30) ✅
- 内存峰值: 145MB (目标 <200MB) ✅

## 结论
**通过** - 1 个非阻断失败，已创建 Issue #xxx
```

### 4.2 覆盖率趋势追踪

| 日期 | 单元测试 | 集成测试 | E2E | 趋势 |
|------|----------|----------|-----|------|
| 01-15 | 85% | 55% | 35% | - |
| 01-16 | 86% | 58% | 38% | ⬆️ |
| 01-17 | 87% | 60% | 40% | ⬆️ |
| 01-18 | 88% | 60% | 40% | → |
| 01-19 | 88.5% | 62% | 42% | ⬆️ |

---

## 5. 人工验收项（不可自动化）

以下项目需人工验收，无法完全自动化：

| 类别 | 验收项 | 原因 |
|------|--------|------|
| 视觉 | UI 美观度 | 主观判断 |
| 视觉 | 动画流畅度 | 主观感受 |
| 叙事 | 对白情感表达 | 需人工审核 |
| 叙事 | 剧情连贯性 | 需通读理解 |
| UX | 交互体验 | 需实际操作 |
| 音频 | 音效匹配度 | 主观判断 |

**建议**：人工验收项目纳入里程碑验收 Checklist，由 QA Lead 组织执行。

---

## 6. 自动化改进计划

### 6.1 短期（1-2周）
- [ ] 补充 CounterSystem 边界测试（对应新增的 97 个用例）
- [ ] 增加 E2E 存档系统测试覆盖
- [ ] 实现性能基准自动对比

### 6.2 中期（1月内）
- [ ] 实现视觉回归测试（截图对比）
- [ ] 增加可访问性自动检查
- [ ] 实现错误上报自动分类

### 6.3 长期
- [ ] AI 辅助测试用例生成
- [ ] 智能化失败分析
- [ ] 自动修复建议

---

## 7. 相关文档

- QA 总纲: `design/ai-native/01_bibles/qa_bible.md`
- 冒烟测试: `design/ai-native/04_acceptance/qa_checklists/smoke.md`
- 构建验收: `design/ai-native/04_acceptance/qa_checklists/build_acceptance.md`
- 边界测试用例: `design/ai-native/02_specs/systems/counter_boundary_test_cases.md`
- 性能规范: `design/ai-native/02_specs/tech/performance_spec.md`

---

*版本: v1.0 | 创建: 2026-01-19 | 状态: 生效*
