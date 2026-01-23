# 游戏设计验收测试说明

## 概述

本测试套件基于 L2-gameplay-lead 审计报告创建，目标是验证游戏设计的核心功能点：

1. **交互逻辑闭环** - 物品拾取、状态变更、UI反馈
2. **价值体系闭环** - 卡片获取入口、R值累积
3. **状态一致性** - Flag 设置与读取、对象显隐
4. **章节完成条件** - 进度触发器
5. **结局判定逻辑** - R/W值与结局选择

## 测试文件结构

```
game/tests/interactive/
├── specs/
│   ├── 10-chapter-flow.spec.ts      # 章节流程测试
│   ├── 11-endings.spec.ts           # 结局判定测试
│   └── 12-gameplay-design-verification.spec.ts  # 玩法设计验收测试 [新增]
└── chapters/
    └── C0/
        ├── C0-Z1.test.js            # 序章第1区（已更新）
        ├── C0-Z2.test.js            # 序章第2区
        ├── C0-Z3.test.js            # 序章第3区
        └── C0-Z4.test.js            # 序章第4区（已更新）
```

## 测试用例覆盖

### 序章 C0 测试覆盖

| Zone | 测试ID | 测试名称 | 优先级 | 验收点 |
|------|--------|----------|--------|--------|
| C0-Z1 | TC-C0Z1-00 | 开场独白入场自动触发 | P0 | onEnter 事件 |
| C0-Z1 | TC-C0Z1-01b | 身份卡长按细节 | P1 | 长按交互、伏笔F06 |
| C0-Z1 | TC-C0Z1-03 | 储物柜交互 | P0 | 工单卡片获取 |
| C0-Z1 | TC-C0Z1-06 | 祷词板交互 | P1 | 祷词卡片获取 |
| C0-Z1 | TC-C0Z1-08 | Flag一致性验证 | P2 | FLAG_C0Z1_NOTICE_EXAMINED |
| C0-Z4 | TC-C0Z4-02a | 任务板锁定 | P0 | 前置条件检查 |
| C0-Z4 | TC-C0Z4-03a | 顾临对话-明白 | P0 | 警告卡片获取 |
| C0-Z4 | TC-C0Z4-03b | 顾临对话-日期问题 | P1 | Flag名称一致性 |

### 全局设计验收测试 (12-gameplay-design-verification.spec.ts)

| 测试ID | 测试名称 | 验收类型 |
|--------|----------|----------|
| interaction-001 | 物品拾取流程 | 交互逻辑闭环 |
| interaction-002 | 对话选择影响状态 | 交互逻辑闭环 |
| value-001 | 序章卡片全获取 | 价值体系闭环 |
| consistency-001 | Flag设置与读取 | 状态一致性 |
| consistency-002 | 对象显隐条件 | 状态一致性 |
| chapter-001 | C0序章完成条件 | 章节完成 |
| chapter-002 | C1第一章完成条件 | 章节完成 |
| ending-001 | 结局A条件验证 | 结局判定 |
| ending-002 | 结局B条件验证 | 结局判定 |
| ending-003 | 结局C条件验证 | 结局判定 |
| rite-001 | CF-Z2仪式互斥 | 互斥逻辑 |
| complete-001 | CF-Z6通关闭环 | 通关检测 |
| longpress-001 | C0-Z1身份卡细节 | 长按交互 |
| longpress-002 | C0-Z3薄墙回声 | 长按交互 |
| precondition-001 | C0-Z4任务板前置 | 前置条件 |
| onenter-001 | C0-Z1开场独白 | 入场事件 |

## 运行测试

### 方式1: 在浏览器中运行 ChromeMCP 测试

1. 启动游戏开发服务器
```bash
cd game && npm run dev
```

2. 在浏览器中打开游戏 `http://localhost:5173`

3. 打开浏览器控制台，加载测试脚本：
```javascript
// 加载测试辅助函数
const script = document.createElement('script');
script.src = '/tests/interactive/chapters/_helpers.js';
document.body.appendChild(script);

// 加载 C0-Z1 测试
const c0z1 = document.createElement('script');
c0z1.src = '/tests/interactive/chapters/C0/C0-Z1.test.js';
document.body.appendChild(c0z1);
```

4. 运行测试：
```javascript
// 运行 C0-Z1 所有测试
const { runZoneTests, generateReport } = window;
const results = await runZoneTests(window.C0_Z1_TESTS.TESTS);
generateReport(results);
```

### 方式2: 使用 DEBUG API 快速验证

```javascript
// 验证卡片获取
window.__DEBUG__.teleport('C0-Z1');
window.__DEBUG__.obtainCard('CARD_C0_IDENTITY');
console.log(window.__DEBUG__.getGameState().cards);

// 验证 Flag 设置
window.__DEBUG__.setFlag('FLAG_C0Z1_NOTICE_EXAMINED', true);
console.log(window.__DEBUG__.getFlag('FLAG_C0Z1_NOTICE_EXAMINED'));

// 验证 R 值
window.__DEBUG__.setR(6);
console.log(window.__DEBUG__.getGameState().counters.R);
```

## 测试标签说明

| 标签 | 含义 |
|------|------|
| `P0` | 阻断性问题，必须修复 |
| `P1` | 重要问题，影响体验 |
| `P2` | 一般问题，建议修复 |
| `P3` | 优化建议 |
| `onEnter` | 入场自动触发事件 |
| `longPress` | 长按交互 |
| `card` | 卡片获取验证 |
| `flag-consistency` | Flag 名称一致性 |
| `precondition` | 前置条件检查 |
| `chapter-complete` | 章节完成标记 |
| `foreshadow` | 伏笔投放/加深 |
| `zone-transition` | Zone 跳转 |

## 验收标准

### P0 问题（阻断性）
- [ ] 所有卡片都有获取入口
- [ ] 章节完成标记可以被正确触发
- [ ] 结局判定逻辑正确
- [ ] 必要的前置条件检查生效

### P1 问题（重要）
- [ ] 所有对话分支可达
- [ ] Flag 名称在设置和读取时一致
- [ ] 长按交互正确触发
- [ ] 伏笔正确投放

### P2 问题（一般）
- [ ] 对话内容完整
- [ ] 对象显隐条件正确
- [ ] R/P/W 值变化符合设计

## 关联文档

- 审计报告: `design/ai-native/02_specs/gameplay/c0_prologue_audit_report.md`
- 修复记录: `design/ai-native/02_specs/gameplay/c0_prologue_fix_changelog.md`
- 全游戏审计: `design/ai-native/02_specs/gameplay/full_game_audit_summary.md`
- L2-gameplay-lead 职责: `.cursor/agents/L2-gameplay-lead.md`

---

*文档版本: 1.0*
*创建日期: 2026-01-23*
*基于审计报告: c0_prologue_audit_report.md*
