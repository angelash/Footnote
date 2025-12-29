# Save System Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: tech_bible.md
> **下游交付**: L3 执行岗

---

## 1. 系统概述

### 1.1 职责
存档系统负责游戏数据的持久化存储和读取，支持多槽位存档和版本兼容。

### 1.2 核心原则
- 数据完整性优先
- 版本向后兼容
- 自动存档 + 手动存档

---

## 2. 存储方案

### 2.1 技术选型
- **主存储**: IndexedDB
- **备选**: LocalStorage（降级方案）
- **数据库名**: `footnote_saves`

### 2.2 存档槽位
| 槽位 | 说明 |
|------|------|
| `auto` | 自动存档（单槽） |
| `manual_1` | 手动存档1 |
| `manual_2` | 手动存档2 |
| `manual_3` | 手动存档3 |

---

## 3. 数据结构（冻结）

### 3.1 存档根结构

```typescript
interface ISaveGame {
  // 元数据
  version: string;           // 存档版本 "1.0.0"
  slot: SaveSlot;            // 槽位标识
  timestamp: number;         // 保存时间戳
  playtime: number;          // 游戏时长（秒）
  
  // 进度数据
  worldState: IWorldState;   // 世界状态
  currentZone: string;       // 当前区域
  currentChapter: string;    // 当前章节
  
  // 玩家数据
  inventory: IInventory;     // 背包/卡片
  choices: IChoiceRecord[];  // 选择记录
  
  // 系统状态
  settings: ISettings;       // 用户设置
}
```

### 3.2 WorldState 结构

```typescript
interface IWorldState {
  // 计数器
  counters: {
    r: number;    // 无收益残差 [0, ∞)
    p: number;    // 观察者压力 [0, ∞)
    w: number;    // 世界可读性 [0, 100]
  };
  
  // 能力
  abilities: {
    depthPerception: boolean;
    depthIntervention: boolean;
    timeIntervention: boolean;
  };
  
  // 标记
  flags: Record<string, boolean | number | string>;
  
  // 区域状态
  zones: Record<string, ZoneState>;
  
  // 伏笔状态
  foreshadows: Record<string, ForeshadowState>;
  
  // 深度伤痕
  scars: IScar[];
  
  // 时间污染
  contamination: number;
}
```

### 3.3 Inventory 结构

```typescript
interface IInventory {
  cards: ICardState[];    // 卡片列表
}

interface ICardState {
  id: string;              // 卡片ID
  obtained: boolean;       // 是否获得
  obtainedAt?: string;     // 获得位置
  state?: string;          // 当前状态变体
}
```

---

## 4. 接口定义

### 4.1 SaveManager

```typescript
interface ISaveManager {
  // 存档操作
  save(slot: SaveSlot): Promise<boolean>;
  load(slot: SaveSlot): Promise<ISaveGame | null>;
  delete(slot: SaveSlot): Promise<boolean>;
  
  // 查询
  getSaveInfo(slot: SaveSlot): Promise<ISaveInfo | null>;
  listSaves(): Promise<ISaveInfo[]>;
  
  // 自动存档
  enableAutoSave(interval: number): void;
  disableAutoSave(): void;
  
  // 导入导出
  exportSave(slot: SaveSlot): Promise<string>;
  importSave(data: string): Promise<boolean>;
}

interface ISaveInfo {
  slot: SaveSlot;
  exists: boolean;
  timestamp?: number;
  chapter?: string;
  playtime?: number;
  version?: string;
}
```

---

## 5. 版本兼容

### 5.1 版本号规则
- 格式: `major.minor.patch`
- major 变更: 不兼容，需要迁移
- minor 变更: 向后兼容，新增字段
- patch 变更: 完全兼容

### 5.2 迁移策略

```typescript
interface IMigration {
  fromVersion: string;
  toVersion: string;
  migrate(data: any): ISaveGame;
}

// 迁移注册
const migrations: IMigration[] = [
  { fromVersion: '1.0.0', toVersion: '1.1.0', migrate: migrateV1ToV1_1 },
  // ...
];
```

---

## 6. 自动存档规则

### 6.1 触发点
| 触发条件 | 说明 |
|----------|------|
| Zone 切换 | 进入新区域时 |
| 重要选择 | 关键对话选择后 |
| 能力解锁 | 解锁新能力时 |
| 卡片获得 | 获得重要卡片时 |

### 6.2 节流
- 最小间隔: 30秒
- 写入失败: 静默重试3次

---

## 7. 错误处理

### 7.1 错误类型
| 错误 | 处理 |
|------|------|
| 存储空间不足 | 提示用户清理 |
| 数据损坏 | 尝试恢复或提示 |
| 版本不兼容 | 提示升级或备份 |
| 读取失败 | 降级到备选存储 |

### 7.2 数据校验

```typescript
function validateSaveData(data: any): ValidationResult {
  // 必需字段检查
  // 类型检查
  // 范围检查
  // 引用完整性检查
}
```

---

## 8. 边界约束

### 8.1 粒度限制
- 单次存档数据: ≤1MB
- 槽位数量: 4（1自动+3手动）
- 版本号格式: semver

### 8.2 禁区
- 禁止明文存储敏感数据
- 禁止修改存档版本号格式
- 禁止删除已有字段（只可废弃）

---

## 9. 验收标准

- [ ] 数据结构符合 Schema
- [ ] 版本兼容机制可用
- [ ] 自动存档正常触发
- [ ] 错误处理完善
- [ ] IndexedDB 操作无泄漏

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 冻结*

