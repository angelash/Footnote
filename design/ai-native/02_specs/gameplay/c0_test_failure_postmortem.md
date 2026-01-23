# C0-Z1 测试失效事后分析报告

**日期**: 2026-01-23  
**问题级别**: 严重（方法论缺陷）  
**报告人**: L2-gameplay-lead (AI)

---

## 一、问题清单

| # | 问题描述 | 根因 | 我的测试是否发现 |
|---|---------|------|-----------------|
| 1 | 卡片拾取后不消失 | 场景对象缺少 condition 和 flag 设置 | ❌ 未发现 |
| 2 | 祷词台可重复领取 | `effects` vs `effect` 属性名不匹配 | ❌ 未发现 |
| 3 | 储物柜只给工单没给早餐券 | onComplete 只能存一张卡片（覆盖） | ❌ 未发现 |
| 4 | 重复交互对话没变化 | flag 没有被正确设置 | ❌ 未发现 |

---

## 二、为什么测试测不出来？—— 根本原因分析

### 2.1 测试方法错误：只验证"能否执行"，不验证"执行结果"

**我做了什么**：
```javascript
// 我的测试
const result = interactionSystem.execute(action, context);
// 看到 result.ok = true 就认为测试通过
```

**我应该做什么**：
```javascript
// 正确的测试
const cardsBefore = getObtainedCards();
const flagBefore = getFlag('FLAG_C0Z1_GOT_IDENTITY');
const objectVisible = isObjectVisible('identity_card');

interactionSystem.execute(action, context);

// 验证：
// 1. 卡片真的被获得了吗？
const cardsAfter = getObtainedCards();
assert(cardsAfter.includes('CARD_C0_IDENTITY'));

// 2. Flag 真的被设置了吗？
assert(getFlag('FLAG_C0Z1_GOT_IDENTITY') === true);

// 3. 场景对象真的消失了吗？
assert(isObjectVisible('identity_card') === false);
```

### 2.2 只做"结构检查"，不做"行为验证"

**我做了什么**：
- ✅ 检查 YAML 配置文件中有 onComplete
- ✅ 检查 onComplete 里有两张卡片
- ❌ **没有验证代码是否正确解析这个配置**
- ❌ **没有验证执行后卡片是否真的被获得**

**正确做法**：
- 追踪数据流：`YAML 配置 → 解析器 → 运行时数据结构 → 执行结果 → 状态变更`
- 在每个环节验证数据是否正确传递

### 2.3 没有建立"预期结果 vs 实际结果"对比

**问题**：我只是"观察"系统行为，没有"断言"行为是否正确。

**表现**：
```
我：点击身份卡
系统：返回 ok: true
我：测试通过！

应该是：
我：点击身份卡
预期：1. 获得 CARD_C0_IDENTITY  2. FLAG_C0Z1_GOT_IDENTITY = true  3. 身份卡对象消失
实际：1. 获得卡片 ✅  2. flag 未设置 ❌  3. 对象未消失 ❌
结论：测试失败
```

### 2.4 没有模拟完整的玩家流程

**我做了什么**：
- 测试单个交互点

**应该做什么**：
- 测试完整流程：进入场景 → 看到对象 → 交互 → 获得物品 → 对象消失 → 再次进入 → 对象不再显示

---

## 三、发现的代码缺陷

### 3.1 属性名不一致（严重）

```typescript
// types/index.ts - IDialogueChoice
interface IDialogueChoice {
  effect?: { ... };  // 单数
}

// NarrativeEngine.ts - IDialogueChoice  
interface IDialogueChoice {
  effects?: IChoiceEffect;  // 复数！
}

// NarrativeDataLoader 用 effect（单数）
// NarrativeEngine.selectChoice 检查 effects（复数）
// 结果：选择效果永远不会被应用
```

**修复**：让 selectChoice 同时兼容两种属性名

### 3.2 onComplete 只能存一张卡片（严重）

```typescript
// NarrativeDataLoader.ts
for (const action of triggers) {
  if (action.type === 'card' && action.cardId) {
    trigger.card = action.cardId;  // 覆盖！只保留最后一张
  }
}
```

**修复**：使用 `cards` 数组存储多张卡片

### 3.3 场景对象缺少状态控制

身份卡对象没有 `condition` 控制显示/隐藏，没有在获取时设置 flag。

**修复**：添加状态切换的两个对象版本

---

## 四、改进措施

### 4.1 测试方法改进

1. **建立测试清单模板**：
   ```
   测试: [交互名称]
   前置状态: [flags, cards, objects]
   操作: [用户行为]
   预期结果:
     - 状态变更: [flag X = true, card Y 获得]
     - UI 变化: [对象消失, 对话显示]
     - 数据变化: [R +1]
   实际结果: [填写]
   对比: [通过/失败]
   ```

2. **端到端流程测试**：
   - 不只测试单点，要测试完整用户流程
   - 场景重入测试：交互后退出再进入，状态是否正确

3. **数据流追踪**：
   - 在关键节点打印日志
   - 验证 YAML → 解析 → 运行时 的数据一致性

### 4.2 代码审查改进

1. **接口一致性检查**：
   - 同一概念不能有多个接口定义
   - 属性名必须统一

2. **数据累积 vs 覆盖**：
   - 涉及"多个"的场景（多张卡片、多个 flag），必须使用数组
   - 循环中赋值要警惕覆盖问题

### 4.3 建立自动化验收测试

```typescript
// 建议添加的测试用例
describe('C0-Z1 场景', () => {
  it('拾取身份卡后应该消失', async () => {
    await loadZone('C0-Z1');
    expect(isObjectVisible('identity_card')).toBe(true);
    
    await interact('identity_card');
    
    expect(hasCard('CARD_C0_IDENTITY')).toBe(true);
    expect(getFlag('FLAG_C0Z1_GOT_IDENTITY')).toBe(true);
    expect(isObjectVisible('identity_card')).toBe(false);
  });
  
  it('储物柜应该给两张卡片', async () => {
    await loadZone('C0-Z1');
    await interact('storage_cabinet');
    await advanceDialogue();  // 完成对话
    
    expect(hasCard('CARD_C0_MEAL_TICKET')).toBe(true);
    expect(hasCard('CARD_C0_WORK_ORDER')).toBe(true);
  });
});
```

---

## 五、结论

**核心教训**：
> **测试不是"看系统能不能跑"，是"验证系统行为是否符合预期"**

我犯的错误是把"系统能执行"当成"系统正确执行"。真正的测试需要：
1. 明确预期结果
2. 执行操作
3. 对比实际与预期
4. 验证所有相关状态变更

**后续行动**：
1. ✅ 修复属性名不一致问题
2. ✅ 修复 onComplete 多卡片问题
3. ✅ 修复身份卡状态切换问题
4. TODO: 建立自动化验收测试
5. TODO: 更新测试规范文档

---

*报告完成: 2026-01-23*  
*报告人: L2-gameplay-lead (AI)*
