# 《备注 / Footnote》技术总纲 (Tech Bible) v1.0

> **文档性质**：技术层最高指导文件  
> **版本**: v1.0  
> **创建日期**: 2025-12-29  
> **来源文档**: `design/05-tech/技术设计文档TDD_v1.md`  
> **状态**: 基本冻结（变更需 CR）

---

## 1. 技术栈

### 1.1 核心技术

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行时** | Phaser 3 | 3.70+ | 游戏引擎 |
| **语言** | TypeScript | 5.0+ | strict模式 |
| **构建** | Vite | 5.0+ | 开发/打包 |
| **存储** | IndexedDB (idb) | - | 本地存档 |
| **单元测试** | Vitest | 1.0+ | 单元测试 |
| **E2E测试** | Playwright | 1.40+ | 端到端测试 |
| **代码规范** | ESLint + Prettier | - | 代码检查/格式化 |

### 1.2 依赖锁定

> ⚠️ 新增 npm 依赖需要 CR 流程审批

**允许的依赖范围**：
- Phaser 3.x
- TypeScript 5.x
- Vite 5.x
- yaml（数据解析）
- idb（IndexedDB封装）
- 测试相关依赖

---

## 2. 架构分层图

```
┌─────────────────────────────────────────────────────────────────┐
│                         表现层 (Scenes)                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ BootScene │ │ MenuScene │ │ GameScene │ │ Preview*  │       │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘       │
│        └─────────────┴─────────────┴─────────────┘             │
│                              │                                  │
├──────────────────────────────▼──────────────────────────────────┤
│                        系统层 (Systems)                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     NarrativeEngine                        │ │
│  │  对话管理 │ 卡片系统 │ 伏笔追踪 │ 条件解析                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      WorldState                            │ │
│  │  计数器(R/P/W) │ 能力系统 │ Zone状态 │ 伤痕/污染            │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      UISystem                              │ │
│  │  DialogueUI │ CardUI │ InventoryUI │ PauseMenu │ Toast    │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   AudioManager                             │ │
│  └───────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│                        数据层 (Data)                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Dialogues │ │   Cards   │ │   Zones   │ │  Scenes   │       │
│  │   YAML    │ │   YAML    │ │   YAML    │ │   YAML    │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├──────────────────────────────────────────────────────────────────┤
│                       持久化层 (Save)                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                     SaveManager                            │ │
│  │                    IndexedDB Adapter                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 模块清单

### 3.1 核心模块表（≤12个）

| 模块 | 路径 | 职责 | 接口 | 依赖 | 状态 |
|------|------|------|------|------|------|
| **NarrativeEngine** | `systems/narrative/` | 对白/事件/卡片管理 | `startDialogue()` `triggerEvent()` | WorldState | ✅完成 |
| **WorldState** | `systems/world/` | 全局状态管理 | `getCounter()` `setFlag()` | - | ✅完成 |
| **AbilitySystem** | `systems/ability/` | 三能力处理 | `activate()` `canUse()` | WorldState | ✅完成 |
| **SaveManager** | `systems/save/` | 存档读写 | `save()` `load()` `list()` | IndexedDB | ✅完成 |
| **AudioManager** | `systems/audio/` | 音频播放控制 | `playBGM()` `playSFX()` | Phaser.Sound | ✅完成 |
| **UISystem** | `systems/ui/` | UI组件管理 | 各组件独立接口 | - | ✅完成 |
| **SceneAssembler** | `systems/scene/` | 场景组装 | `assembleZone()` | YAML数据 | ✅完成 |
| **AssetManager** | `systems/assets/` | 资源加载管理 | `load()` `get()` | Phaser.Loader | ✅完成 |
| **EventBus** | `systems/EventBus.ts` | 全局事件通信 | `emit()` `on()` | Phaser.Events | ✅完成 |
| **DebugCommands** | `systems/debug/` | 调试命令 | `__DEBUG__` API | 全部 | ✅完成 |
| **TouchControls** | `systems/input/` | 触控输入 | `on()` `getDirection()` | Phaser.Input | ✅完成 |
| **WhiteboxFactory** | `systems/whitebox/` | 白盒资源生成 | `createPlaceholder()` | - | ✅完成 |

### 3.2 模块依赖图

```
EventBus ◄──────────────────────────────────────────┐
    │                                               │
    ▼                                               │
WorldState ◄──── NarrativeEngine ◄──── GameScene   │
    │                 │                     │       │
    ▼                 ▼                     ▼       │
AbilitySystem    UISystem              AudioManager │
    │                 │                     │       │
    └─────────────────┴──────────┬──────────┘       │
                                 │                  │
                                 ▼                  │
                            SaveManager             │
                                 │                  │
                                 └──────────────────┘
```

---

## 4. 数据格式规范

### 4.1 事件脚本 Schema

```yaml
# src/data/zones/{zone_id}.yaml
id: "C0-Z1"
name: "居住环·南区"
chapter: 0
background: "bg_residential_south"
bgm: "bgm_peaceful"

objects:
  - id: "npc_neighbor"
    type: "npc"
    position: { x: 400, y: 600 }
    sprite: "npc_neighbor"
    dialogue: "C0Z1_neighbor_intro"

events:
  - id: "evt_intro"
    trigger:
      type: "zone_enter"
    actions:
      - type: "dialogue"
        target: "C0Z1_opening"
      - type: "set_flag"
        flag: "c0z1_visited"
        value: true

conditions:
  entry:
    - type: "chapter"
      chapter: 0
  exit:
    - type: "flag"
      flag: "c0z1_complete"
      value: true
```

### 4.2 对白数据 Schema

```yaml
# src/data/dialogues/{zone_id}.yaml
dialogues:
  - id: "C0Z1_opening"
    lines:
      - speaker: "SYSTEM"
        text: "又是平静的一天。"
        style: "narration"
      - speaker: "CENHUI"
        text: "今天的工作任务是..."
        emotion: "neutral"
    next: "C0Z1_choice_1"

  - id: "C0Z1_choice_1"
    lines:
      - speaker: "CENHUI"
        text: "先去哪里？"
    choices:
      - text: "去维修局报到"
        target: "C0Z1_goto_bureau"
        flags:
          choice_bureau: true
      - text: "在附近转转"
        target: "C0Z1_explore"
        counter:
          R: 1  # 无收益行为
```

### 4.3 存档格式

```typescript
interface ISaveData {
  version: number;           // 存档版本
  timestamp: number;         // 保存时间戳
  
  progress: {
    chapter: number;         // 当前章节
    zone: string;            // 当前Zone
    zoneStates: Record<string, IZoneState>;
  };
  
  world: {
    counters: { R: number; P: number; W: number };
    abilities: string[];
    flags: Record<string, boolean>;
    scars: IScar[];
    contaminations: IContamination[];
  };
  
  inventory: {
    cards: string[];
    foreshadows: IForeshadow[];
  };
  
  settings: {
    bgmVolume: number;
    sfxVolume: number;
    textSpeed: number;
  };
}
```

### 4.4 Schema 校验规则

| 数据类型 | 必填字段 | 约束 |
|---------|---------|------|
| Zone | id, name, chapter | id格式: `C{n}-Z{m}` |
| Dialogue | id, lines | 单轮≤12句，单句≤60字 |
| Event | id, trigger, actions | trigger.type必须有效 |
| Card | id, title, content | title≤20字 |

---

## 5. 编码规范摘要

### 5.1 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件名（类） | PascalCase | `NarrativeEngine.ts` |
| 文件名（工具） | camelCase | `formatText.ts` |
| 类名 | PascalCase | `class DialogueManager` |
| 接口 | I前缀 | `interface IDialogue` |
| 常量 | UPPER_SNAKE | `const MAX_LINES = 12` |
| 变量/函数 | camelCase | `let currentZone` |
| 私有成员 | _前缀 | `private _counters` |

### 5.2 TypeScript 规则

- ✅ 启用 strict 模式
- ✅ 所有函数必须有返回类型
- ✅ 避免 any，使用 unknown 或泛型
- ✅ 使用 interface 而非 type（联合类型除外）
- ❌ 禁止使用 var
- ❌ 禁止忽略 TypeScript 错误

### 5.3 Phaser 规范

- 场景继承自 `Phaser.Scene`
- 使用 `preload/create/update` 生命周期
- 资源在 `PreloadScene` 统一加载
- 事件使用 `EventBus` 通信

---

## 6. 质量门禁

### 6.1 CI 检查项

```yaml
# 每次 PR 必须通过
checks:
  - name: "TypeScript 编译"
    command: "npm run typecheck"
    required: true
    
  - name: "ESLint 检查"
    command: "npm run lint"
    required: true
    
  - name: "单元测试"
    command: "npm run test"
    required: true
    coverage: 60%  # 最低覆盖率
    
  - name: "Schema 校验"
    command: "npm run validate:data"
    required: true
    
  - name: "资源命名校验"
    command: "npm run validate:assets"
    required: true
```

### 6.2 PR 合并条件

| 条件 | 要求 | 自动化 |
|------|------|-------|
| 编译通过 | 0 errors | ✅ CI |
| Lint通过 | 0 errors | ✅ CI |
| 测试通过 | 100% pass | ✅ CI |
| 覆盖率 | ≥60% | ✅ CI |
| PR大小 | ≤400行 | ⚠️ 人工 |
| 文件数 | ≤6个 | ⚠️ 人工 |
| 单模块 | 是 | ⚠️ 人工 |
| Review | L2通过 | ⚠️ 人工 |

### 6.3 性能门禁

| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 首屏加载 | <3s (4G) | Lighthouse |
| 运行帧率 | ≥60fps | 性能监控 |
| 单场景内存 | <100MB | Chrome DevTools |
| 包体大小 | <10MB | 构建产物 |

---

## 7. 调试系统

### 7.1 `__DEBUG__` API

```typescript
// 全局调试命令（仅开发环境）
window.__DEBUG__ = {
  // 场景控制
  goto: (zoneId: string) => void,
  
  // 状态控制
  setCounter: (name: 'R' | 'P' | 'W', value: number) => void,
  setFlag: (flag: string, value: boolean) => void,
  unlockAbility: (ability: string) => void,
  
  // 卡片系统
  giveCard: (cardId: string) => void,
  listCards: () => string[],
  
  // 对话系统
  startDialogue: (dialogueId: string) => void,
  skipDialogue: () => void,
  
  // 存档系统
  save: () => Promise<void>,
  load: (slot: number) => Promise<void>,
  clearSave: () => Promise<void>,
  
  // 诊断
  getState: () => IWorldState,
  dumpState: () => void,
  logEvents: (enable: boolean) => void,
};
```

### 7.2 性能监控

```typescript
// 开启性能监控
window.__DEBUG__.enablePerformance(true);

// 输出
// FPS: 60
// Memory: 45MB
// Draw calls: 23
// Entities: 156
```

---

## 8. 禁止事项

### 8.1 技术禁区

| 禁止行为 | 原因 | 替代方案 |
|---------|------|---------|
| 硬编码对白文本 | 维护困难 | YAML数据文件 |
| 直接操作DOM | Phaser架构 | Phaser API |
| 使用var | 代码规范 | const/let |
| 忽略TS错误 | 类型安全 | 修复或断言 |
| 未经CR引入依赖 | 包体控制 | CR流程 |
| 修改存档格式 | 兼容性 | CR流程+迁移 |
| 跨模块直接引用 | 耦合 | 通过EventBus |

### 8.2 格式冻结

以下格式已冻结，修改需要 CR + 迁移方案：

- ❌ 存档数据结构
- ❌ 事件脚本 Schema
- ❌ 对白数据 Schema
- ❌ 卡片数据 Schema

---

## 9. 参考文档索引

| 内容 | 文件路径 |
|------|---------|
| 完整TDD | `design/game/05-tech/技术设计文档TDD_v1.md` |
| 代码规范 | `.cursor/rules/01-code-style.mdc` |
| Phaser规范 | `.cursor/rules/02-phaser.mdc` |
| UI规范 | `.cursor/rules/08-ui-qa-rules.mdc` |
| 测试规范 | `.cursor/rules/04-testing.mdc` |

---

*文档版本: v1.0*  
*创建日期: 2025-12-29*  
*状态: 基本冻结*

