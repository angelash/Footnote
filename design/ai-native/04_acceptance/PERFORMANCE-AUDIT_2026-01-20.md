# 性能审计报告（PERFORMANCE-AUDIT）

**审计日期**: 2026-01-20  
**审计范围**: 性能指标定义、性能监控实现、性能优化措施（`game/` 为主）  
**审计员**: L2_qa_lead  
**参考文件**:
- Tech Bible: `design/ai-native/01_bibles/tech_bible.md`
- QA Bible: `design/ai-native/01_bibles/qa_bible.md`
- 性能规范: `design/ai-native/02_specs/tech/performance_spec.md`
- 性能监控: `game/src/systems/debug/PerformanceMonitor.ts`

---

## 执行摘要（评分）

| 维度 | 评分 | 状态 | 结论 |
|------|------|------|------|
| 性能指标定义与门禁对齐 | 8/10 | ✅ 基本齐全 | QA/Tech Bible 给出发布门禁，`performance_spec.md` 给出更细的分层目标与红线 |
| 性能监控落地（可用性） | 3/10 | ⚠️ 未形成闭环 | `PerformanceMonitor` 已实现，但**未接入主循环/无统一开关/无基线数据落盘** |
| 资源加载与运行优化措施 | 5/10 | ⚠️ 部分已做 | 有 `AssetManager` 章节分组与空闲预加载，但 `PreloadScene` 仍“全量预加载”，与懒加载策略冲突 |
| 构建与包体控制 | 6/10 | ✅ 有优化点 | Vite 分包/压缩已做，但缺少“包体门禁脚本”；且 `sourcemap: true` 对发布包体有不确定影响 |
| 性能测试与基线（自动化） | 2/10 | ❌ 缺失 | 无 Lighthouse/性能基线脚本；现有自动化仅做功能与最低帧率（≥30fps）粗检 |

**综合评分**: **44/100（不建议按发布门禁直接放行）**  

**关键风险**（影响 QA Bible 发布标准）：
- **首屏加载 < 3s（4G）**：存在高风险（当前 `PreloadScene` 全量加载 WebP/音频/数据）
- **运行帧率 ≥ 60fps**：未建立“监控→数据→降级”闭环（仅目标值/少量测试）
- **内存 < 100MB**：无可靠监控与压力/泄漏回归（仅 Chrome heap 采样能力，且未接入）
- **包体 < 10MB**：缺少可重复的测量口径与脚本门禁（仅有构建与分包配置）

---

## 性能指标对照表（门禁/口径/现状）

> 说明：本次为**实现状态审计**，未执行真机/网络条件下的实测基线，因此“现状数据”多为 **未测**，以“实现能力/风险”评估。

| 指标 | QA Bible 发布门禁 | `performance_spec.md` 扩展目标/红线 | 口径建议（测量方式） | 当前实现状态 |
|------|-------------------|--------------------------------------|----------------------|--------------|
| 首屏加载 | < 3s（4G） | 冷启动首屏渲染：中端 ≤3s；红线 >8s | Lighthouse（4G/CPU 限速）+ 性能打点（FCP/TTI） | ⚠️ **未测**；存在“全量预加载”高风险 |
| 运行帧率 | ≥ 60fps | 高端≥60 / 中端≥45 / 低端≥30；红线 <24fps | `game.loop.actualFps` + P5/P1 分位（建议采样窗口） | ⚠️ 仅目标值配置；无分位统计与降级执行 |
| 内存占用 | < 100MB | 中端峰值≤100MB；红线 >200MB | Chrome DevTools + JS heap + 纹理估算 | ⚠️ 仅 heap（Chrome）可采样；纹理/总内存未覆盖 |
| 场景切换耗时 | （QA Bible 提到） | 章节≤2s / Zone≤1s；红线 >5s | 统一埋点：触发切换→可交互 | ❌ 未实现统一埋点 |
| 交互响应 | （未写入 QA 门禁） | 中端≤100ms；红线 >300ms | Long Tasks + 自定义交互打点 | ❌ 未实现 |
| 包体大小 | < 10MB | 红线 >15MB | `dist/` 产物 + gzip/brotli；明确“是否含资源”口径 | ⚠️ 无门禁脚本；口径未固化 |

---

## 性能监控实现状态（PerformanceMonitor）

### 1) 已实现能力（代码可用）

**文件**: `game/src/systems/debug/PerformanceMonitor.ts`

已实现并可展示的指标（覆盖层）：
- **FPS**：当前/平均/最小/最大（60 帧窗口）
- **Frame time**：近似帧耗时（`game.loop.delta`）
- **对象/纹理/音频数量**：用于粗略评估场景负载
- **内存（Chrome）**：`performance.memory` 的 heap used/total（非跨浏览器）

加载追踪能力（接口已存在，但未被调用）：
- `startLoadTracking()` / `recordAssetLoad()` / `endLoadTracking()` / `getLoadMetrics()`

### 2) 关键缺口（阻断“监控→数据→决策→回归”闭环）

| 缺口 | 影响 | 证据/位置 |
|------|------|-----------|
| 未接入主循环更新 | 覆盖层不会自动刷新；无法持续采样 | `GameScene.update()` 未调用 `performanceMonitor.update()` |
| 无统一开关（Debug API 不一致） | Tech Bible 示例 `__DEBUG__.enablePerformance(true)` **无法执行** | `game/src/systems/debug/DebugCommands.ts` 未实现 `enablePerformance` |
| 指标覆盖不全 | 无“纹理/GPU 内存、分位 FPS、掉帧次数、场景切换耗时”等核心门禁数据 | `performance_spec.md` 定义大量指标/降级策略，但代码未落地 |
| 数据未落盘/无报告产物 | 无法形成“里程碑性能基线”与回归对比 | 仅 `exportReport()` 输出 JSON 字符串，未被调用/存储 |

---

## 优化措施检查（现状与风险）

### 1) Phaser 配置（性能相关）

**入口**: `game/src/main.ts`, `game/src/config/game.config.ts`

已具备：
- `fps.target: 60`（目标帧率）
- `visibilitychange` / `blur` / `focus`：暂停/恢复场景与音频（省电、避免后台耗时）
- `physics.arcade.debug` 仅 DEV（避免生产 debug 开销）

风险/建议关注点：
- `render.antialias: true`：在低端机可能显著增加 GPU 压力（建议引入设备分层/可配置开关）
- 未显式设置 `powerPreference`（WebGL 上可考虑 `"high-performance"`，需结合兼容性验证）

### 2) 资源加载策略（预加载/懒加载）

**全量预加载现状（高风险）**：
- `game/src/scenes/PreloadScene.ts` 在启动阶段加载：
  - WebP：角色头像/背景/物件/特效/动画帧（全量遍历）
  - 音频：BGM/SFX/环境音（全量遍历）
  - 数据：对话/卡片/伏笔等 YAML（大量 `load.text`）

**已存在的懒加载/分组能力（但与上面冲突）**：
- `game/src/systems/assets/AssetManager.ts`
  - 按章节分组加载（`AssetGroup` + `CHAPTER_ASSET_MAP`）
  - `requestIdleCallback` 空闲预加载下一章（`preloadNextChapter`）
- `game/src/scenes/GameScene.ts`
  - 进入场景时调用 `assetManager.loadChapterAssets()` + `preloadNextChapter()`

结论：
- 目前同时存在“**全量预加载**”与“**按章懒加载**”两套策略，且全量预加载会吞掉懒加载带来的首屏收益。

### 3) 构建与分包（package.json / Vite）

**文件**: `game/package.json`, `game/vite.config.ts`

已具备：
- `minify: 'terser'` + `drop_console/drop_debugger`（减少运行时开销与包体）
- `manualChunks`：Phaser/vendor/系统/UI/对话与场景数据分包（结构上支持按需加载）

缺口：
- 无“包体大小门禁脚本”（例如：构建后统计 `dist/` 及 gzip/brotli 并阈值失败）
- `build.sourcemap: true`：对发布包体与性能的影响未在门禁中约束（建议区分 debug 与 release 构建策略）

### 4) 性能测试脚本与自动化

现有测试：
- `game/tests/interactive/specs/02-menu.spec.ts` 仅做**粗粒度帧率检查（≥30fps）**，不满足发布门禁（≥60fps）且无内存/首屏/切换耗时检查
- 无 Lighthouse 脚本、无性能基线输出文件、无 CI 性能门禁

---

## 问题清单（按优先级）

> 说明：此处优先级用于“性能发布门禁风险”排序（不是功能缺陷分级）。

| ID | 优先级 | 模块 | 问题 | 影响的门禁 | 证据/位置 |
|----|--------|------|------|------------|-----------|
| PA-001 | P1 | 资源加载 | `PreloadScene` 全量加载大量 WebP/音频/数据，首屏风险极高 | 首屏 <3s（4G）、内存 <100MB | `game/src/scenes/PreloadScene.ts` |
| PA-002 | P1 | 性能监控 | `PerformanceMonitor` 未接入主循环，监控不可用/无基线 | 帧率、内存、切换耗时 | `GameScene.update()` 未调用；`PerformanceMonitor.ts` |
| PA-003 | P1 | Debug API | Tech Bible 示例 `__DEBUG__.enablePerformance(true)` 与代码不一致 | 监控启用与测试便利性 | `tech_bible.md` vs `DebugCommands.ts` |
| PA-004 | P2 | 构建门禁 | 缺少“包体大小”自动化门禁与口径固化 | 包体 <10MB | `game/package.json` 无相关脚本 |
| PA-005 | P2 | 性能测试 | 缺少 Lighthouse/性能基线与回归对比 | 首屏/TTI/切换耗时 | 测试目录无相关套件 |
| PA-006 | P3 | Phaser 配置 | `render.antialias: true` 未做设备分层/可配置 | 帧率 ≥60fps（低端更敏感） | `game/src/main.ts` |

---

## 建议行动（可执行清单）

### A. 立刻补齐（建议本迭代完成）
- **接入监控闭环**：
  - 在 `GameScene.update()`（以及菜单/预览如需要）调用 `performanceMonitor.update(time, delta)`
  - 在 `DebugCommands` 增加 `enablePerformance(enabled: boolean)` 并与 Tech Bible 口径一致
  - 在 `PreloadScene` 接入 `startLoadTracking/recordAssetLoad/endLoadTracking`（至少统计成功/失败/耗时）
- **建立“性能基线输出”**：
  - 约定基线输出位置（例如 `workflows/project/logs/perf_baseline/` 或 acceptance 附件），每次里程碑留存

### B. 资源加载改造（建议作为发布前硬门禁）
- **把首屏资源缩到“最小可用集”**：
  - `BootScene/PreloadScene` 只加载加载屏/菜单所需核心资源
  - 章节资源交给 `AssetManager` 按需加载（避免双策略并存）
- **明确缓存策略**：
  - PWA `sw.js` 当前是“命中返回+后台更新+动态缓存”，需确认是否会造成无上限缓存膨胀（建议加入缓存上限/清理策略）

### C. 自动化与门禁（建议纳入 CI 或里程碑脚本）
- **新增性能门禁脚本**（最小版本）：
  - Lighthouse（4G/CPU 限速）输出 JSON + 阈值判断（首屏/TTI）
  - 构建后统计 `dist/` 与 gzip 大小，并对 `<10MB` 给出统一口径（是否含资源需写清）
- **扩展现有交互测试**：
  - 从 “fps≥30” 提升到 “fps≥60（设备/环境分层）”
  - 增加 “场景切换耗时” 与 “内存采样” 的检查项（至少 DEV Chrome）

---

## 结论

当前代码与文档层面，性能目标与门禁定义较完整，但“监控落地”和“首屏资源加载策略”存在结构性缺口，导致无法证明满足 QA Bible 发布标准。建议先完成 **监控接入 + 首屏资源瘦身 + 自动化门禁** 三件套，再进入发布验收阶段。

