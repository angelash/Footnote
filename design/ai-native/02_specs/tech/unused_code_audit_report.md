# 未使用代码审查报告

> 审查日期：2026-01-24
> 状态：✅ 已处理（2026-01-24）

---

## 一、未被引用的数据文件

### 1.1 zones.data.ts ❌ 未使用

| 项目 | 内容 |
|------|------|
| 文件路径 | `game/src/data/zones.data.ts` |
| 文件大小 | ~500行 |
| 问题描述 | 定义了完整的 Zone 数据结构（交互点、出口、R值机会等），但从未被引用 |
| 实际使用 | 项目使用 `@/config/zones.config.ts` 和 `game/src/data/scenes/*.yaml` |
| 可能原因 | 早期版本或计划使用但后来被 YAML 方案替代 |

**建议处理**：
- [ ] 确认是否有价值内容需要迁移到 YAML
- [ ] 如果无需保留，可以删除

---

## 二、导出但未使用的函数/常量

### 2.1 Logger 工具类（5个）

| 函数名 | 文件 | 说明 |
|--------|------|------|
| `Logger` (默认实例) | `utils/Logger.ts` | 默认导出但代码中只使用 `createLogger` |
| `setLogLevel` | `utils/Logger.ts` | 日志级别设置函数 |
| `setLogEnabled` | `utils/Logger.ts` | 日志开关函数 |
| `getLogConfig` | `utils/Logger.ts` | 获取日志配置函数 |
| `resetLogger` | `utils/Logger.ts` | 重置日志函数 |

**建议处理**：
- [ ] 保留作为调试 API（可能在控制台手动调用）
- [ ] 或标记为 `@internal`

### 2.2 颜色工具函数（4个）

| 函数名 | 文件 | 说明 |
|--------|------|------|
| `COLORS_CSS` | `config/colors.config.ts` | CSS 格式颜色常量 |
| `colorToHex` | `config/colors.config.ts` | 颜色转十六进制 |
| `hexToColor` | `config/colors.config.ts` | 十六进制转颜色 |
| `colorWithAlpha` | `config/colors.config.ts` | 添加透明度 |

**建议处理**：
- [ ] 保留作为工具函数储备
- [ ] 或在需要时使用

### 2.3 配置查询函数（8个）

| 函数名 | 文件 | 说明 |
|--------|------|------|
| `getEndingStatsDescription` | `config/endings.config.ts` | 获取结局统计描述 |
| `getZoneCountByChapter` | `config/zones.config.ts` | 按章节获取Zone数量 |
| `getObjectsByArea` | `config/objects.config.ts` | 按区域获取物件 |
| `getAnimatedObjects` | `config/objects.config.ts` | 获取动画物件 |
| `getInteractableObjects` | `config/objects.config.ts` | 获取可交互物件 |
| `getAllPortraitKeys` | `config/characters.config.ts` | 获取所有立绘键 |
| `getCharacterIdByName` | `config/characters.config.ts` | 按名字获取角色ID |
| `getDefaultPortraitKey` | `config/characters.config.ts` | 获取默认立绘键 |

**建议处理**：
- [ ] 保留作为查询 API（可能后续开发使用）
- [ ] 或在确认不需要后删除

---

## 三、YAML 中孤立的定义

### 3.1 C0-Z1 未配置交互的对话（3个）

| 对话ID | 位置 | 说明 |
|--------|------|------|
| `C0Z1_IDENTITY_EXAMINE_DONE` | `dialogues/c0_z1.yaml:38` | 身份卡已获得后的再次点击对话 |
| `C0Z1_IDENTITY_DETAIL` | `dialogues/c0_z1.yaml:139` | 身份卡长按细节对话（含F06伏笔） |
| `NOTICE_BOARD_EXAMINED` | `dialogues/c0_z1.yaml:86` | 公告板已检查后的对话 |

**问题**：这些对话定义存在，但 `scenes/c0_z1.yaml` 中没有配置触发条件。

**建议处理**：
- [ ] 补充场景交互配置（推荐）
- [ ] 或确认为设计放弃后删除

### 3.2 NG+ 对话（12个，需验证触发机制）

| 对话ID | 说明 |
|--------|------|
| `NGP_C0_GULIN_HINT` | NG+顾临提示 |
| `NGP_C0_SYSTEM_ECHO` | NG+系统回响 |
| `NGP_SONGLAN_REMEMBER` | 宋岚记忆 |
| `NGP_SONGLAN_CYCLE_3` | 宋岚周期3 |
| `NGP_GULIN_TRUE_THOUGHTS` | 顾临真实想法 |
| `NGP_GULIN_CHOICE` + 分支 | 顾临选择（A/B/C/D） |
| `NGP_QILAN_BACKSTORY` | 栖蓝背景故事 |
| `NGP_SYSTEM_OBSERVE_5` | 系统观察5 |
| `NGP_SYSTEM_FINAL` | 系统最终 |
| `NGP_CHENJIANG_LIGHT` | 陈匠之光 |
| `NGP_ATANG_DRIFT` | 阿棠漂流 |
| `NGP_MUPING_PROPHECY` | 牧平预言 |

**问题**：这些 NG+ 对话可能通过条件标志动态触发，但需要验证代码中是否有触发逻辑。

**建议处理**：
- [ ] 确认 NG+ 功能是否已实现
- [ ] 如果未实现，保留等待后续开发
- [ ] 如果计划废弃，移除这些定义

---

## 四、处理优先级建议

### 高优先级（建议直接处理）
1. **zones.data.ts** - 确认后可删除，避免混淆

### 中优先级（等待确认）
2. **C0-Z1 孤立对话** - 补充场景配置或删除
3. **未使用的配置查询函数** - 根据后续开发计划决定

### 低优先级（可保留）
4. **Logger 工具函数** - 作为调试 API 保留
5. **颜色工具函数** - 作为工具储备保留
6. **NG+ 对话** - 等待 NG+ 功能开发时使用

---

## 五、处理结果

### Q1: zones.data.ts ✅ 已删除
- [x] 删除（确认无需保留的数据）
- 处理时间：2026-01-24
- 原因：项目使用 YAML 场景配置，该 TS 文件从未被引用

### Q2: C0-Z1 孤立对话 ✅ 已补充交互
- [x] 补充场景交互配置（修复）
- 处理时间：2026-01-24
- 修改内容：
  - `scenes/c0_z1.yaml`: 添加 `identity_card_spot`（身份卡放置处）和 `identity_card_detail`（长按查看）
  - `dialogues/c0_z1.yaml`: 删除冗余的 `NOTICE_BOARD_EXAMINED`（与 `NOTICE_BOARD_DONE` 功能重复）

### Q3: NG+ 对话 ✅ 已补充触发功能
- [x] 保留并补充触发机制
- 处理时间：2026-01-24
- 修改内容：
  - `dialogues/ngplus_dialogues.yaml`: 修复 YAML 格式（从数组改为字典格式）
  - `config/ngplus.config.ts`: 新增 NG+ 对话触发配置
  - `scenes/GameScene.ts`: 添加 NG+ 触发检查（进入场景 + 对话后连锁）

### Q4: 未使用的工具函数
- [x] 全部保留作为储备
- 原因：工具函数可能在后续开发使用

---

## 六、附录：审计脚本

运行以下命令可进行更详细的检查：

```bash
# 运行现有审计脚本
cd game && npx tsx scripts/audit_interactions.ts

# 搜索对话ID定义
grep -r "^  [A-Z0-9_]*:" src/data/dialogues/*.yaml | wc -l

# 搜索卡片ID定义
grep -r "^  CARD_[A-Z0-9_]*:" src/data/cards/*.yaml | wc -l
```

---

*报告生成：AI-Native 工作流*
*等待用户确认后执行处理*
