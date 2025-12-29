# 《备注 / Footnote》QA 总纲 (QA Bible) v1.0

> **文档性质**：QA层最高指导文件  
> **版本**: v1.0  
> **创建日期**: 2025-12-29  
> **来源文档**: `.cursor/rules/04-testing.mdc`, `.cursor/rules/07-auto-testing.mdc`  
> **状态**: 基本冻结（变更需 CR）

---

## 1. 测试策略

### 1.1 测试金字塔

```
                    ┌─────────────┐
                    │    E2E      │  ← 关键路径（~10%）
                    │   Tests     │
                    ├─────────────┤
                    │ Integration │  ← 系统集成（~20%）
                    │   Tests     │
                    ├─────────────┤
                    │    Unit     │  ← 核心逻辑（~70%）
                    │   Tests     │
                    └─────────────┘
```

### 1.2 测试范围

| 测试类型 | 范围 | 工具 | 触发时机 |
|---------|------|------|---------|
| **单元测试** | 函数/类 | Vitest | 每次提交 |
| **集成测试** | 模块间交互 | Vitest | 每次PR |
| **E2E测试** | 用户流程 | Playwright | 每日/里程碑 |
| **性能测试** | 帧率/内存 | Chrome DevTools | 里程碑 |
| **兼容性测试** | 多设备 | 真机/模拟器 | 里程碑 |

### 1.3 覆盖率目标

| 模块 | 最低覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| 核心系统 | 60% | 80% |
| 工具函数 | 80% | 90% |
| UI组件 | 40% | 60% |
| 数据加载 | 70% | 85% |

---

## 2. 用例分层

### 2.1 冒烟测试（Smoke）

**目标**: 验证构建基本可用

**范围**（≤30条）:
- 游戏启动
- 场景加载
- 核心交互
- 存档读写

**执行时机**: 每次构建

### 2.2 功能测试（Functional）

**目标**: 验证各功能正确性

**范围**:
- 叙事系统完整流程
- 能力系统各能力
- 卡片收集系统
- 计数器系统
- UI交互

**执行时机**: 功能完成后

### 2.3 回归测试（Regression）

**目标**: 确保修改不破坏已有功能

**范围**:
- 已修复的Bug复现检查
- 核心流程稳定性
- 边界条件

**执行时机**: 每个里程碑前

### 2.4 性能测试（Performance）

**目标**: 验证性能达标

**范围**:
- 首屏加载时间
- 运行帧率
- 内存占用
- 场景切换耗时

**执行时机**: 里程碑

---

## 3. 缺陷分级

### 3.1 分级标准

| 等级 | 定义 | 示例 | 修复时限 |
|------|------|------|---------|
| **Blocker** | 完全阻塞，无法继续 | 游戏无法启动、存档丢失、主线卡死 | 立即 |
| **Critical** | 核心功能受损 | 对话无法触发、能力失效、选择无响应 | 24h |
| **Major** | 重要功能问题 | UI显示错误、音频不播放、动画卡顿 | 48h |
| **Minor** | 小问题，有替代 | 文字超框、图标模糊、提示不清晰 | 下版本 |

### 3.2 分级判断流程

```
问题发生
    │
    ├── 能继续游戏吗？
    │   └── 否 → Blocker
    │
    ├── 核心功能正常吗？
    │   └── 否 → Critical
    │
    ├── 影响明显吗？
    │   └── 是 → Major
    │
    └── 其他 → Minor
```

---

## 4. 验收门禁

### 4.1 构建验收

每次构建必须通过：

```markdown
# Build Acceptance Checklist

## 编译门禁
- [ ] TypeScript 编译通过（0 errors）
- [ ] ESLint 检查通过
- [ ] 单元测试 100% 通过
- [ ] 覆盖率 ≥60%

## Schema 门禁
- [ ] 对白数据 Schema 校验通过
- [ ] 事件数据 Schema 校验通过
- [ ] 卡片数据 Schema 校验通过
- [ ] Zone 数据 Schema 校验通过

## 资源门禁
- [ ] 资源命名校验通过
- [ ] 资源引用完整（无缺失）
- [ ] 音频格式正确

## 运行门禁
- [ ] 游戏可启动
- [ ] 主菜单可进入
- [ ] 存档系统可用
```

### 4.2 里程碑验收

| 里程碑 | 验收条件 |
|-------|---------|
| **M1** | 冒烟测试 100% 通过 |
| **M2** | 叙事系统功能测试通过 |
| **M3** | 能力系统功能测试通过 |
| **M4** | 全流程可通关 |
| **M5** | Blocker 0, Critical 0, Major ≤5 |

### 4.3 发布验收

```markdown
# Release Acceptance Checklist

## 缺陷状态
- [ ] Blocker: 0
- [ ] Critical: 0
- [ ] Major: ≤3
- [ ] 无 P0 已知问题

## 性能指标
- [ ] 首屏加载 <3s (4G)
- [ ] 运行帧率 ≥60fps
- [ ] 内存占用 <100MB
- [ ] 包体大小 <10MB

## 兼容性
- [ ] iOS Safari 通过
- [ ] Android Chrome 通过
- [ ] 微信小游戏通过
- [ ] PC Chrome 通过

## 完整性
- [ ] 全章节可通关
- [ ] 三结局可达成
- [ ] 存档功能正常
- [ ] 无明显体验问题
```

---

## 5. 自动化策略

### 5.1 `__DEBUG__` API 使用

测试脚本通过 `__DEBUG__` API 控制游戏状态：

```typescript
// E2E 测试示例
test('R值达到阈值触发系统语气停顿', async ({ page }) => {
  // 设置初始状态
  await page.evaluate(() => {
    window.__DEBUG__.setCounter('R', 2);
  });
  
  // 执行无收益行为
  await page.click('[data-testid="redundant-action"]');
  
  // 验证 R 值增加
  const state = await page.evaluate(() => window.__DEBUG__.getState());
  expect(state.counters.R).toBe(3);
  
  // 验证系统反馈
  await expect(page.locator('[data-testid="system-pause"]')).toBeVisible();
});
```

### 5.2 测试数据管理

| 数据类型 | 位置 | 说明 |
|---------|------|------|
| 固定测试数据 | `tests/fixtures/` | 确定性输入 |
| 存档快照 | `tests/saves/` | 特定游戏状态 |
| Mock数据 | `tests/mocks/` | 模拟外部依赖 |

### 5.3 CI 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### 5.4 E2E 测试框架

```typescript
// tests/e2e/helpers/game.helper.ts
export class GameHelper {
  constructor(private page: Page) {}
  
  async goto(zoneId: string): Promise<void> {
    await this.page.evaluate((id) => {
      window.__DEBUG__.goto(id);
    }, zoneId);
  }
  
  async setCounter(name: 'R' | 'P' | 'W', value: number): Promise<void> {
    await this.page.evaluate((n, v) => {
      window.__DEBUG__.setCounter(n, v);
    }, name, value);
  }
  
  async startDialogue(dialogueId: string): Promise<void> {
    await this.page.evaluate((id) => {
      window.__DEBUG__.startDialogue(id);
    }, dialogueId);
  }
  
  async getState(): Promise<IWorldState> {
    return await this.page.evaluate(() => {
      return window.__DEBUG__.getState();
    });
  }
}
```

---

## 6. 缺陷管理

### 6.1 缺陷 Issue 模板

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: 缺陷报告
labels: ["bug", "triage"]

body:
  - type: dropdown
    id: severity
    attributes:
      label: 严重等级
      options:
        - Blocker
        - Critical
        - Major
        - Minor
    validations:
      required: true
      
  - type: textarea
    id: repro
    attributes:
      label: 复现步骤（≤6步）
    validations:
      required: true
      
  - type: textarea
    id: expected
    attributes:
      label: 期望结果
    validations:
      required: true
      
  - type: textarea
    id: actual
    attributes:
      label: 实际结果
    validations:
      required: true
      
  - type: textarea
    id: logs
    attributes:
      label: 日志/截图
      
  - type: input
    id: env
    attributes:
      label: 环境信息
      placeholder: "Chrome 120, iOS 17, Windows 11..."
    validations:
      required: true
```

### 6.2 缺陷生命周期

```
New → Confirmed → In Progress → Fixed → Verified → Closed
                      │                    │
                      └── Won't Fix ◄──────┘
                      │
                      └── Duplicate
```

### 6.3 缺陷复现要求

| 要素 | 要求 |
|------|------|
| 步骤 | ≤6步，每步一个操作 |
| 数据 | 提供存档/截图/日志 |
| 环境 | 浏览器/设备/版本 |
| 频率 | 必现/概率/特定条件 |

---

## 7. 测试用例编写规范

### 7.1 单元测试

```typescript
// 命名: {模块}.test.ts
// 位置: tests/unit/

describe('WorldState', () => {
  describe('counters', () => {
    it('should increment R counter correctly', () => {
      const state = new WorldState();
      state.incrementR(1);
      expect(state.getCounter('R')).toBe(1);
    });
    
    it('should recalculate W when R or P changes', () => {
      const state = new WorldState();
      const initialW = state.getCounter('W');
      state.incrementR(5);
      expect(state.getCounter('W')).toBeLessThan(initialW);
    });
  });
});
```

### 7.2 E2E 测试

```typescript
// 命名: {功能}.e2e.ts
// 位置: tests/e2e/

import { test, expect } from '@playwright/test';
import { GameHelper } from './helpers/game.helper';

test.describe('对话系统', () => {
  let game: GameHelper;
  
  test.beforeEach(async ({ page }) => {
    game = new GameHelper(page);
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-ready"]');
  });
  
  test('对话可以正常进行', async ({ page }) => {
    await game.startDialogue('C0Z1_opening');
    
    // 验证对话框出现
    await expect(page.locator('[data-testid="dialogue-box"]')).toBeVisible();
    
    // 点击继续
    await page.click('[data-testid="dialogue-continue"]');
    
    // 验证对话推进
    await expect(page.locator('[data-testid="dialogue-text"]'))
      .not.toHaveText('又是平静的一天。');
  });
});
```

---

## 8. 质量报告

### 8.1 每日报告模板

```markdown
# 每日质量报告 - YYYY-MM-DD

## 构建状态
- 最新构建: #xxx
- 构建结果: ✅/❌
- 通过率: xx%

## 缺陷统计
| 等级 | 新增 | 修复 | 待处理 |
|------|------|------|--------|
| Blocker | | | |
| Critical | | | |
| Major | | | |
| Minor | | | |

## 测试执行
- 单元测试: xxx/xxx 通过
- E2E测试: xxx/xxx 通过
- 覆盖率: xx%

## 风险项
- ...

## 明日计划
- ...
```

### 8.2 里程碑报告模板

```markdown
# 里程碑质量报告 - M{N}

## 概述
- 里程碑: M{N} - {名称}
- 周期: YYYY-MM-DD ~ YYYY-MM-DD
- 状态: 通过/不通过

## 验收结果
- [ ] 验收条件1
- [ ] 验收条件2
- ...

## 缺陷汇总
| 等级 | 发现 | 修复 | 遗留 |
|------|------|------|------|
| Blocker | | | |
| Critical | | | |
| Major | | | |
| Minor | | | |

## 测试覆盖
- 冒烟测试: xx/xx
- 功能测试: xx/xx
- 回归测试: xx/xx
- 覆盖率: xx%

## 性能数据
- 首屏加载: xxms
- 帧率: xxfps
- 内存: xxMB

## 遗留风险
- ...

## 建议
- ...
```

---

## 9. 参考文档索引

| 内容 | 文件路径 |
|------|---------|
| 测试规范MDC | `.cursor/rules/04-testing.mdc` |
| 自动化测试MDC | `.cursor/rules/07-auto-testing.mdc` |
| 测试配置 | `vitest.config.ts`, `playwright.config.ts` |
| 测试代码 | `tests/` |

---

*文档版本: v1.0*  
*创建日期: 2025-12-29*  
*状态: 基本冻结*

