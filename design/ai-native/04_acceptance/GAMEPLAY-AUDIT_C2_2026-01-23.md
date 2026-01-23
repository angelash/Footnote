# Gameplay Audit Report: Chapter 2 (C2)
**Date:** 2026-01-23
**Reviewer:** L2-gameplay-lead
**Status:** 🔴 CHANGES REQUESTED

## 1. 总体评估
第2章（C2）核心逻辑大体成型，但在**关键流程闭环**和**配置一致性**上存在严重问题。
- **P0（阻碍流程）**: C2-Z3 逻辑死锁，玩家无法离开场景。
- **P1（逻辑断层）**: 场景配置与代码定义严重不符，可能导致资源加载错误或叙事错位。
- **P1（体验漏洞）**: C2-Z1 可跳过引导流程，C2-Z6 存在重复获取道具的逻辑。

---

## 2. 问题统计
| 优先级 | 问题数 | 描述 |
|---|---|---|
| 🔴 P0 | 1 | 逻辑死锁（无法通关） |
| 🔶 P1 | 3 | 配置冲突、逻辑漏洞、状态覆盖 |
| 🟡 P2 | 3 | 视觉反馈缺失、逻辑冗余 |
| 🔵 P3 | 2 | 建议优化项 |

---

## 3. 详细问题与修复方案

### 🔴 P0: 逻辑死锁 (Critical)

#### [C2-Z3] 诊疗台出口逻辑死锁
- **位置**: `game/src/data/scenes/c2_z3.yaml`
- **现象**: 出口门 (`top_door`) 的显示条件是 `FLAG_C2Z3_FOUND_PATH` 为真。但该 Flag 的设置动作绑定在 `top_door` 本身的点击交互 (`C2Z3_EXIT_DOOR`) 上。
- **后果**: 门如果不显示，玩家就点不到；点不到就无法设置 Flag 让它显示。玩家被困在 C2-Z3。
- **修复方案**:
    1.  在场景中添加一个隐藏的交互区（如 `real_path_zone`）覆盖在真实楼梯路径上。
    2.  点击该区域触发对话 `C2Z3_FOUND_REAL_PATH`，设置 `FLAG_C2Z3_FOUND_PATH`。
    3.  或者：修改 `top_door` 的 `condition`，移除该 Flag 限制（改为默认显示，点击后才判断是否允许通过）。

---

### 🔶 P1: 逻辑与配置严重不一致 (Major)

#### [Config] Z5/Z6 场景定义与内容不符
- **位置**: `game/src/config/zones.config.ts` vs YAML files
- **现象**:
    - Config `C2-Z5`: "牧平祭坛" (Altar) vs YAML `C2-Z5`: "诊疗台候诊区" (Clinic Waiting)
    - Config `C2-Z6`: "栖蓝住所" (Cottage) vs YAML `C2-Z6`: "礼堂街" (Hall Street)
- **后果**: 地图名称显示错误，背景图加载错误（Config 指定了错误的 backgroundKey）。
- **修复方案**: 更新 `zones.config.ts` 以匹配 YAML 的实际内容。
    - C2-Z5 -> 诊疗台候诊区 (`bg_clinic`)
    - C2-Z6 -> 礼堂街 (`bg_hall_street`)

#### [C2-Z1] 校准流程可跳过
- **位置**: `game/src/data/dialogues/c2_z1.yaml`
- **现象**: `auth_terminal` 的解锁条件仅为 `FLAG_C2Z1_ALL_CALIBRATED`。该 Flag 仅由 `C2Z1_CALIBRATION_C`（校准台C）设置。
- **后果**: 玩家可以直接点击 C 台，跳过 A 和 B 台的交互，导致叙事体验缺失。
- **修复方案**:
    - **方案A**: `auth_terminal` 的 `condition` 改为数组（如果支持）：`[FLAG_C2Z1_CALIBRATION_A, FLAG_C2Z1_CALIBRATION_B, FLAG_C2Z1_CALIBRATION_C]`。
    - **方案B**: 修改 `C2Z1_CALIBRATION_C` 的逻辑，仅当 A 和 B 的 Flag 都为真时，才设置 `ALL_CALIBRATED`。

#### [C2-Z4] 路标重叠显示
- **位置**: `game/src/data/scenes/c2_z4.yaml`
- **现象**: 修好路标后，`fixed_sign` 出现，但 `crooked_sign` 没有消失条件。
- **后果**: 两个路标重叠显示（一正一歪）。
- **修复方案**: 给 `crooked_sign` 添加 `condition: flagFalse: FLAG_C2Z4_SIGN_FIXED`。

---

### 🟡 P2: 逻辑冗余与反馈 (Moderate)

#### [C2-Z6] 祷文抄本重复获取
- **位置**: `game/src/data/scenes/c2_z6.yaml` & `dialogues`
- **现象**: 对话 `C2Z6_MUPING_ADVICE` 直接给予 `CARD_C2_PRAYER_02`。对话结束后 Flag 翻转，导致场景中的 `prayer_scroll` 对象出现。点击该对象再次给予同一张卡片。
- **后果**: 玩家获得两次卡片，逻辑怪异。
- **修复方案**:
    - 给 `prayer_scroll` 对象添加条件 `flagFalse: FLAG_HAS_CARD_PRAYER_02`（需确系统支持物品检查）。
    - 或：移除对话中的 `giveCard`，仅依靠场景点击获取。
    - 或：对话给予卡片后，不显示场景对象。

#### [C2-Z7] 门影透明度问题
- **位置**: `game/src/data/scenes/c2_z7.yaml`
- **现象**: 对象 `door_outline` 设置了 `alpha: 0`。
- **后果**: 即使满足 `abilityActive` 条件，该对象可能仍然不可见（取决于引擎是否忽略 Alpha）。如果意图是点击隐藏区域，建议使用 `type: zone` 而不是 `image` 加透明度。
- **修复方案**: 确认 `alpha: 0` 的用途。如果是为了不可见点击，改用 `zone`。如果是为了显示，改为 `alpha: 1` 或移除该属性。

---

### 🔵 P3: 资源一致性 (Minor)

#### [Global] 背景图 Key 不一致
- **位置**: `game/src/config/zones.config.ts` vs YAML files
- **现象**: 几乎所有 Scene YAML 使用的 `background.texture` 都与 Config 中的 `backgroundKey` 不一致（例如 `bg_server_room` vs `bg_c2z1_training`）。
- **后果**: 虽然 YAML 优先，但 Config 失去了作为"配置源"的意义，可能导致预加载逻辑失效。
- **修复方案**: 统一 Key 名，建议以 `zones.config.ts` 为准进行重构，或更新 Config 匹配 YAML。

---

## 4. 修复行动项
1. [ ] **立即修复 C2-Z3 死锁**：修改 `top_door` 逻辑。
2. [ ] **修正 Config 定义**：同步 C2-Z5/Z6 的名称与描述。
3. [ ] **完善 C2-Z1 校验**：确保三个校准台都必须点击。
4. [ ] **清理 C2-Z4/Z6 状态**：处理重叠与重复获取问题。

请 L3 按照上述清单执行修复。
