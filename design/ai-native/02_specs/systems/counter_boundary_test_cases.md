# Counter System Boundary Test Cases v1.0

> **层级**: L2 规格层  
> **文档编号**: P1-02-TC  
> **上游依赖**: counter_system_spec.md  
> **下游交付**: 单元测试实现  
> **最后更新**: 2026-01-19  

---

## 测试覆盖概要

| 类别 | 用例数量 | 覆盖范围 |
|------|----------|----------|
| R 值边界 | 18 | 阈值、溢出、增量限制 |
| P 值边界 | 16 | 阈值、溢出、增量限制 |
| W 值边界 | 14 | 公式验证、钳位、视觉效果 |
| R×P 组合 | 12 | 极端组合场景 |
| W 计算验证 | 10 | 公式正确性、异常修正 |
| 结局触发 | 15 | 三结局条件、优先级 |
| 非法值处理 | 12 | 负数、NaN、非法类型 |
| **总计** | **97** | |

---

## 1. R 值边界测试用例

### 1.1 阈值边界（精确边界值）

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| R-01 | R值初始化 | 新游戏开始 | R = 0, 阈值 = Normal | `expect(counter.getR()).toBe(0)` |
| R-02 | R=2（Normal上界） | addR(2) 从 R=0 | R = 2, 阈值 = Normal | `expect(counter.getRThreshold()).toBe('NORMAL')` |
| R-03 | R=3（Hesitation下界） | addR(3) 从 R=0 | R = 3, 阈值 = Hesitation | `expect(counter.getRThreshold()).toBe('HESITATION')` |
| R-04 | R=5（Hesitation上界） | addR(2) 从 R=3 | R = 5, 阈值 = Hesitation | 验证语气停顿效果触发 |
| R-05 | R=6（Judgment下界） | addR(1) 从 R=5 | R = 6, 阈值 = Judgment | `expect(counter.getRThreshold()).toBe('JUDGMENT')` |
| R-06 | R=9（Judgment上界） | addR(3) 从 R=6 | R = 9, 阈值 = Judgment | 验证判定句出现 |
| R-07 | R=10（ModelRewrite下界） | addR(1) 从 R=9 | R = 10, 阈值 = ModelRewrite | `expect(counter.isEndingCAvailable()).toBe(true)` |
| R-08 | R=15（高值测试） | 多次 addR | R = 15, 阈值 = ModelRewrite | 验证系统稳定性 |

### 1.2 阈值跨越测试

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| R-09 | Normal→Hesitation跨越 | R=2, addR(1) | 触发 threshold:r_reached 事件 | 监听事件触发 |
| R-10 | Hesitation→Judgment跨越 | R=5, addR(1) | 触发判定句、事件 | 验证首次判定句标记 |
| R-11 | Judgment→ModelRewrite跨越 | R=9, addR(1) | 触发结局C解锁、事件 | `expect(events).toContain('ending:c_unlocked')` |
| R-12 | 一次跨越多阈值 | R=2, addR(8) | R=10, 所有阈值事件触发 | 验证事件触发顺序 |

### 1.3 增量限制测试

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| R-13 | 单次增量=3（上限） | addR(3, "reason") | R += 3 成功 | 验证增量被接受 |
| R-14 | 单次增量>3（超限） | addR(4, "reason") | 拒绝或截断至3 | 验证限制生效 |
| R-15 | 单次增量=0 | addR(0, "reason") | R 不变 | 验证零值处理 |
| R-16 | 累计增量测试 | 5次 addR(3) | R = 15 | 验证累计正确 |

### 1.4 溢出与极端值

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| R-17 | 超大R值 | R = 1000 | 系统稳定运行 | 验证无崩溃、阈值正确 |
| R-18 | R值持久化 | R=10, 存档后读档 | R=10 恢复正确 | 验证存档/读档完整性 |

---

## 2. P 值边界测试用例

### 2.1 阈值边界（精确边界值）

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| P-01 | P值初始化 | 新游戏开始 | P = 0, 阈值 = Normal | `expect(counter.getP()).toBe(0)` |
| P-02 | P=3（Normal上界） | addP(3) 从 P=0 | P = 3, 阈值 = Normal | `expect(counter.getPThreshold()).toBe('NORMAL')` |
| P-03 | P=4（Light下界） | addP(4) 从 P=0 | P = 4, 阈值 = LightCorrection | `expect(counter.getPThreshold()).toBe('LIGHT')` |
| P-04 | P=6（Light上界） | addP(2) 从 P=4 | P = 6, 阈值 = LightCorrection | 验证轻微纠偏效果 |
| P-05 | P=7（Moderate下界） | addP(1) 从 P=6 | P = 7, 阈值 = ModerateCorrection | `expect(counter.getPThreshold()).toBe('MODERATE')` |
| P-06 | P=10（Moderate上界） | addP(3) 从 P=7 | P = 10, 阈值 = ModerateCorrection | 验证中度纠偏效果 |
| P-07 | P=11（Strong下界） | addP(1) 从 P=10 | P = 11, 阈值 = StrongCorrection | `expect(counter.getPThreshold()).toBe('STRONG')` |
| P-08 | P=15（Strong上界） | addP(4) 从 P=11 | P = 15, 阈值 = StrongCorrection | 验证强烈纠偏效果 |
| P-09 | P=16（Extreme下界） | addP(1) 从 P=15 | P = 16, 阈值 = ExtremeCorrection | `expect(counter.getPThreshold()).toBe('EXTREME')` |
| P-10 | P=20（高值测试） | addP(4) 从 P=16 | P = 20, 阈值 = ExtremeCorrection | 验证极端压力效果 |

### 2.2 能力来源增量测试

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| P-11 | 深度感知(<5s) | addP(0, DEPTH_PERCEPTION) | P 不变 | 验证零增量处理 |
| P-12 | 深度感知(5-15s) | addP(0.1, DEPTH_PERCEPTION) | P += 0.1 | 验证小数增量 |
| P-13 | 深度介入(大型) | addP(2.0, DEPTH_INTERVENTION) | P += 2.0 | 验证大型介入增量 |
| P-14 | 时间干预(>30分钟) | addP(5.0, TIME_INTERVENTION) | P += 5.0 | 验证最大单次增量 |

### 2.3 增量限制测试

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| P-15 | 单次增量=5（上限） | addP(5.0) | P += 5.0 成功 | 验证增量被接受 |
| P-16 | 单次增量>5（超限） | addP(6.0) | 拒绝或截断至5 | 验证限制生效 |

---

## 3. W 值边界测试用例

### 3.1 计算公式验证

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| W-01 | W值初始化 | R=0, P=0, anomaly=0 | W = 100 | `expect(counter.getW()).toBe(100)` |
| W-02 | 纯R影响 | R=10, P=0, anomaly=0 | W = 100 - 30 = 70 | 验证 R×3 系数 |
| W-03 | 纯P影响 | R=0, P=15, anomaly=0 | W = 100 - 30 = 70 | 验证 P×2 系数 |
| W-04 | R+P组合 | R=10, P=10, anomaly=0 | W = 100 - 30 - 20 = 50 | 验证组合计算 |
| W-05 | 含异常修正 | R=5, P=5, anomaly=10 | W = 100 - 15 - 10 - 10 = 65 | 验证异常修正 |

### 3.2 阈值边界

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| W-06 | W=100（满值） | R=0, P=0 | W=100, 状态=Stable | 验证稳定状态 |
| W-07 | W=80（Stable下界） | R=6, P=1 | W=80, 状态=Stable | 验证边界稳定 |
| W-08 | W=79（SlightlyUnstable下界） | R=7, P=0 | W=79, 状态=SlightlyUnstable | 验证画面抖动触发 |
| W-09 | W=60（SlightlyUnstable下界） | R=13, P=0.5 | W≈60 | 验证边界计算 |
| W-10 | W=59（Moderate下界） | R=13, P=1 | W≈56, 状态=ModeratelyUnstable | 验证色彩偏移触发 |
| W-11 | W=40（Moderate下界） | R=20, P=0 | W=40 | 验证边界 |
| W-12 | W=39（Severe下界） | R=20, P=0.5 | W=39, 状态=SeverelyUnstable | 验证失真效果 |
| W-13 | W=20（Severe下界） | R=26, P=1 | W≈20 | 验证边界计算 |
| W-14 | W=19（Critical下界） | R=27, P=0 | W=19, 状态=Critical | 验证L3显影 |

### 3.3 钳位测试

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| W-15 | W下限钳位 | R=50, P=50 | W = 0（非负数） | `expect(counter.getW()).toBe(0)` |
| W-16 | W上限钳位 | 重置后 | W = 100（不超100） | `expect(counter.getW()).toBeLessThanOrEqual(100)` |

---

## 4. R×P 组合极端值测试

### 4.1 高R高P组合

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| RP-01 | 高R高P（R=15, P=20） | R=15, P=20 | W=max(0,100-45-40)=15 | 验证W值计算 |
| RP-02 | 极端高值（R=30, P=30） | R=30, P=30 | W=0（钳位） | 验证钳位生效 |
| RP-03 | 高R高P阈值状态 | R=15, P=20 | R=ModelRewrite, P=Extreme, W=Critical | 验证所有阈值 |
| RP-04 | 高R高P结局可用性 | R=15, P=20, W<40 | 结局C可用 | `expect(counter.isEndingCAvailable()).toBe(true)` |

### 4.2 高R低P组合

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| RP-05 | 高R低P（R=15, P=0） | R=15, P=0 | W=100-45=55 | 验证仅R影响 |
| RP-06 | 高R低P阈值状态 | R=15, P=0 | R=ModelRewrite, P=Normal | 验证分离阈值 |
| RP-07 | 高R低P结局 | R=15, P=0, W=55 | 结局C可用（R≥10），但W>40 | 验证条件分离 |

### 4.3 低R高P组合

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| RP-08 | 低R高P（R=0, P=20） | R=0, P=20 | W=100-40=60 | 验证仅P影响 |
| RP-09 | 低R高P阈值状态 | R=0, P=20 | R=Normal, P=Extreme | 验证分离阈值 |
| RP-10 | 低R高P结局 | R=0, P=20 | 结局C不可用（R<10） | `expect(counter.isEndingCAvailable()).toBe(false)` |

### 4.4 边界组合

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| RP-11 | R阈值+P阈值临界 | R=6, P=7 | W=100-18-14=68 | 验证双阈值跨越 |
| RP-12 | W恰好为0 | R=20, P=20 | W=max(0,100-60-40)=0 | 验证精确钳位 |

---

## 5. W 计算验证测试

### 5.1 公式精确性

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| WC-01 | 基准公式 | R=5, P=5, anomaly=0 | W=100-15-10=75 | 验证 W=100-(R×3)-(P×2) |
| WC-02 | 小数P值 | R=5, P=5.5, anomaly=0 | W=100-15-11=74 | 验证小数处理 |
| WC-03 | 大型介入修正 | anomaly=LargeIntervention(-5) | W减少5 | 验证修正生效 |
| WC-04 | 长距回溯修正 | anomaly=LongTimeJump(-8) | W减少8 | 验证修正生效 |
| WC-05 | 结构性决策修正 | anomaly=StructuralDecision(-3) | W减少3 | 验证修正生效 |
| WC-06 | 重大结构性决策 | anomaly=MajorStructuralDecision(-10) | W减少10 | 验证修正生效 |

### 5.2 累计异常修正

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| WC-07 | 多次异常累计 | 3×LargeIntervention | anomalyModifier=15 | 验证累计计算 |
| WC-08 | 混合异常 | Large(-5)+Long(-8)+Structural(-3) | anomalyModifier=16 | 验证混合累计 |

### 5.3 实时派生验证

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| WC-09 | R变化触发W更新 | R从5→6 | W实时更新 | 监听 counter:w_change 事件 |
| WC-10 | P变化触发W更新 | P从5→6 | W实时更新 | 监听 counter:w_change 事件 |

---

## 6. 结局触发条件验证

### 6.1 结局A条件

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| E-01 | 结局A典型条件 | R=5, W=65, choice=A | 结局=PlaneStability | 验证结局判定 |
| E-02 | 结局A边界（R=5, W=61） | R=5, W=61, choice=A | 结局=PlaneStability | 验证边界条件 |
| E-03 | 结局A不满足（R=6） | R=6, W=65, choice=A | 结局≠PlaneStability | R≥6不满足A条件 |
| E-04 | 结局A不满足（W≤60） | R=5, W=60, choice=A | 需验证W>60 | 边界验证 |

### 6.2 结局B条件

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| E-05 | 结局B典型条件 | R=8, W=50, choice=B | 结局=TruthRelease | 验证结局判定 |
| E-06 | 结局B边界（R=6） | R=6, W=50, choice=B | 结局=TruthRelease | R≥6满足B条件 |
| E-07 | 结局B边界（W=40） | R=8, W=40, choice=B | 结局=TruthRelease | W=40满足B条件 |
| E-08 | 结局B边界（W=60） | R=8, W=60, choice=B | 结局=TruthRelease | W=60满足B条件 |
| E-09 | 结局B不满足（R=5） | R=5, W=50, choice=B | 回退到A | R<6不满足B条件 |

### 6.3 结局C条件

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| E-10 | 结局C典型条件 | R=12, W=35, choice=C | 结局=BecomeSystem | 验证结局判定 |
| E-11 | 结局C边界（R=10） | R=10, W=35, choice=C | 结局=BecomeSystem | R=10满足C条件 |
| E-12 | 结局C边界（W=39） | R=12, W=39, choice=C | 结局=BecomeSystem | W<40满足C条件 |
| E-13 | 结局C不满足（R=9） | R=9, W=35, choice=C | 回退到A或B | R<10不满足C条件 |
| E-14 | 结局C不满足（选择≠C） | R=12, W=35, choice=A | 结局≠BecomeSystem | 选择必须为C |

### 6.4 优先级验证

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| E-15 | C优先于B | R=12, W=35, choice=C | 结局=BecomeSystem | C优先判定 |

---

## 7. 负数/非法值处理

### 7.1 负数输入

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| INV-01 | R负数增量 | addR(-1, "reason") | 拒绝或忽略 | 验证R不减少 |
| INV-02 | P负数增量 | addP(-1.0, source) | 拒绝或忽略 | 验证P不减少 |
| INV-03 | 负数初始化 | 直接设置R=-5 | 禁止或钳位到0 | 验证禁区规则 |

### 7.2 非法类型

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| INV-04 | R值NaN | addR(NaN, "reason") | 拒绝或抛异常 | TypeScript类型检查 |
| INV-05 | P值NaN | addP(NaN, source) | 拒绝或抛异常 | TypeScript类型检查 |
| INV-06 | R值Infinity | addR(Infinity, "reason") | 拒绝或截断 | 验证边界处理 |
| INV-07 | P值Infinity | addP(Infinity, source) | 拒绝或截断 | 验证边界处理 |
| INV-08 | 空reason | addR(1, "") | 允许或警告 | 验证日志完整性 |
| INV-09 | null source | addP(1.0, null) | 类型错误 | TypeScript编译检查 |

### 7.3 边界越界

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| INV-10 | W直接设置 | 直接设置W=50 | 禁止（违反禁区） | 验证只能通过公式计算 |
| INV-11 | 历史修改 | 修改rHistory | 禁止 | 验证禁区规则 |
| INV-12 | 日志超限 | 添加101条变更 | 保留最新100条 | 验证日志限制 |

---

## 8. 时间干预对计数器影响

### 8.1 回溯处理

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| TJ-01 | R值部分回滚 | R=10, 回溯到R=4节点 | R=4+floor((10-4)*0.5)=7 | 验证50%保留 |
| TJ-02 | P值不回滚 | P=8, 回溯 | P增加回溯代价，不减少 | 验证P只增不减 |
| TJ-03 | W值重算 | 回溯后 | W根据新R/P重新计算 | 验证实时派生 |
| TJ-04 | 回溯代价计算(<5分钟) | 回溯<5分钟 | P += 1.0 | 验证代价公式 |
| TJ-05 | 回溯代价计算(>30分钟) | 回溯>30分钟 | P += 5.0 | 验证最大代价 |

---

## 9. 持久化与恢复

### 9.1 存档完整性

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| SAVE-01 | 基础存档 | R=8, P=12, W=48 | 存档包含完整状态 | 验证存档结构 |
| SAVE-02 | 异常修正存档 | anomalyModifier=15 | 存档包含anomaly | 验证修正持久化 |
| SAVE-03 | 历史记录存档 | 50条变更历史 | 存档包含历史 | 验证历史持久化 |

### 9.2 读档恢复

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| LOAD-01 | 基础读档 | 存档{R:8, P:12} | R=8, P=12, W正确计算 | 验证恢复正确 |
| LOAD-02 | 阈值状态恢复 | R=10存档 | 读档后isEndingCAvailable=true | 验证状态恢复 |
| LOAD-03 | 损坏存档 | 存档数据缺失/损坏 | 错误处理/默认值 | 验证容错机制 |

---

## 10. 事件触发测试

### 10.1 计数器变化事件

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| EVT-01 | R变化事件 | addR(1) | 触发 counter:r_change | 监听事件 |
| EVT-02 | P变化事件 | addP(1.0) | 触发 counter:p_change | 监听事件 |
| EVT-03 | W变化事件 | R或P变化 | 触发 counter:w_change | 监听事件 |

### 10.2 阈值事件

| ID | 用例名称 | 输入条件 | 预期输出 | 验证方法 |
|----|----------|----------|----------|----------|
| EVT-04 | R阈值事件 | R从2→3 | 触发 threshold:r_reached | 监听事件 |
| EVT-05 | P阈值事件 | P从3→4 | 触发 threshold:p_reached | 监听事件 |
| EVT-06 | W阈值事件 | W从80→79 | 触发 threshold:w_reached | 监听事件 |
| EVT-07 | 结局解锁事件 | R从9→10 | 触发 ending:c_unlocked | 监听事件 |

---

## 附录A：测试数据生成器

```typescript
// 边界值组合生成
const R_BOUNDARIES = [0, 2, 3, 5, 6, 9, 10, 15, 30];
const P_BOUNDARIES = [0, 3, 4, 6, 7, 10, 11, 15, 16, 20, 30];
const W_BOUNDARIES = [0, 19, 20, 39, 40, 59, 60, 79, 80, 100];

function generateBoundaryTests(): TestCase[] {
  const cases: TestCase[] = [];
  for (const r of R_BOUNDARIES) {
    for (const p of P_BOUNDARIES) {
      const w = Math.max(0, 100 - r * 3 - p * 2);
      cases.push({
        id: `COMBO-${r}-${p}`,
        r, p, w,
        rThreshold: getRThreshold(r),
        pThreshold: getPThreshold(p),
        wStability: getWStability(w),
      });
    }
  }
  return cases;
}
```

---

## 附录B：验收检查清单

- [ ] 所有 97 个测试用例已实现
- [ ] R 值边界 18 个用例通过
- [ ] P 值边界 16 个用例通过
- [ ] W 值边界 14 个用例通过
- [ ] R×P 组合 12 个用例通过
- [ ] W 计算验证 10 个用例通过
- [ ] 结局触发 15 个用例通过
- [ ] 非法值处理 12 个用例通过
- [ ] 时间干预 5 个用例通过（附录）
- [ ] 持久化 6 个用例通过（附录）
- [ ] 事件触发 7 个用例通过（附录）

---

*版本: v1.0 | 创建: 2026-01-19 | 状态: 待实现*
