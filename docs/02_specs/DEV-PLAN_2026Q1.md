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


