# DEV 计划：2026Q1（4~6 周）里程碑与验收标准

> 输入依据：`docs/01_bibles/tech_bible.md`、`docs/01_bibles/qa_bible.md`、`docs/01_bibles/production_plan.md`、`package.json`、`src/`、`tests/`，以及质检报告 `docs/04_acceptance/PROJECT-QUALITY-REVIEW_2026-01-03.md` 中的门禁结果。  
> 目标：把“当前可运行”推进到“可验收、可规模化迭代”的工程状态，并对齐 Production Plan 的 M1→M3 路线。  

---

## 0. Q1 目标（结果导向）

### 0.1 Q1 P0 目标（必须达成）
- **M1（基础可运行）可审计通过**：Typecheck/Lint/Unit/Coverage/E2E 冒烟门禁全部可跑且有稳定结果
- **数据/资源门禁可执行**：补齐 `validate:data` 与 `validate:assets`（与 Tech Bible 对齐）
- **继续游戏/存档体验可用**：读档后能进入正确 Zone（不回到硬编码默认）

### 0.2 Q1 P1 目标（尽量达成）
- **核心玩法闭环前置（M3 准备）**：`hasCard` 条件生效、时间干预回溯至少能“选择节点→回溯→污染落盘”
- **测试金字塔推进**：E2E 覆盖关键路径（序章→进入游戏→一次交互→存档→读档）
- **质量债收敛**：显著降低 lint warnings、减少 `any`、统一 UI 常量使用

---

## 1. 当前基线（用于排期的事实）

### 1.1 质量门禁基线（来自本次审查实际输出）
- `npm run typecheck`：✅ 通过
- `npm run lint`：⚠️ 0 errors，但 159 warnings（以 `no-console` / `no-explicit-any` / 回调缺返回类型为主）
- `npm run test:coverage`：✅ 通过（2 个单测文件，27 tests），覆盖率报告疑似未覆盖多数文件
- `npm run test:e2e`：❌ 阻断（`tests/e2e/game.spec.ts:342` + reporter 目录冲突）
- `validate:data` / `validate:assets`：❌ Tech Bible 要求存在，但 `package.json` scripts 缺失

### 1.2 内容与数据基线（来自 `src/data`）
- scenes 配置：57 个 YAML
- dialogues：47 个 YAML
- cards：8 个 YAML
- foreshadows：1 个 YAML

---

## 2. 里程碑计划（6 周版本；4 周可裁剪）

> 周期定义：W1~W6。若资源不足，可只做 W1~W4，并把 W5~W6 作为可选延伸。

### W1：门禁修复周（目标：M1 可验收）
**P0 任务**
- **修复 E2E 阻断**
  - 范围：`tests/e2e/game.spec.ts` 中 `test.info()` 误用；修复 Playwright reporter 输出目录冲突
  - 验收：
    - [ ] `npm run test:e2e` 可启动并执行（至少 1 条用例 PASS）
    - [ ] `test-results` 与 HTML report 不互相清理/覆盖（以 Playwright 运行结果为准）
- **补齐数据/资源门禁脚本（最小可用）**
  - 策略：不引入新依赖（避免 CR），用现有 `yaml` + TS/tsx 脚本做静态校验
  - 验收：
    - [ ] `npm run validate:data` 可运行，至少校验：必填字段、ID 格式、引用存在性（dialogueId/sceneId/cardId）
    - [ ] `npm run validate:assets` 可运行，至少校验：配置中引用的 key/路径在资产映射表/manifest 中可解析（具体数据源以当前工程为准）
- **读档继续游戏落点修复**
  - 范围：`MenuScene` 读档后从 `worldState` 取 current zone（替换硬编码）
  - 验收：
    - [ ] 手动创建存档后，“继续游戏”进入正确 Zone（可用 E2E/手测验证）

**P1 任务（若有余量）**
- 调整 lint 策略：把“低价值警告”（例如开发态 console）迁移到可控的 debug logger 或 dev-only 宏（保持 prod 安静）

### W2：叙事/条件闭环周（目标：M2/M3 的关键缺口补齐一半）
**P0 任务**
- **`hasCard` 条件接入**
  - 方案：明确“卡片拥有状态”的权威来源（`NarrativeEngine`/`WorldState`/存档字段）
  - 验收：
    - [ ] `WorldState.checkCondition({ hasCard })` 在单测中可覆盖 true/false 两支
    - [ ] 至少 1 条剧情分支（基于 YAML 条件）可被验证触发/不触发
- **覆盖率统计范围修正**
  - 目标：覆盖率报告不只出现单文件；至少覆盖 `systems/world` + `systems/save` + `systems/narrative` 的核心逻辑
  - 验收：
    - [ ] `npm run test:coverage` 输出包含多文件覆盖明细
    - [ ] 覆盖率门禁阈值与 QA Bible 最低标准对齐（核心系统 ≥60%）

**P1 任务**
- 为 `NarrativeEngine` 补充最小单测：对话推进、choice 分支、触发器（card/foreshadow/ability）基础行为

### W3：时间干预最小闭环（目标：M3 核心玩法闭环最小可用）
**P0 任务**
- **时间回溯最小实现**
  - 最小闭环定义：能列出“可回溯节点”→选择节点→执行回溯→产生污染并写入世界状态→触发必要 UI/事件反馈
  - 验收：
    - [ ] 单测：回溯触发后污染数量变化、W 值变化符合规则
    - [ ] E2E（可用 `__DEBUG__` 或测试 hook）：能触发一次时间干预并观察到预期状态变化

**P1 任务**
- 把“时间节点列表”来源定义为可测试的数据结构（避免完全依赖运行时事件）

### W4：关键路径 E2E + 存档健壮性（目标：可回归、可发布的基础）
**P0 任务**
- **E2E 冒烟清单落地（≤10 条）**
  - 建议覆盖：启动→菜单→新游戏→进入一个 Zone→一次交互→获得卡片/对话推进→保存→退出→读档进入正确 Zone
  - 验收：
    - [ ] `npm run test:e2e` 在本地稳定通过（至少连续 3 次不 flaky）
- **存档版本/兼容性护栏**
  - 验收：
    - [ ] 存档结构版本字段存在并可迁移（如已存在则补迁移测试）
    - [ ] 读写失败有可观测提示且不破坏已有存档

### W5~W6（可选）：质量债与体验收敛
**P1 任务**
- **lint warnings 收敛**
  - 验收：warnings 从 159 降至可控阈值（例如 ≤30），并制定剩余项的“债务清单”
- **UI 常量一致性治理**
  - 目标：消灭关键界面中的硬编码字号/间距（对齐 `src/config/ui.config.ts`）
  - 验收：抽查 `MenuScene/GameScene/AbilitySystem` 等关键 UI 文件，不再出现硬编码 `fontSize: 'xxpx'`（或只允许极少数例外并写明原因）
- **依赖安全治理**
  - 验收：`npm audit` moderate 漏洞下降；若需要升级依赖，走 CR/风险评估并做回归

---

## 3. P0 / P1 任务清单（可直接派单）

### P0（必须做）
- **E2E 阻断修复**（`test.info()` 误用 + reporter 目录冲突）
- **补齐 `validate:data` / `validate:assets`**（无新增依赖的最小实现）
- **读档继续游戏落点**（从 `worldState` 取 current zone）
- **hasCard 条件接入**
- **时间回溯最小闭环**
- **关键路径 E2E 冒烟（≤10）**

### P1（可选/按资源推进）
- 覆盖率统计范围修正与阈值上调（逐步对齐 QA Bible 目标）
- lint warnings 收敛（console/any/返回类型）
- UI 常量治理（字号/间距/尺寸统一）
- 依赖安全治理（audit + 升级策略）

---

## 4. 验收标准（按里程碑）

### M1（基础可运行）验收（Q1 必达）
- [ ] `npm run typecheck` ✅
- [ ] `npm run lint` ✅（0 errors；warnings 有上限并可持续下降）
- [ ] `npm run test:coverage` ✅（测试通过；覆盖率统计范围可信）
- [ ] `npm run test:e2e` ✅（至少 1 条冒烟 PASS）
- [ ] `npm run validate:data` ✅
- [ ] `npm run validate:assets` ✅
- [ ] 继续游戏/读档进入正确 Zone ✅

### M2/M3（叙事可用 / 玩法闭环）验收（Q1 尽量达成）
- [ ] `hasCard` 条件可被单测与至少 1 条剧情用例验证
- [ ] 时间干预回溯可触发，污染/计数器后果可观测且可测试
- [ ] 关键路径 E2E（启动→进入→交互→存档→读档）稳定通过

---

## 5. 需要 L0/L1 参与的决策点（会影响实现方案）

1. **E2E 交互策略**
   - 选项 A：继续采用 Canvas 坐标点击（维护成本高、易 flaky）
   - 选项 B：按 QA Bible 建议，强化 `__DEBUG__` / test hooks，使 E2E 通过状态驱动验证（更稳定）
   - 需要决策：Q1 以哪种作为主路径？是否允许为测试增加少量“测试专用 API”？
2. **lint warnings 的门禁策略**
   - 选项 A：保持 warnings 不阻断，但设上限并逐周下降
   - 选项 B：逐步把部分 warnings 升级为 error（更严格但可能影响迭代速度）
3. **数据/资源校验的“冻结 Schema”范围**
   - Tech Bible 提到 Schema 冻结与 CR；需要决策：本季度校验器严格到什么程度（必填/ID/引用 vs 全字段约束）以平衡速度与质量

---

## 6. 风险与对策（Q1）

| 风险 | 触发信号 | 对策 |
|---|---|---|
| E2E 持续 flaky | 同一套件重复跑不稳定 | 优先转向 `__DEBUG__` 状态驱动；减少坐标点击依赖 |
| 数据错误运行时才暴露 | 章节/Zone 进入时报错 | 先做最小 `validate:data`（ID/引用/必填），再逐步加严 |
| 质量债滚雪球 | lint warnings 长期不降 | 建立“warnings 上限”与每周收敛目标；把高频问题模板化修复 |
| 依赖安全升级打断节奏 | audit 漏洞增多/CI 阻断 | 预留治理窗口（W5~W6），并走 CR 做风险评估与回归 |

# 《备注 / Footnote》后续开发计划（基于当前实现与质检结果）

**日期**: 2026-01-03  
**目标**: 把“高完成度的实现形态”推进为“可稳定构建、可持续迭代、可按里程碑验收”的工程状态。  
**输入依据**: `docs/01_bibles/production_plan.md` + `docs/04_acceptance/PROJECT-QUALITY-REVIEW_2026-01-03.md`

---

## 0. 当前状态一句话

系统/数据/场景已齐，但 **typecheck/lint/coverage 门禁阻塞**，导致 **M1 无法被证据化验收**。

---

## 1. 里程碑路线（对齐 Production Plan）

### M1：基础可运行（目标：7 天内“可验收”）
- **验收门禁（必须全绿）**
  - [ ] `npm run typecheck` 0 errors
  - [ ] `npm run lint` 0 errors
  - [ ] `npx vitest run` 100% pass
  - [ ] `npm run test:coverage` 通过阈值（先确保统计不为 0%）
- **交付物**
  - [ ] `docs/04_acceptance/M1_QUALITY_REPORT.md`（冒烟清单执行记录 + 主要指标）

### M2：叙事系统可用（目标：+2~3 周）
- **验收关注点**
  - [ ] 对话/选择/卡片/伏笔在 C0 全区可闭环
  - [ ] 关键事件触发可追溯（日志/状态）
- **交付物**
  - [ ] C0 的“通关路径”E2E 脚本（Playwright）至少 3 条关键路径

### M3：核心玩法闭环（目标：+4~6 周）
- **验收关注点**
  - [ ] 三能力体验可感知且代价（P/伤痕/污染）可追踪
  - [ ] 存档/读档覆盖关键状态（能力/计数器/伏笔/卡片）

---

## 2. P0（立即做，先把门禁变绿）

### P0-1 解除 TypeScript 阻塞（最高优先）
- **策略建议**（二选一，建议先 A 后 B）
  - **A**：把 `src/scenes/preview/**` 从生产 `tsc` 中剥离（preview 作为独立入口/独立 tsconfig）
  - **B**：逐文件修复 preview 的 unused/类型问题，补齐 BasePreviewScene 生命周期与动画 API 的正确用法
- **验收**
  - [ ] `npm run typecheck` 通过

### P0-2 修复 Lint 阻塞（CRLF + 命名约定）
- **动作**
  - 统一换行策略（建议 `.gitattributes` + Prettier endOfLine=auto/lf 二选一）
  - 明确 Type Alias 命名规则：统一 `T*` 或调整 eslint rule（团队决策）
- **验收**
  - [ ] `npm run lint` 通过

### P0-3 修复 Coverage 0%（让门禁可用）
- **动作**
  - 固化 Node 版本（建议 20 LTS）并复测 coverage
  - 调整 vitest coverage 统计范围（优先统计 `src/systems/**`, `src/data/**`）
  - 评估 vitest 升级/配置调整（需要依赖 CR）
- **验收**
  - [ ] `npm run test:coverage` 不再为 0%，并通过阈值（或在阶段性允许阈值降级）

---

## 3. P1（1~3 周：把“可跑”变成“可持续迭代”）

### P1-1 建立数据校验门禁（对齐 Tech Bible）
- `tech_bible` 提到 `validate:data/validate:assets`，但当前 `package.json` 未提供脚本
- **交付**
  - [ ] `npm run validate:data`（YAML schema/字段约束）
  - [ ] `npm run validate:assets`（资源引用/命名检查）

### P1-2 E2E 关键路径证据化
- **交付**
  - [ ] Playwright：启动→菜单→进入 C0-Z1→触发对话→做一次存档→退出→读档恢复
  - [ ] 关键 UI 元素加 `data-testid`（按 QA Bible 的建议）

---

## 4. 你需要参与的点（最少集合）

- **决策点 A**：preview 场景是“必须随 build 一起编译”，还是“开发工具独立编译”？（建议独立）
- **决策点 B**：Type Alias 命名规范是否强制 `T*`？（建议统一规则，减少争议）
- **决策点 C**：coverage 门禁在短期是否允许临时降阈值？（建议：先修 0% 失真，再谈阈值）

---

## 5. 建议的第一周节奏

- **Day 1-2**：P0-1（typecheck 绿）
- **Day 3**：P0-2（lint 绿）
- **Day 4-5**：P0-3（coverage 非 0 且门禁可用）
- **Day 6-7**：补 1 条 E2E 关键路径（形成 M1 证据链）


