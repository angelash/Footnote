## 

要按项目分工来考虑，我想要的最理想状态就像是我一开始先跟你探讨游戏内容核心，你引导我定游戏方案，然后接下来我就希望后面能纯AI来实现，AI有按项目分工那样，有制作人，主策、主程、主美、测试组长等等，然后下面就各岗位各级分工，按团队100人来考量组织结构，然后每个人都会逐级接受任务，然后自己负责自己级别的工作后再往下分配，直到最终执行输出（中层也会有自己的执行输出），我要的是你详细地逐层逐岗位分解，每个要做什么事情，有什么输入和输出，输出到下游的是谁，把流程和任务都拆分成合理的粒度（当前大模型能比较稳定输出的粒度），还有整个过程需要使用什么工具和规范辅助也要充分考虑，例如PromptX或者openspec之类，但你不要我说啥就用啥，你要综合目前市面上好用的工具，推荐最合适的组合给我



###### ChatGPT 说：



已思考 58s



明白了：你要的是**“100人项目组织结构的 AI 仿真版”**——把 AI 当成一个完整工作室，从制作人到各部门负责人到组长到执行岗，逐级分解职责、输入输出、下游交付对象、以及任务粒度（要稳），并且给出**最合适的工具组合**，让你只在最开始做“制作人+总架构决策”，后面能像真正项目一样靠“组织与流程”自动推进。

下面我先把**最关键、最难、也最能落地的一块**一次性给出来：

## ① 推荐工具组合（市面成熟方案） + ② 100人虚拟组织结构（逐层逐岗 IO） + ③ 交付工件与上下游接口标准

（你看完就能按“组织架构 + 工件接口”把后续流程跑起来）

------

## 0）先定一个现实边界（不粉饰）

你说的“纯 AI 像 100 人团队一样逐级分工交付”是可行的，但要满足两个前提：

1. **不是同时开 100 个 AI 对话窗口乱跑**（那必串线）
   而是：用**“角色化指令 + 工件接口 + 任务单系统”**去模拟 100 人团队的“逐级交付链”。
2. AI 的“稳定粒度”要卡死：

- **组长/负责人层**产出：文档/清单/接口/验收标准（稳定）
- **执行层**产出：PR/资源包/脚本（稳定）
- **跨系统大决策**仍然由你（制作人/总架构）拍板（否则发散）。

------

## 1）工具组合（我给你一套“够强且可控”的栈）

### A. 单一事实源（SSOT）+ 任务系统

- **GitHub Repo**：所有工件都版本化（文档/脚本/资源索引/规范）。
- **GitHub Projects / Issues**：当 Jira/禅道用，承载“逐级派单/回执/验收”。

### B. 规范驱动（把“会话”变成“工程”）

- **GitHub Spec Kit（Spec-Driven Dev）**：用规格驱动把需求→计划→任务拆解固化，避免纯 vibe coding。 [GitHub+1](https://github.com/github/spec-kit?utm_source=chatgpt.com)
- **AGENTS.md**：给所有编码类 Agent 一个统一“项目说明书”，让每个任务开始前都自动读同一套规则（像团队开发手册）。 [agents.md+2OpenAI开发者+2](https://agents.md/?utm_source=chatgpt.com)

### C. “角色/技能注入”与上下文治理

- **PromptX（基于 MCP）**：把“主策/主程/主美/QA 组长”等角色做成可一键召唤的上下文包，减少你反复写提示词。 [GitHub+1](https://github.com/Deepractice/PromptX?utm_source=chatgpt.com)
- **Prompt-as-Tools 的 MCP Server（可选）**：把团队通用提示词做成 MCP 工具，统一版本、统一入口（比 rules 分散在每个人电脑上强）。 [七猫技术团队](https://tech.qimao.com/bu-yong-rules-yong-ti-shi-ci-mcp/?utm_source=chatgpt.com)

### D. 工具互通协议（让 Agent 真的“干活”）

- **MCP**：把文件、Git、构建、测试、Issue、资源库等能力统一成“可调用工具”。 [modelcontextprotocol.io+2OpenAI平台+2](https://modelcontextprotocol.io/specification/2025-03-26?utm_source=chatgpt.com)
  （MCP 规范里 Prompts/Resources/Tools 的分层也正好对应你要的“逐级分工交付”。[modelcontextprotocol.io+1](https://modelcontextprotocol.io/specification/2025-03-26?utm_source=chatgpt.com)）

### E. 多 Agent 编排（可选：你想要“100人组织”就需要它）

- **CrewAI（层级团队编排）**：适合做“制作人→总监→组长→执行”的层级任务分派与回收。 [crewai.com+1](https://www.crewai.com/?utm_source=chatgpt.com)
- **LangGraph（状态/检查点/长短期记忆）**：适合做“流程状态机 + 可回滚/可审计”。长短期记忆分离是官方推荐的结构。 [LangChain 文档+1](https://docs.langchain.com/oss/python/langgraph/add-memory?utm_source=chatgpt.com)

> 选型建议（直说）：
>
> - **你现在用 Cursor 主导开发**：优先落地 **AGENTS.md + Spec Kit + MCP + PromptX**（最立竿见影）。
> - 如果你真要“100人工作室自动流转”：再加 **CrewAI 或 LangGraph** 做编排（否则你只能手工扮演“中层派单器”）。

------

## 2）100人虚拟工作室组织结构（逐层逐岗拆解）

下面按“真实 100 人项目”给你一个标准配置（你可以按项目大小裁剪）。
我会把每个岗位写成：**职责 / 输入 / 输出 / 下游交付对象 / 稳定粒度**。

> 组织层级（四层）

- **L0：制作委员会（你+AI 制作人）**：定方向、定边界、定质量门槛
- **L1：部门总监（策划总监/技术总监/美术总监/QA 总监/制作管理）**：把目标变成可执行结构
- **L2：组长（系统策划/关卡策划/客户端组长/工具组长/UI 组长/QA 组长…）**：把结构变成任务包+验收
- **L3：执行岗（文案/脚本/程序/美术/测试…）**：产出具体文件/PR/资源包

------

### L0 制作委员会（1–3人：你 + 1个“AI 制作人”）

#### 0.1 制作人（你，最终责任）

- 职责：立项/范围/取舍/发布门槛/拍板争议
- 输入：所有 L1 汇报包（周报/风险/变更申请）
- 输出：**项目宪法**（Charter）、里程碑、优先级裁决、范围裁剪单
- 下游：制作管理（PMO）+ 各总监
- 稳定粒度：**决策单（1页）/ 里程碑调整（单条）**

#### 0.2 AI 制作人（Agent）

- 职责：把你“模糊意图”变成**可验证的产品目标**；维护“风险台账”
- 输入：你的一段目标描述 + 竞品/参考 + 约束
- 输出：目标拆解（MVP/迭代）、风险清单、里程碑草案
- 下游：PMO + 策划总监 + 技术总监 + 美术总监
- 稳定粒度：**1–3页 Markdown**（不要超过）

------

### L1 部门总监层（约 6–10人）

> 这一层是“把愿景变成工程结构”的关键。AI 在这一层输出非常稳定。

#### 1.1 策划总监（Design Director）

- 职责：核心玩法闭环、系统地图、叙事框架、数值策略（如有）
- 输入：Charter、世界观基调、平台限制
- 输出：**Design Bible（策划总纲）**、系统清单、体验目标、禁区
- 下游：系统策划组长 / 关卡策划组长 / 文案组长
- 稳定粒度：**总纲 5–15页 + 系统列表表格**

#### 1.2 技术总监（Tech Director）

- 职责：技术路线、工程架构、模块边界、质量门禁、CI/CD
- 输入：Design Bible、目标平台、团队工具约束
- 输出：**Tech Bible（技术总纲）**、模块边界图、编码规范、测试策略
- 下游：客户端组长 / 工具组长 / 构建发布组长 / 安全与权限负责人
- 稳定粒度：**架构文档 + 接口契约（可逐步冻结）**

#### 1.3 美术总监（Art Director）

- 职责：视觉基调、资产清单、制作规范、风格一致性策略
- 输入：世界观/玩法/镜头与UI约束
- 输出：**Art Bible**、资产目录（按场景/角色/UI/特效）、命名/尺寸/输出格式
- 下游：概念/UI/场景/角色/特效/动画组长
- 稳定粒度：**规范 + 清单 + 参考板（不求画出来）**

#### 1.4 QA 总监（QA Director）

- 职责：测试策略、用例框架、冒烟/回归门禁、缺陷分级与关闭标准
- 输入：Design Bible、Tech Bible、里程碑
- 输出：Test Plan、用例模板、缺陷工作流、发布验收表
- 下游：QA 组长 + 自动化测试负责人
- 稳定粒度：**模板 + 清单**（非常稳定）

#### 1.5 制作管理 PMO（Producer Ops）

- 职责：排期、资源/风险、跨部门依赖、变更控制（Change Control）
- 输入：各总监的计划/风险
- 输出：里程碑甘特/燃尽、依赖图、变更单（CR）
- 下游：所有组长
- 稳定粒度：**Issue/Project 看板 + 周报**

------

### L2 组长层（约 15–25人）

> 这一层是“把总监文档拆成**可投喂给执行岗的稳定任务包**”。

我给你《备注》更贴合的组长配置（偏叙事+系统+UI）。

#### 2.1 系统策划组长

- 输入：Design Bible（系统地图）
- 输出：每个系统的**System Spec**（职责/状态/输入输出/边界/验收）
- 下游：脚本策划/程序组长/QA
- 稳定粒度：**单系统 1–3页 Spec**

#### 2.2 叙事/文案组长

- 输入：叙事框架、角色表、章节结构
- 输出：章节大纲、对白标准、文本标签体系（用于程序挂载）
- 下游：文案执行岗 + 工具/程序（导入格式）
- 稳定粒度：**一章一包（大纲+事件列表+标签）**

#### 2.3 UI/UX 组长

- 输入：交互需求、平台限制、风格规范
- 输出：UI 流程图、界面清单、组件规范、状态图
- 下游：UI 美术执行岗 + 客户端 UI 程序 + QA
- 稳定粒度：**一个界面/一个流程包**

#### 2.4 客户端组长（主程线）

- 输入：Tech Bible、系统 Spec、UI Spec
- 输出：模块任务拆分、接口契约、PR 合并策略、集成计划
- 下游：客户端执行岗（功能/框架/工具）+ QA
- 稳定粒度：**单模块 PR 级任务（能一次跑测试）**

#### 2.5 工具/管线组长（如果你要高效率必须有）

- 输入：Art Bible、文本标签体系、工程结构
- 输出：导表/导入工具、资源校验、自动打包/生成
- 下游：全体执行岗（让他们省 50% 体力活）
- 稳定粒度：**一个工具=一个独立 CLI/脚本 + 文档**

#### 2.6 QA 组长

- 输入：Test Plan、系统 Spec
- 输出：冒烟用例、回归清单、缺陷分派规则、每日质量报告
- 下游：执行测试岗 + 自动化测试岗 + 各组长
- 稳定粒度：**清单化（最稳）**

------

### L3 执行岗（60–80人：全是“产出文件/PR/资源包”的人）

> 这一层 AI 最容易做，但也最容易“越权”。所以必须严格吃 L2 的任务包。

举几个与你项目强相关的执行岗：

#### 3.1 脚本/事件执行（Narrative Scripter）

- 输入：章节包（事件列表+标签）、System Spec（事件格式）
- 输出：事件脚本文件（JSON/YAML/脚本语言）、分支节点、条件与结果
- 下游：客户端（加载器）+ QA（用例覆盖）
- 稳定粒度：**一个事件=一个文件或一个段落块（≤1k 行）**

#### 3.2 文案执行（Writer）

- 输入：对白模板、角色语气指南、事件脚本骨架
- 输出：对白/旁白/卡片文本（带标签）
- 下游：脚本执行岗（挂载）+ QA（校对）
- 稳定粒度：**一个场景/一次对话=一包**

#### 3.3 UI 执行（UI Artist / UI Implementer）

- 输入：UI 流程图、组件规范、风格规范
- 输出：UI 资源（SVG/PNG/字体/动效）、或 UI 布局文件
- 下游：UI 程序 + QA
- 稳定粒度：**单界面/单组件包**

#### 3.4 功能程序执行（Gameplay/Client Engineer）

- 输入：接口契约、模块任务、验收标准
- 输出：可合并 PR（含测试/日志），不跨模块改动
- 下游：客户端组长（Code Review）+ CI + QA
- 稳定粒度：**单 PR（可一次通过 CI）**

#### 3.5 测试执行（QA Tester）

- 输入：冒烟/回归清单、需求/系统验收点
- 输出：缺陷单（复现步骤/期望/实际/日志/截图）
- 下游：对应组长/程序执行岗
- 稳定粒度：**一个缺陷单=一条闭环**

------

## 3）“逐级交付”的核心：工件接口标准（你要的“邮件式派单”）

要让 100 人组织跑起来，不靠长上下文，靠的是**工件契约**。我给你 4 类“稳定工件”，每层都只能交付这些：

### 工件 1：方向类（L0→L1）

- **Charter / 里程碑 / 取舍单**
- 特点：短、冻结、可审计

### 工件 2：规格类（L1→L2）

- **Bible / System Spec / UI Spec / Test Plan**
- 特点：结构化、能拆任务、能写验收

### 工件 3：任务包类（L2→L3）

- **Task Pack（派单包） = 输入包 + 输出要求 + 验收清单**
- 特点：像“邮件”，AI 执行稳定的关键

**Task Pack 标准结构（强制）：**

1. 任务目标（可观察变化）
2. 允许引用的输入（文件路径/链接）
3. 输出物（文件路径+格式示例）
4. 禁止事项（越权即失败）
5. 验收点（Checklist）
6. 回执要求（完成内容/风险/未完成）

### 工件 4：交付类（L3→L2→集成）

- **PR / 资源包 / 脚本包 / 缺陷单**
- 特点：可回滚、可合并、可追责

------

## 4）把“100人组织”落到你一个人手里：你怎么操作？

你不会真的管理 100 个聊天窗口；你要做的是：

- 你（制作人）只和 **L1 总监 Agent**沟通
- L1 总监把工作拆给 **L2 组长 Agent**
- L2 组长生成 **Task Pack** 投喂给执行 Agent
- 执行 Agent 只产出 PR/资源包
- QA 链条独立跑，不跟开发混上下文

这就是“组织结构”带来的**上下文隔离**。

------

## 5）下一步我怎么继续给你补“你缺的 90%”

你现在已经拿到：

- 工具栈（可选型）
- 100人组织结构（逐岗 IO）
- 逐级交付工件标准（让任务像邮件一样流转）

但你真正要的“90%细节”，在两块：

### 第六部分（下一轮我直接给你成套表格）

**《岗位→可稳定输出粒度》对照表**

- 每个岗位：能稳定产出的最大包大小（token/文件/PR大小）
- 失败模式与拆分策略（怎么拆才稳）
- 你说的“估算总体工作量=对话次数”也会在这里落地

### 第七部分（再下一轮）

**《端到端任务流转（含变更控制/验收门禁/并行策略）》**

- 从“你和我定游戏方案”开始
- 到“制作人发里程碑”
- 到“主策拆系统”
- 到“组长派单”
- 到“执行交 PR”
- 到“QA 冒烟/回归”
- 到“打包发布”
  全部带：输入/输出/下游对象/工具触发点（MCP/SpecKit/PromptX/CI）

------

如果你同意，我下一条就从**《备注》**的真实特点出发，先把 L1 这几个人定死：

- AI 制作人、策划总监、技术总监、美术总监、QA 总监、PMO
  然后输出一份**“岗位说明书（JD）+ 工件清单 + 互相交付关系图（文字版）”**，并把它们写成你可以直接放进仓库的 **AGENTS.md + SpecKit 目录结构**。

（你不用再补信息，我按《备注=叙事驱动中等规模》这个默认前提直接生成。）



##### 你说：

继续



###### ChatGPT 说：



已思考 13s



行，我们把“100人组织仿真”真正落到**可放进仓库、可逐级派单、可回收验收**的形态：
这一轮我给你三样硬货（都能直接复制进 repo）：

1. **仓库目录结构（Spec/工件/任务/验收）**
2. **AGENTS.md（全体虚拟团队通用手册 + 权限边界）**
3. **L1 六大总监岗的岗位说明书（JD）+ 工件清单 + 交付关系图（文字版）**

> 约定：《备注》定位为“叙事驱动、中等规模、以内容为主、系统简单但结构严谨”的项目。

------

## 1）仓库目录结构（让组织和工件天然隔离上下文）

```
remark/
  README.md
  AGENTS.md                       # 全体虚拟团队的统一“工作手册”（只读基准）
  /docs/
    /00_charter/
      project_charter.md          # 宪法：范围/目标/禁区/质量门槛（冻结）
      change_control.md           # 变更控制（CR流程）
    /01_bibles/                   # L1 总监层输出（规格层）
      design_bible.md             # 策划总纲
      tech_bible.md               # 技术总纲
      art_bible.md                # 美术总纲
      qa_bible.md                 # 测试总纲/策略
      production_plan.md          # 里程碑/排期/依赖
    /02_specs/                    # L2 组长层输出（系统/模块规格）
      systems/
        narrative_system_spec.md
        event_system_spec.md
        choice_system_spec.md
        ui_system_spec.md
      ui/
        ui_flow_spec.md
        ui_components_spec.md
      pipelines/
        content_pipeline_spec.md
        asset_pipeline_spec.md
    /03_taskpacks/                # L2 -> L3 派单包（“邮件”）
      T-0001_taskpack.md
      T-0002_taskpack.md
    /04_acceptance/               # 验收清单/门禁
      build_acceptance.md
      milestone_acceptance.md
      qa_checklists/
    /05_logs/                     # 过程审计（对话/返工/回滚）
      task_log.md
      rollback_log.md
      decisions_log.md            # L0/L1 决策单
  /src/                           # 代码（如果有）
  /content/                       # 剧情/对白/事件脚本等
  /tools/                         # 脚本、导入导出、校验器、CI辅助
  /.github/
    ISSUE_TEMPLATE/
      taskpack.yml                # 任务单模板
      change_request.yml          # 变更单模板
      bug_report.yml              # 缺陷模板
    workflows/
      ci.yml                      # 你的CI（可选）
```

这套结构的意义：

- **L1 只写 /docs/01_bibles**（规格）
- **L2 只写 /docs/02_specs + /docs/03_taskpacks**（拆解与派单）
- **L3 只写 /src /content /tools**（可合并的交付物）
- QA 只写 **/docs/04_acceptance + 缺陷单**
  天然把上下文隔离开，不靠“记忆力”，靠“目录权限”。

------

## 2）AGENTS.md（统一手册：权限、工件、交付格式、失败即回滚）

把下面整段直接放到 `AGENTS.md`：

```
# AGENTS.md — 《备注》虚拟工作室统一工作手册（只读基准）

## 0. 核心原则
1) 人类（制作人）负责：方向、范围、取舍、最终验收。
2) AI 负责：在明确规格与派单包约束下完成交付物。
3) 所有工作以“工件”为中心：先文档规格，再任务包派单，再代码/内容交付。
4) 不允许越权：任何超出派单包/规格的新增概念、规则、系统边界，视为失败。

## 1. 权限边界（Fail-Fast）
- 允许：
  - 生成/修改派单包要求的文件
  - 按既有规格填充内容、实现代码
  - 按模板输出验收自检结果
- 禁止：
  - 修改 project_charter.md 的目标/禁区
  - 修改系统边界（/docs/02_specs/systems）
  - 引入新机制/新状态/新数据结构（除非派单包明确授权）
  - 把多个任务合并处理（每个任务一个PR/一个提交集合）

## 2. 交付物标准（必须套壳）
所有输出必须包含：
- 【完成内容】做了什么（条目）
- 【输出文件】路径列表
- 【输入映射】规格/派单包条目 -> 输出对应位置
- 【自检】按验收清单逐条勾选
- 【风险与未完成】明确列出

## 3. 工件层级与目录
- 宪法层（冻结）：/docs/00_charter
- 总纲层（L1）：/docs/01_bibles
- 规格层（L2）：/docs/02_specs
- 派单层（L2->L3）：/docs/03_taskpacks
- 验收层（QA）：/docs/04_acceptance
- 审计层：/docs/05_logs

## 4. 任务执行规则
- 每个任务必须有 Task Pack（/docs/03_taskpacks/T-xxxx_taskpack.md）
- 执行者只允许引用 Task Pack 中列出的输入文件
- 输出必须落到 Task Pack 指定路径
- 若连续两次出现越权/漂移：立即停止，要求上游重写 Task Pack

## 5. 变更控制（CR）
任何新增范围/系统边界/机制：
- 必须发起 Change Request（见 /docs/00_charter/change_control.md）
- 未经批准的变更一律拒绝实现

## 6. 沟通方式
- 上游用 Task Pack “派单”
- 下游用 PR/Commit “交付”
- QA 用 Bug 单 “闭环”
不在对话里争论需求，不在对话里临时改规格。
```

这份手册就是你想要的“像汇丰邮件派工一样”：任何人（任何 Agent）都按它走，不靠临场发挥。

------

## 3）L1 六大岗位：岗位说明书（JD）+ 工件清单 + 下游交付对象

下面每个岗位我都写成你要的：**要做什么 / 输入 / 输出 / 输出给谁 / 粒度与稳定边界**。

------

### 3.1 AI 制作人（Executive Producer Agent）

**职责**

- 把你“模糊目标”固化成：MVP、里程碑、风险台账、取舍策略
- 维护“决策单”（不参与执行细节）

**输入**

- `docs/00_charter/project_charter.md`（你写/冻结）
- 你口头补充：想要的体验关键词（可选）

**输出（固定工件）**

- `docs/01_bibles/production_plan.md`：里程碑、交付门禁、依赖
- `docs/05_logs/decisions_log.md`：决策记录（每条≤10行）
- `docs/00_charter/change_control.md`：CR流程（模板化）

**交付给谁**

- PMO（制作管理）作为派单依据
- 各总监作为工作边界

**稳定粒度**

- 每次输出 1–3 页 Markdown；超出就拆分为多个子节（按里程碑）

------

### 3.2 策划总监（Design Director Agent）

**职责**

- 做《备注》的“体验闭环设计”：叙事驱动如何变成可执行系统
- 输出“策划总纲 + 系统地图”，并冻结“哪些可变、哪些不可变”

**输入**

- Charter + Production Plan
- 你们之前讨论的核心设定（如果没有，就以 Charter 为准）

**输出（固定工件）**

- `docs/01_bibles/design_bible.md`（总纲，含：体验目标/章节结构/系统清单/禁区）
- 系统列表（表格嵌入 bible 内）：系统名、职责、输入输出、状态是否允许AI改
- “可变项清单”：允许 AI 填充的内容域（对白、事件变体、文案）

**交付给谁**

- 系统策划组长（L2）
- 叙事/文案组长（L2）
- QA 总监（用于验收点）

**稳定粒度（关键）**

- **总纲必须是“可拆解的列表化”**，每个系统描述≤30行
- 叙事只到“章节→事件链→关键选择点”，不写长篇小说（避免上下文膨胀）

------

### 3.3 技术总监（Tech Director Agent）

**职责**

- 定技术边界、模块边界、数据契约、质量门禁（CI/测试/静态检查）
- 决定“哪些必须确定性实现、哪些可交给内容系统”

**输入**

- Charter + Design Bible

**输出（固定工件）**

- `docs/01_bibles/tech_bible.md`（含：架构分层、模块列表、数据格式、编码规范、门禁）
- 模块契约（附录）：事件格式、选择存档格式、文本标签格式（这些会被 L2 写成 Spec）

**交付给谁**

- 客户端组长（L2）
- 工具/管线组长（L2）
- QA（门禁与构建验收）

**稳定粒度**

- 每个模块的“输入/输出/错误处理”写清即可，**不写实现细节**
- 任何跨模块新机制必须走 CR

------

### 3.4 美术总监（Art Director Agent）

**职责**

- 统一风格（避免你吐槽的“生成出来不是一个体系”）
- 给出资产目录与规格，让执行岗可以“批量生产 + 可复用”

**输入**

- Charter + Design Bible（章节/场景需求）+ UI Spec（如果有）

**输出（固定工件）**

- `docs/01_bibles/art_bible.md`：
  - 风格基调（参考/禁区）
  - 资产分类树（角色/场景/道具/UI/特效）
  - 输出规格（尺寸/命名/格式/透明/分层规则）
- `docs/02_specs/pipelines/asset_pipeline_spec.md`：资产入库校验规则（可由工具实现）

**交付给谁**

- UI 组长 / 场景组长 / 角色组长（L2）
- 工具组长（做校验/导入）

**稳定粒度**

- 规则必须“可检查”：命名、尺寸、锚点、九宫格、分层字段
- 参考图可选，但规范必须能被脚本校验（否则执行层会失控）

------

### 3.5 QA 总监（QA Director Agent）

**职责**

- 把“可玩版本”变成可验收的门禁：冒烟/回归/发布验收
- 定缺陷分级、关闭标准、测试用例模板

**输入**

- Production Plan + Design Bible + Tech Bible

**输出（固定工件）**

- `docs/01_bibles/qa_bible.md`：总体策略
- `docs/04_acceptance/milestone_acceptance.md`：每个里程碑验收清单
- `docs/04_acceptance/qa_checklists/smoke.md`：冒烟清单
- 缺陷模板（.github issue template）

**交付给谁**

- QA 组长（L2）
- 所有组长（作为“完成定义 DoD”）

**稳定粒度**

- 全清单化（checkbox）
- 每条验收点必须能被“截图/日志/可复现步骤”证明

------

### 3.6 制作管理 PMO（Producer Ops Agent）

**职责**

- 把 L1 文档拆成 L2 可执行的“任务地图”：依赖、并行、节奏
- 维护看板：任务流转状态、阻塞点、风险预警

**输入**

- Production Plan + 各 Bible

**输出（固定工件）**

- GitHub Project 看板结构（列：Backlog / Ready / InProgress / Review / QA / Done）
- 每周/每日汇报（简短）：`docs/05_logs/task_log.md` 更新
- 依赖图（文字版即可）：哪些任务必须先完成

**交付给谁**

- 所有 L2 组长（他们按看板接活）
- 你（制作人）只看 PMO 汇报，不看细节泥潭

**稳定粒度**

- 任务颗粒度必须落到“组长可派单、执行岗可交 PR/文件”的程度
- 每个任务包预计对话次数：L1=1–2，L2=3–7，L3=拆掉不派给执行层

------

## 4）L1→L2→L3 的交付关系图（文字版）

你要的“输出到下游是谁”，用一张图说明白：

```
你(制作人)
  └─> AI制作人(Production Plan / 决策单 / CR流程)
        └─> PMO(看板 / 排期 / 依赖)
              ├─> 策划总监(Design Bible)
              │     ├─> 系统策划组长(System Specs -> Task Packs)
              │     └─> 文案组长(章节包/对白规范 -> Task Packs)
              ├─> 技术总监(Tech Bible)
              │     ├─> 客户端组长(模块Specs -> Task Packs -> PR)
              │     └─> 工具组长(管线Specs -> 工具PR/脚本)
              ├─> 美术总监(Art Bible)
              │     ├─> UI组长(UI Specs -> 资产任务包)
              │     └─> 场景/角色组长(资产清单 -> 资产包)
              └─> QA总监(QA Bible / 门禁清单)
                    └─> QA组长(用例/缺陷 -> 反馈到各组长)
```

这就是“100人组织”的本质：
不是人多，而是**交付物固定、上下游明确、越权就回滚**。

------

## 5）下一轮要把“L2/L3 颗粒度与派单包”彻底补齐（你说的缺90%就在这）

你刚才最关心的两点，我下一轮会直接给成套表格和模板：

1. **L2 组长岗位全量清单（按《备注》裁剪）**
   - 系统策划组长、叙事组长、文案组长、UI/UX组长、客户端组长、工具组长、QA组长……
   - 每个岗位：输入/输出/下游/稳定粒度上限/常见失败模式/拆分法
2. **Task Pack（派单包）全套模板 + 示例 10 份**
   - 事件脚本类
   - 文案填充类
   - UI 资源类
   - 功能 PR 类
   - 工具脚本类
   - QA 冒烟/回归类
     每份都带：验收 checklist、回执格式、回滚条件

你回复一句就行：
**“继续，给 L2 岗位全量清单 + 10 份 Task Pack 示例”**



##### 你说：

继续



###### ChatGPT 说：

好，接下来我按你要的“**像100人项目一样逐级分工派单**”把关键缺口补齐：
**L2 组长层全量岗位清单（按《备注》裁剪）** + **10 份可直接用的 Task Pack（派单包）示例**。
你拿去就能在仓库里开工、派单、回收、验收。

------

# A）L2 组长层岗位全量清单（《备注》版本）

> L2 的核心职责只有一句话：
> **把 L1 的 Bible / 里程碑，拆成“执行层可稳定产出”的 Task Pack，并负责验收与回滚。**
>
> L2 输出的稳定工件：
>
> - `/docs/02_specs/**`（规格）
> - `/docs/03_taskpacks/**`（派单包）
> - Review / 验收记录（走 PR / Issue）

下面每个岗位我都给你：**职责 / 输入 / 输出 / 下游 / 稳定粒度上限 / 拆分规则 / 工具与规范 / 常见失败模式**。

------

## A1）系统策划组长（Systems Lead）

**职责**

- 把 `design_bible.md` 的系统清单落实为：每个系统一份 `System Spec`
- 把每个系统拆成 L1/L2 Task Pack（事件格式、状态、边界、验收点）

**输入**

- `/docs/01_bibles/design_bible.md`
- `/docs/01_bibles/production_plan.md`

**输出**

- `/docs/02_specs/systems/*_system_spec.md`（每个系统 1–3 页）
- `/docs/03_taskpacks/`（系统相关派单包）

**下游交付给**

- 客户端组长（实现系统）
- 叙事/文案组长（按系统规则写内容）
- QA 组长（生成用例）

**稳定粒度上限（非常关键）**

- 单个 System Spec：**≤ 120 行**（超过必发散）
- 单个 Task Pack：**只覆盖一个系统内的一个功能点**（例如“事件条件解析”）

**拆分规则**

- 任何“跨系统”描述 ⇒ 拆成多个 Task Pack，分别派给对应系统 owner
- 任何“状态机 > 6 个状态” ⇒ 拆成主状态 + 子状态两层规格

**工具与规范**

- SpecKit/Spec-Driven：先写 spec 再写任务包
- AGENTS.md：禁止越权改边界

**常见失败模式**

- 把“故事”写成“系统规则”导致边界不清
- 规格写太长，执行层读不完 ⇒ 必漂移

------

## A2）叙事结构组长（Narrative Structure Lead）

**职责**

- 把世界观/章节目标变成“**章节包（Chapter Pack）**”：事件链、关键选择点、情绪曲线、信息揭示节奏
- 不写长篇文本，产出结构骨架

**输入**

- `world_setting.md / timeline.md`
- `design_bible.md`

**输出**

- `/content/chapters/chXX/chapter_pack.md`（每章 2–4 页）
- 章节事件列表（表格）：EventID、触发条件、入口出口、文本标签

**下游交付给**

- 文案组长（填充对白）
- 脚本/事件组长（把事件链落为脚本）
- QA 组长（章节冒烟用例）

**稳定粒度上限**

- 单章事件数：**10–25**（更多就拆章/拆分支）
- 单个“关键选择点”最多 **3 个选项**（更多玩家/AI 都会失控）

**拆分规则**

- 一章出现多个“主题转折” ⇒ 拆为主线章 + 插章
- 一个事件同时承担“推进+解释+反转” ⇒ 拆为连续 2–3 个事件

**常见失败模式**

- 把“结构”写成“文案”导致后续无法复用
- 选择点太多、不可逆、没有修复机制 ⇒ 心流崩

------

## A3）文案/对白组长（Writing Lead）

**职责**

- 建立“文本标准”：语气、标签、变量占位、敏感/禁区
- 把章节包拆成可填充的“对话包任务”

**输入**

- `chapter_pack.md`
- `art_bible.md`（UI 字体/字重/字数限制）
- 系统 spec（文本标签格式）

**输出**

- `/content/text/style_guide.md`（写作规范）
- `/content/text/chXX/*.md|json`（对白包/卡片文本）

**下游交付给**

- 脚本/事件组长（挂载文本ID）
- UI 组长（确认显示容器）
- QA 组长（校对与分支覆盖）

**稳定粒度上限**

- 单个对话包：**1 个场景 / 1 次对话**
- 单条台词：建议 **≤ 60 中文字符**（超了 UI 与节奏都难控）

**拆分规则**

- 复杂对白（>12 轮） ⇒ 拆成“前段/中段/后段”三包
- 有大量变量插值 ⇒ 先做“变量表”再写正文

**常见失败模式**

- 文案不带标签/ID ⇒ 后续挂载成本爆炸
- 情绪过饱和、信息密度过高 ⇒ 玩家疲劳

------

## A4）脚本/事件组长（Event Scripting Lead）

**职责**

- 定义事件脚本格式（JSON/YAML/自定义）在 spec 内冻结
- 把章节事件列表变成“事件脚本任务包”，并验收可跑通

**输入**

- `chapter_pack.md` 事件表
- `event_system_spec.md / choice_system_spec.md`

**输出**

- `/content/events/E0001.json ...`（事件脚本）
- `/content/events/schema.md`（字段说明）

**下游交付给**

- 客户端组长（加载/执行器）
- QA 组长（用例与断言）

**稳定粒度上限**

- 单事件脚本：**≤ 120 行 JSON** 或 **≤ 40 个字段节点**
- 单任务包：**只做 3–8 个事件**（再多就易串线）

**拆分规则**

- 事件包含复杂条件树 ⇒ 拆为“条件判断事件”+“结果事件”
- 事件涉及 UI/动画/音效多联动 ⇒ 抽成“动作序列列表”，逐条验收

**常见失败模式**

- 字段命名不统一，执行器崩
- 事件互相引用但无循环保护 ⇒ 运行死链

------

## A5）UI/UX 组长（UI Lead）

**职责**

- 输出 UI 流程、界面清单、组件库边界
- 把界面拆成“可实现的 UI 任务包”（布局/交互/状态）

**输入**

- `design_bible.md`（体验路径）
- `art_bible.md`（风格与规范）
- `tech_bible.md`（UI 技术选型）

**输出**

- `/docs/02_specs/ui/ui_flow_spec.md`（流程）
- `/docs/02_specs/ui/ui_components_spec.md`（组件）
- UI Task Packs（每个界面/组件一个）

**下游交付给**

- UI 程序执行岗（实现）
- UI 美术执行岗（出图/切图/矢量）
- QA（验收交互）

**稳定粒度上限**

- 单界面：**≤ 6 个状态**（超出就拆子页面/弹窗）
- 单组件：**≤ 3 个变体**（默认/禁用/选中）

**拆分规则**

- 一个界面承担“编辑+浏览+设置” ⇒ 拆三页
- 一个流程超过 10 步 ⇒ 拆为多个子流程

**常见失败模式**

- UI 状态没定义清楚 ⇒ 程序和测试扯皮
- 组件无复用边界 ⇒ 后期爆炸式返工

------

## A6）客户端组长（Client Lead）

**职责**

- 把 Tech Bible + System Spec 落为模块化任务
- 负责 PR 结构、集成策略、回滚策略

**输入**

- `tech_bible.md`
- `systems/*_spec.md`
- UI spec

**输出**

- `/src/` 模块实现（PR）
- `/tools/` 校验脚本（必要时）
- `/docs/04_acceptance/build_acceptance.md` 配合 QA 门禁

**下游交付给**

- QA 组长（冒烟/回归）
- 工具组长（若需管线）
- 你（里程碑可玩性验收）

**稳定粒度上限**

- 单 PR：**≤ 400 行净新增** 或 **≤ 6 个文件改动**
- 单任务：**只改一个模块**（严禁跨模块顺手修）

**拆分规则**

- 需要改两个模块 ⇒ 拆成两个 PR，以接口契约衔接
- 不确定需求 ⇒ 先做“接口空实现 + 日志”，不要硬补逻辑

**常见失败模式**

- AI 越权重构代码 ⇒ 必须回滚
- PR 太大难 review ⇒ 质量门禁失效

------

## A7）工具/管线组长（Tools & Pipeline Lead）

**职责**

- 把“内容生产”变成可自动校验/导入/打包
- 最大化让执行层不用脑子也不出错

**输入**

- 事件脚本 schema
- 文本标签规范
- 美术命名/尺寸规范

**输出**

- `/tools/validate_events.py` 等校验器
- `/tools/import_text.py` 导入器
- `/docs/02_specs/pipelines/*_pipeline_spec.md`

**下游交付给**

- 全体执行岗（他们按工具走）
- QA（自动化断言）
- 客户端（减少运行期容错成本）

**稳定粒度上限**

- 单工具：**一个职责**（只校验 or 只导入）
- CLI 参数：≤ 8 个（过多就拆命令）

**拆分规则**

- 校验项过多 ⇒ 拆为多级校验：lint / schema / semantic
- 工具既要导入又要修复 ⇒ 分成 import + fix 两个脚本

**常见失败模式**

- 工具输出不稳定（无固定格式）⇒ CI 无法接
- 校验规则没写进 spec ⇒ 人和AI各自理解一套

------

## A8）QA 组长（QA Lead）

**职责**

- 把 Bible 转成“冒烟/回归/发布验收”清单
- 管缺陷闭环：复现→分派→验证→关闭

**输入**

- `qa_bible.md`
- 系统 spec、章节包
- 最新 build/PR

**输出**

- `/docs/04_acceptance/qa_checklists/*.md`（checkbox）
- 缺陷 Issue（模板化）
- 每日质量报告（1页）

**下游交付给**

- 客户端组长/相关组长（修复）
- 你（里程碑是否达标）

**稳定粒度上限**

- 冒烟：**30 条以内**
- 回归：按模块分组，每组 **≤ 40 条**

**拆分规则**

- 用例写成段落 ⇒ 全部改为 checkbox + 期望结果一句话
- 缺陷描述无复现步骤 ⇒ 直接退回不受理

**常见失败模式**

- QA 混进需求讨论 ⇒ 上下文污染
- “凑合过” ⇒ 后面全是隐雷

------

# B）Task Pack（派单包）模板（通用）

下面这个模板你可以作为 `docs/03_taskpacks/T-xxxx_taskpack.md` 的统一格式：

```
# TASK-PACK: T-____
- Level: L1 / L2
- Owner（上游负责人）:
- Executor（执行岗/Agent）:
- Downstream Reviewer（验收人）:
- ETA（对话预算）: 1~2 / 3~7

## 1. Outcome（可观察结果）
- 完成后，玩家/系统能看到的变化是什么？

## 2. Allowed Inputs（允许引用的输入）
- 文件路径列表（只允许这些）
- 相关规格（Spec）链接

## 3. Deliverables（必须交付物）
- 输出文件路径（必须落到指定目录）
- 输出格式示例（给一段样例）

## 4. Constraints（硬约束 / 禁止事项）
- 禁止新增机制/字段/依赖
- 禁止跨模块修改
- 禁止改 Charter / System Spec

## 5. Acceptance Checklist（验收清单）
- [ ] …
- [ ] …

## 6. Self-Check（执行者自检回执格式）
- 【完成内容】
- 【输出文件】
- 【输入映射】
- 【自检结果】
- 【风险与未完成】

## 7. Rollback Triggers（回滚触发）
- 出现 X / Y / Z 直接判失败，回滚并要求上游重写派单包
```

------

# C）10 份 Task Pack 示例（可直接放进仓库）

> 说明：我用示例路径与字段名，你按你实际工程替换即可。
> 我刻意把粒度卡在“当前大模型稳定输出”的范围：
>
> - L1：1–2 次对话、单文件/少文件
> - L2：3–7 次对话、单模块/单功能点

------

## C1）T-0001（L2）叙事系统 Spec 落地（系统策划组长 → 产出规格）

```
# TASK-PACK: T-0001
- Level: L2
- Owner: 系统策划组长
- Executor: 系统策划 Agent
- Downstream Reviewer: 客户端组长 + QA组长
- 对话预算: 3~5

## 1. Outcome
产出《叙事系统》规格：职责/输入输出/状态/边界/验收点，供实现与测试拆分任务。

## 2. Allowed Inputs
- /docs/01_bibles/design_bible.md
- /docs/01_bibles/tech_bible.md
- /docs/00_charter/project_charter.md

## 3. Deliverables
- /docs/02_specs/systems/narrative_system_spec.md
格式必须包含：职责、输入、输出、状态、接口、错误处理、AI权限。

## 4. Constraints
- 不允许引入新系统
- 不允许超过120行（超出必须拆分附录）
- 所有术语必须在文档内定义一次

## 5. Acceptance Checklist
- [ ] 输入/输出可被数据结构表达
- [ ] 状态数量<=6（否则拆层）
- [ ] 明确哪些字段允许内容系统填充
- [ ] 提供最小可跑示例（伪数据）

## 6. Self-Check
按通用回执格式输出

## 7. Rollback Triggers
- 引入未在Design Bible出现的新机制
- spec 超长且无拆分
```

------

## C2）T-0002（L2）事件脚本 Schema 定义（脚本组长 → 给全体执行岗用）

```
# TASK-PACK: T-0002
- Level: L2
- Owner: 脚本/事件组长
- Executor: 脚本组长 Agent
- Downstream Reviewer: 客户端组长 + 工具组长 + QA组长
- 对话预算: 3~6

## Outcome
冻结事件脚本 schema（JSON字段），并给出2个示例事件。

## Allowed Inputs
- /docs/02_specs/systems/event_system_spec.md（如还未有，用design_bible中系统描述替代）
- /docs/01_bibles/tech_bible.md

## Deliverables
- /content/events/schema.md
- /content/events/examples/E0001.json
- /content/events/examples/E0002.json

## Constraints
- 字段总数<=20
- 必须包含：id、type、conditions、actions、next
- 禁止加入可执行代码字符串（仅结构化数据）

## Acceptance Checklist
- [ ] 2个示例可覆盖：普通推进、带选择分支
- [ ] 字段命名一致、无歧义
- [ ] 明确可选字段与默认值

## Rollback
- schema 含糊，无法写校验器
```

------

## C3）T-0003（L1）单事件脚本生成（执行岗）

```
# TASK-PACK: T-0003
- Level: L1
- Owner: 脚本/事件组长
- Executor: 事件脚本执行 Agent
- Downstream Reviewer: 脚本组长
- 对话预算: 1~2

## Outcome
新增事件 E0105，满足章节包的触发与出口要求。

## Allowed Inputs
- /content/chapters/ch01/chapter_pack.md（事件表中E0105描述）
- /content/events/schema.md

## Deliverables
- /content/events/E0105.json

## Constraints
- 单文件<=120行
- 不得新增schema字段
- actions 不得包含UI未定义动作名（如需新增动作，先提CR）

## Acceptance Checklist
- [ ] id/type符合规范
- [ ] conditions可表达触发
- [ ] next指向存在的EventID（不存在则标记TODO，不得编造）

## Rollback
- 引入新字段
- 编造不存在的EventID且不标TODO
```

------

## C4）T-0004（L2）章节包产出（叙事结构组长）

```
# TASK-PACK: T-0004
- Level: L2
- Owner: 叙事结构组长
- Executor: 叙事结构 Agent
- Downstream Reviewer: 策划总监 + QA组长
- 对话预算: 3~5

## Outcome
产出 ch02 的 chapter_pack：事件链+关键选择点+信息揭示节奏。

## Allowed Inputs
- /docs/01_bibles/design_bible.md
- /docs/01_bibles/production_plan.md
- /content/chapters/ch01/chapter_pack.md（对齐风格）

## Deliverables
- /content/chapters/ch02/chapter_pack.md（2~4页）

## Constraints
- 事件数10~25
- 关键选择点<=2，每个选项<=3
- 不写长篇对白，只写“事件目的+输入输出+文本标签”

## Acceptance Checklist
- [ ] 每个事件都有入口/出口
- [ ] 每个选择点都有“后果摘要”
- [ ] 标签体系与schema兼容

## Rollback
- 变成小说段落，缺少结构化事件表
```

------

## C5）T-0005（L1）对白包填充（文案执行岗）

```
# TASK-PACK: T-0005
- Level: L1
- Owner: 文案组长
- Executor: 文案执行 Agent
- Downstream Reviewer: 文案组长
- 对话预算: 1~2

## Outcome
为 ch02 的场景 S02-03 输出对白包（含标签与变量占位）。

## Allowed Inputs
- /content/chapters/ch02/chapter_pack.md（S02-03条目）
- /content/text/style_guide.md
- /content/text/variables.md（如无则只使用{player_name}）

## Deliverables
- /content/text/ch02/S02-03_dialogue.md

## Constraints
- 单句<=60字
- 总轮次<=12
- 必须带：角色名、情绪标签、文本ID
- 禁止新增设定/新人物

## Acceptance Checklist
- [ ] 标签齐全
- [ ] 信息密度合适（每3轮推进一次信息点）
- [ ] 变量占位格式统一

## Rollback
- 新增设定/人物
- 不带标签或ID
```

------

## C6）T-0006（L2）UI 流程规格（UI组长）

```
# TASK-PACK: T-0006
- Level: L2
- Owner: UI/UX组长
- Executor: UI组长 Agent
- Downstream Reviewer: 客户端组长 + QA组长 + 美术总监
- 对话预算: 3~6

## Outcome
冻结“对话界面 + 选择界面”流程与状态，供实现与测试。

## Allowed Inputs
- /docs/01_bibles/design_bible.md（交互需求）
- /docs/01_bibles/art_bible.md（风格/字体约束）
- /docs/01_bibles/tech_bible.md（UI技术约束）

## Deliverables
- /docs/02_specs/ui/ui_flow_spec.md（包含状态图文字描述）
- /docs/02_specs/ui/ui_components_spec.md（对话框/选项按钮/滚动区）

## Constraints
- 对话界面状态<=6
- 组件变体<=3
- 不引入新页面类型（如需新页面走CR）

## Acceptance Checklist
- [ ] 每个状态都有进入条件/退出条件
- [ ] 交互反馈明确（点击、禁用、加载）
- [ ] 可测：每条状态可写用例

## Rollback
- 状态定义含糊，无法写用例
```

------

## C7）T-0007（L2）事件执行器最小实现（客户端组长 → 程序执行）

```
# TASK-PACK: T-0007
- Level: L2
- Owner: 客户端组长
- Executor: 功能程序 Agent
- Downstream Reviewer: 客户端组长 + QA组长
- 对话预算: 4~7

## Outcome
实现“加载事件JSON -> 解析conditions/actions -> 跳转next”的最小执行器，能跑通examples。

## Allowed Inputs
- /content/events/schema.md
- /content/events/examples/E0001.json
- /content/events/examples/E0002.json
- /docs/01_bibles/tech_bible.md

## Deliverables
- /src/event/EventRunner.(ts|cpp|cs)（按你的栈）
- /src/event/EventLoader.*
- /tools/run_event_smoke.*（可选：简单命令行跑例子）
- 更新：/docs/04_acceptance/build_acceptance.md（新增一条门禁）

## Constraints
- 单PR<=400净新增行
- 不得重构其他模块
- 错误处理必须：找不到next、字段缺失、条件不满足

## Acceptance Checklist
- [ ] E0001/E0002能跑通并输出日志
- [ ] 缺字段能报错定位
- [ ] 不能死循环（next循环检测最小版即可：访问计数>50中止）

## Rollback
- PR过大或跨模块重构
- 无法跑通examples
```

------

## C8）T-0008（L1）资源命名与尺寸校验器（工具组长派给执行）

```
# TASK-PACK: T-0008
- Level: L1
- Owner: 工具/管线组长
- Executor: 工具脚本执行 Agent
- Downstream Reviewer: 工具组长
- 对话预算: 1~2

## Outcome
新增一个校验脚本：检查 /content/ui_assets 下PNG/SVG命名与尺寸是否符合规范。

## Allowed Inputs
- /docs/01_bibles/art_bible.md（命名/尺寸规则章节）
- /content/ui_assets/（目录结构）

## Deliverables
- /tools/validate_ui_assets.py
- /tools/README.md（新增使用说明1段）

## Constraints
- 输出必须为固定格式：JSON行 or 统一文本（便于CI）
- 只做校验不做修复

## Acceptance Checklist
- [ ] 能输出：违规文件列表、违规原因
- [ ] 无违规时返回码0
- [ ] 脚本运行时间<2秒（小项目标准）

## Rollback
- 输出格式不稳定
```

------

## C9）T-0009（L2）冒烟测试清单（QA组长）

```
# TASK-PACK: T-0009
- Level: L2
- Owner: QA组长
- Executor: QA组长 Agent
- Downstream Reviewer: QA总监 + 制作人（你）
- 对话预算: 2~4

## Outcome
冻结里程碑M1冒烟清单（checkbox），覆盖：启动、进入第一章、完成一次选择、返回主菜单。

## Allowed Inputs
- /docs/01_bibles/qa_bible.md
- /docs/01_bibles/production_plan.md
- /docs/02_specs/systems/*.md
- /docs/02_specs/ui/*.md

## Deliverables
- /docs/04_acceptance/qa_checklists/smoke_m1.md

## Constraints
- 总条目<=30
- 每条必须含：步骤 + 期望结果（1句）

## Acceptance Checklist
- [ ] 覆盖核心路径
- [ ] 每条可复现、可截图证明
- [ ] 有失败分级（Blocker/Major/Minor）

## Rollback
- 条目写成段落、不可执行
```

------

## C10）T-0010（L1）缺陷单闭环（QA执行岗）

```
# TASK-PACK: T-0010
- Level: L1
- Owner: QA组长
- Executor: QA执行 Agent
- Downstream Reviewer: 对应模块组长
- 对话预算: 1~2

## Outcome
为“事件E0002选择后卡死”提交一条高质量缺陷单，能被程序立即定位。

## Allowed Inputs
- /docs/04_acceptance/qa_checklists/smoke_m1.md
- 运行日志路径（如有）
- 截图（如有）

## Deliverables
- GitHub Issue（Bug模板字段填满）

## Constraints
- 必须包含：复现步骤、期望、实际、日志片段、环境信息
- 不做原因推测，只陈述事实

## Acceptance Checklist
- [ ] 复现步骤<=6步
- [ ] 有明确期望/实际
- [ ] 有定位线索（日志/事件ID/commit）

## Rollback
- 缺关键信息导致无法复现
```

------

# D）你现在可以怎么“像100人团队一样启动”（最小启动序列）

你只需要做 **L0 的一次对话**（跟我/AI 制作人定方向），然后按下面顺序让组织跑起来：

1. **L1 输出四本 Bible**（Design/Tech/Art/QA）+ Production Plan
2. **L2 先产出 4 个系统 spec**（叙事/事件/选择/UI）
3. L2 开始批量生成 Task Packs（像邮件派单）
4. L3 执行岗只认 Task Pack，交 PR/文件
5. QA 链条独立跑冒烟/缺陷闭环
6. 你只看：里程碑验收清单 + 风险台账 + 可玩build

------

# E）下一步我继续补你要的“更细、更像真团队”的部分

你现在已经有：

- L2 全岗位 IO（可落地）
- 10 个派单包样例（可直接开始）

接下来还缺两块“会让它像真的100人团队一样跑”的东西：

1. **L3 执行岗岗位全量清单（按部门拆到人头）**
   - 文案执行、事件脚本执行、UI实现、工具脚本、功能程序、测试执行、自动化测试……
   - 每个岗位：稳定粒度上限（文件/行数/token）、交付格式、典型拆分法
2. **“自动派单/回收”的编排方案**（你想要纯AI推进就必须）
   - 轻量方案：GitHub Issue + 规则 + 你手工触发
   - 理想方案：CrewAI/LangGraph + MCP 自动读取Task Pack→创建Issue→回收PR→触发验收清单

你回复一句我就继续：
**“继续，给 L3 执行岗全量清单 + 自动派单/回收编排方案（轻量+理想两套）”**



##### 你说：

继续



###### ChatGPT 说：

继续，下面这轮我给你两块“让它真的像 100 人团队运转”的硬件：

1. **L3 执行岗全量清单（按 100 人工作室拆到部门/岗位/人头）**：每个岗位做什么、吃什么输入、产什么输出、交给谁、稳定粒度上限、典型 Task Pack 类型。
2. **自动派单/回收编排方案**：一套“轻量可立即落地”、一套“理想全自动组织仿真”。

我会按《备注》这种“叙事驱动”适配，但组织结构按 100 人标准来给你。

------

## 1）L3 执行岗全量清单（100 人工作室版）

### 1.1 100 人推荐配比（可裁剪）

> 这是行业常见的“内容型项目”配比，你后续按预算砍人即可，但岗位接口别砍。

- **策划/叙事（20）**：结构策划、关卡/事件、文案、数值/经济（可选）、工具配置
- **程序（35）**：客户端/玩法/框架、UI、工具与管线、构建与发布、自动化测试、数据
- **美术（30）**：UI、场景、角色、道具、特效、动画、技术美术、概念（可选）
- **QA（10）**：功能测试、兼容/性能、自动化、验收与发布门禁
- **制作/运营支持（5）**：PM、版本/配置管理员、社区/本地化/法务对接（按需）

> 你一个人要“仿真100人”，关键不是人头，是**岗位→工件接口固定**。AI 只要按接口交付，就等价于“某岗位完成了工作”。

------

## 1.2 L3 执行岗通用规则（所有人都必须遵守）

**L3 执行岗只做一件事：**在 Task Pack 约束下交付“可回滚的最小交付物”。

- **禁止越权**：不改 Charter / Bible / System Spec，不新增机制/字段/依赖
- **交付必须可审计**：文件/PR/资源包必须能定位输入映射
- **稳定粒度上限**：超出就必须拆 Task Pack（宁可拆细，别让 AI 发散）

------

# 2）策划/内容部门（L3 执行岗）

下面每个岗位我都给：**职责｜输入｜输出｜下游｜稳定粒度上限｜典型 Task Pack**

------

## 2.1 事件脚本执行（Narrative Scripter）

- **职责**：把“事件表”落成事件脚本（JSON/YAML），保证能跑通
- **输入**：章节包事件表、schema.md、系统 spec
- **输出**：`/content/events/E0xxx.json`
- **下游**：脚本组长验收 → 客户端事件执行器 → QA 用例
- **稳定粒度上限**：单事件 ≤120 行；单任务 3–8 个事件
- **典型 Task Pack**：生成事件、修复字段、补 next/分支、补动作序列

## 2.2 分支一致性执行（Branch Consistency Editor）

- **职责**：检查分支是否自洽：触发条件/后果/回收点/是否软锁
- **输入**：chapter_pack、事件脚本、choice spec
- **输出**：`/content/chapters/chXX/branch_audit.md`（问题清单 + 建议拆分）
- **下游**：叙事组长/脚本组长/QA
- **稳定粒度上限**：一次只审 1 章或 1 条分支链
- **典型 Task Pack**：分支审计、软锁检测、条件覆盖检查

## 2.3 文案执行（Writer）

- **职责**：按“对白规范+标签”填充对话包/卡片文本
- **输入**：chapter_pack 场景条目、style_guide、变量表
- **输出**：`/content/text/chXX/Sxx-xx_dialogue.md`
- **下游**：文案组长 → 脚本挂载 → QA 校对
- **稳定粒度上限**：1 场景 ≤12 轮对白；单句 ≤60 字
- **典型 Task Pack**：对白包、旁白、提示/卡片文本、选项文案

## 2.4 文本标签/变量执行（Text Integrator）

- **职责**：把文案变成可引用的 TextID、变量占位一致化
- **输入**：对白包、schema、文本标签规范
- **输出**：`/content/text/index.json` 或 `text_ids.csv`（按你栈）
- **下游**：客户端加载器/工具导入器/QA
- **稳定粒度上限**：一次只处理 1 章
- **典型 Task Pack**：生成 TextID、变量校验、缺失标签补齐

## 2.5 数值/进度配置执行（可选，Economy/Progress Config）

- **职责**：把“体验节奏”落为配置（解锁、消耗、节拍）
- **输入**：design_bible 节奏段落、progress spec
- **输出**：`/content/config/progress.json`
- **下游**：客户端/QA
- **稳定粒度上限**：一次只配置一个子系统（如“章节解锁”）
- **典型 Task Pack**：配置表、校验规则、边界值测试点

------

# 3）程序部门（L3 执行岗）

## 3.1 玩法/系统程序执行（Gameplay Engineer）

- **职责**：实现单模块单功能点，交付可合并 PR
- **输入**：System Spec + Task Pack + 接口契约
- **输出**：PR（含最小测试/日志/可运行）
- **下游**：客户端组长 Review → CI → QA
- **稳定粒度上限**：单 PR ≤400 行净新增，≤6 文件；只改一个模块
- **典型 Task Pack**：事件执行器、条件解析、选择存档、章节跳转

## 3.2 UI 程序执行（UI Engineer）

- **职责**：实现单界面或单组件（含状态机、交互、数据绑定）
- **输入**：UI flow spec + components spec + art 规范
- **输出**：PR + UI 资源引用清单
- **下游**：UI组长/客户端组长/QA
- **稳定粒度上限**：单界面 ≤6 状态；单组件 ≤3 变体
- **典型 Task Pack**：对话框、选项列表、文本滚动、历史回看

## 3.3 数据/存档执行（Data/Save Engineer）

- **职责**：数据结构、序列化、兼容策略（版本号）
- **输入**：choice spec、event spec、tech bible
- **输出**：存档格式 + 迁移逻辑 PR + 说明文档
- **下游**：客户端组长/QA（回归）
- **稳定粒度上限**：一次只动一个数据版本升级
- **典型 Task Pack**：save v1、迁移 v1→v2、校验器

## 3.4 工具脚本执行（Tools Engineer）

- **职责**：导入/导出/校验/批处理脚本（让内容生产不靠人脑）
- **输入**：pipeline spec、schema、命名规则
- **输出**：`/tools/*.py|ts` + README
- **下游**：全体执行岗/CI/QA
- **稳定粒度上限**：单工具=单职责；输出格式固定（JSON行或统一文本）
- **典型 Task Pack**：schema 校验、textID 校验、资源命名校验、打包脚本

## 3.5 构建发布执行（Build/Release Engineer）

- **职责**：CI、打包、版本号、构建门禁（可重复出包）
- **输入**：build_acceptance、tech bible
- **输出**：`.github/workflows/*` + 出包说明 + 版本记录
- **下游**：QA/制作人验收
- **稳定粒度上限**：一次只改一个工作流/一个阶段
- **典型 Task Pack**：CI 加步骤、缓存、产物上传、版本标记

## 3.6 自动化测试执行（Automation Engineer）

- **职责**：冒烟自动化、事件脚本回归、日志断言
- **输入**：smoke checklist、schema、事件示例
- **输出**：自动化脚本 + 报告格式 + CI 集成
- **下游**：QA组长/客户端组长
- **稳定粒度上限**：一次只自动化 5–10 条用例
- **典型 Task Pack**：事件跑通测试、存档回归、UI点击路径

------

# 4）美术部门（L3 执行岗）

> 你想要“纯 AI 后续实现”，美术最容易失控，所以**必须以 Art Bible + Asset Pipeline 校验为核心**。

## 4.1 UI 美术执行（UI Artist）

- **职责**：按组件规范输出 UI 资产（SVG/PNG/字体/九宫格）
- **输入**：components spec、art bible 输出规格
- **输出**：`/content/ui_assets/...`
- **下游**：UI 程序/工具校验/QA
- **稳定粒度上限**：一次只做 1 个界面或 3–5 个组件
- **典型 Task Pack**：按钮三态、对话框背景、图标集、字体配置

## 4.2 场景/道具执行（Environment/Props Artist）

- **职责**：按网格/尺寸规则产出场景块、道具块（可复用）
- **输入**：场景清单、tile/单位规范、命名规范
- **输出**：`/content/env_tiles/...`
- **下游**：关卡/脚本组长（引用ID）+ 校验器
- **稳定粒度上限**：一次只做一组同风格 assets（10–20 个以内）
- **典型 Task Pack**：地块套件、道具套件、遮挡/前景层

## 4.3 特效/动效执行（VFX/Motion）

- **职责**：UI 动效、过渡、提示反馈（轻量）
- **输入**：UI flow spec、动效规范
- **输出**：动效配置/序列帧/曲线文件
- **下游**：UI 程序/QA
- **稳定粒度上限**：一次只做 1 个交互反馈（如“选择确认”）
- **典型 Task Pack**：点击反馈、转场、提示闪烁、加载动画

## 4.4 技术美术执行（TA）

- **职责**：资产规范可检查化（规则→脚本），以及“生成一致性”策略
- **输入**：art bible、asset pipeline spec
- **输出**：校验规则、批处理脚本、导出预设
- **下游**：工具组长/所有美术执行岗
- **稳定粒度上限**：一次只固化一个规则簇（命名/尺寸/锚点）
- **典型 Task Pack**：Aseprite/导出预设、PNG压缩、atlas打包规则

------

# 5）QA 部门（L3 执行岗）

## 5.1 功能测试执行（Functional Tester）

- **职责**：按清单执行冒烟/回归，提交高质量缺陷单
- **输入**：checklists、build、章节包
- **输出**：Bug Issue（复现步骤/期望/实际/日志/截图）
- **下游**：对应组长/程序执行岗
- **稳定粒度上限**：一次只测一条路径或一个模块
- **典型 Task Pack**：冒烟跑通、分支覆盖、存档回归

## 5.2 兼容/性能执行（Compatibility/Perf）

- **职责**：启动耗时、内存峰值、帧率/卡顿点（按平台）
- **输入**：build、性能指标门槛
- **输出**：性能报告（固定模板）+ 缺陷单
- **下游**：客户端组长/制作人
- **稳定粒度上限**：一次只测一个场景/章节
- **典型 Task Pack**：启动性能、章节切换、文本加载压力

------

# 6）L3 “稳定粒度上限”总表（你要的核心）

这张表是让大模型稳定的关键（超过就漂移）：

- **代码 PR**：≤400 行净新增、≤6 文件、单模块
- **事件脚本**：单事件 ≤120 行；单任务 3–8 个事件
- **章节包**：2–4 页；事件 10–25；选择点 ≤2；选项 ≤3
- **对白包**：1 场景 ≤12 轮；单句 ≤60 字
- **UI**：单界面 ≤6 状态；单组件 ≤3 变体
- **校验工具**：单工具单职责；输出格式固定
- **冒烟清单**：≤30 条 checkbox

------

------

# 7）自动派单/回收编排方案（两套）

你说的理想状态 = “制作人拍板后，组织自己滚动推进”。要做到这一点，不靠玄学，靠**事件驱动编排 + 工件状态机**。

我给两套：

## 7.1 轻量方案（今天就能用）

**目标**：不用搭复杂编排框架，也能实现“逐级派单、逐级回收、可并行、不串线”。

### 核心工具

- GitHub Projects（看板）+ Issue 模板（派单）
- Repo 中的 `/docs/03_taskpacks` 作为“邮件正文”
- Cursor + PromptX（角色包）执行
- CI（可选）跑校验脚本

### 流程（强制）

1. **L2 组长**在 repo 写 `T-xxxx_taskpack.md`
2. 用 Issue 模板创建任务单：
   - 标题：`[T-xxxx] xxx`
   - 内容只贴：Task Pack 路径 + 预期交付路径 + 验收人
   - 打 label：`role:writer` / `role:engineer` / `role:qa` 等
3. **执行 Agent（L3）**只读 Task Pack + Allowed Inputs，交 PR 或文件
4. **验收人（L2）**按 checklist 勾选：
   - PASS → 移到 Done
   - MINOR_FIX → comment 指定修正点（不改需求）
   - MAJOR_FIX/ROLLBACK → 关闭 Issue + 记录 rollback_log，并要求重写 Task Pack
5. **QA 链路**独立：冒烟清单/缺陷单走自己的 label 流程，不混进开发 Issue 里

### 这套的优点/缺点（实话）

- ✅ 最稳、最容易落地、最不串线
- ❌ “自动化程度”不高：派单/收单仍需要你或 L2 点几下

> 但这套已经能做到：你只盯 L1/L2，执行层滚动推进。

------

## 7.2 理想方案（真正“组织仿真”自动滚动）

**目标**：你给方向后，系统自动：拆解→派单→追踪→回收→触发验收→生成周报/风险台账。

### 推荐架构（不纠结工具名，纠结能力）

- **编排内核**：LangGraph *或* CrewAI（层级团队）
- **工具协议**：MCP（读写文件、GitHub、CI、日志、构建产物）
- **状态存储**：SQLite/Postgres（任务状态机、审计记录、对话预算）
- **触发器**：GitHub Webhook（Issue/PR 事件触发编排）

### 系统组件（对应你要的岗位层级）

- **L0 Producer Orchestrator**：接收你的一句话“本周目标/MVP”，只产出决策单和里程碑
- **L1 Directors**：按 Bible 模板生成/更新规格（必须短、可拆）
- **L2 Leads**：把 Spec 变成 Task Pack 队列（含对话预算、风险等级、验收人）
- **L3 Executors**：领取 Task Pack，调用 MCP 工具改文件/开 PR
- **QA Lane**：自动生成冒烟/回归队列，PR 合并后自动触发测试任务

### 任务状态机（你要的“工程化流转”）

- `DRAFT`（Task Pack 草稿）
- `READY`（可派单：输入齐、验收点齐）
- `IN_PROGRESS`（执行中：绑定一个执行 Agent）
- `REVIEW`（L2 验收）
- `QA`（通过后进入 QA 冒烟/回归）
- `DONE`（关闭并记录日志）
- `ROLLED_BACK`（越权/漂移/超预算）

### 风险分流（让系统自动决定“能不能全自动”）

- **低风险（L1任务、内容填充）**：可自动派单 + 自动验收部分（schema校验/格式校验）
- **中风险（L2模块实现）**：自动派单，但合并必须人审（客户端组长）
- **高风险（L3系统级变更）**：自动拦截，强制走 CR + 你拍板

### 关键门禁（防止“AI 组织自嗨”）

- **合并门禁**：任何 PR 必须满足：
  - 对应 Task Pack ID
  - 通过校验脚本（schema/lint）
  - L2 reviewer 显式 PASS（人点一下也行）
- **范围门禁**：检测是否改动了冻结目录（charter/bibles/specs），改了就自动拒绝

### 这套的优点/缺点（实话）

- ✅ 真正实现“组织自动滚动”
- ✅ 你只看：里程碑验收 + 风险台账 + 可玩 build
- ❌ 搭建成本高（但一旦搭起来，你以后所有项目都能复用）

------

# 8）你下一步应该怎么选（不问你确认，但给你最优默认）

按你现在的目标（《备注》验证“纯AI中等规模项目”）：

- **默认最优**：先用 **轻量方案跑通 1 周**（你会立刻看到组织节奏与瓶颈）
- 同时把“理想方案需要的状态机字段”先写进 Task Pack（比如 risk、budget、reviewer），这样以后升级编排不返工。

------

# 9）下一轮我继续补什么，才能“真正可执行到每天怎么干”

你现在已经有“组织结构 + 执行岗 + 编排两套”。
下一步我建议直接给你：

1. **L1/L2/L3 全岗位的 PromptX 角色包结构（每个角色一份“能力声明+禁止事项+输出模板”）**
2. **GitHub Issue/PR 模板全套（taskpack / change_request / bug）**
3. **第一周《备注》真实任务地图（按里程碑 M1 拆到 50–120 个任务包，带对话预算）**

你回一句就行：
**“继续，把角色包（PromptX 结构）+ 模板 + M1 第一周任务地图给我”**



##### 你说：

继续



###### ChatGPT 说：

下面给你**三件可以直接落到仓库里、并且真的能驱动“100人虚拟工作室”滚动运转**的硬货：

1. **PromptX 角色包（Role Packs）结构与完整样例**：L0/L1/L2/L3 全链路可用（带权限、输出模板、失败回滚触发）。
2. **GitHub Issue/PR 模板全套**：Task Pack / Change Request / Bug / PR 模板 + 标签体系 + 看板列建议。
3. **M1（第一周）真实任务地图**：按《备注》MVP“可玩闭环”拆到 **80 个任务包**（含对话预算、依赖、下游验收人、稳定粒度）。

> 你要的理想状态 = 你先和我把“核心方案”定掉，然后后面靠组织结构滚动推进。
> 所以这套设计的关键是：**所有角色都只吃“工件”，不吃“长聊天记忆”。**

------

# 1）PromptX 角色包结构（可直接入库）

> 我不假设你 PromptX 的具体 DSL 一定长啥样（不同版本可能有差异），但**角色包的“内容契约”是通用的**：
> 你可以把它做成 PromptX profile / 也可以做成 MCP Prompts / 也可以让 Cursor rules 引用。
> 我给的是**仓库可维护、可版本化、可审计**的 YAML 结构。

## 1.1 目录结构（建议）

```
/promptx/
  /roles/
    L0_producer.yaml
    L1_design_director.yaml
    L1_tech_director.yaml
    L1_art_director.yaml
    L1_qa_director.yaml
    L1_pmo.yaml
    L2_systems_lead.yaml
    L2_narrative_lead.yaml
    L2_writing_lead.yaml
    L2_event_scripting_lead.yaml
    L2_ui_lead.yaml
    L2_client_lead.yaml
    L2_tools_lead.yaml
    L2_qa_lead.yaml
    L3_writer.yaml
    L3_scripter.yaml
    L3_ui_engineer.yaml
    L3_gameplay_engineer.yaml
    L3_tools_engineer.yaml
    L3_tester.yaml
  /skills/
    read_taskpack.yaml
    produce_selfcheck_receipt.yaml
    enforce_scope_guardrails.yaml
    create_issue_stub.yaml
    write_spec_from_bible.yaml
  /workflows/
    wf_L2_generate_taskpacks.yaml
    wf_L3_execute_taskpack.yaml
    wf_QA_smoke_cycle.yaml
```

## 1.2 角色包通用字段规范（Role Contract）

```
id: L2_CLIENT_LEAD
name: "客户端组长"
level: "L2"
purpose: "把规格拆成可合并PR级任务包并验收"
authority:
  can_read:
    - "/docs/**"
    - "/src/**"
    - "/content/**"
    - "/tools/**"
  can_write:
    - "/docs/02_specs/**"
    - "/docs/03_taskpacks/**"
  forbidden_write:
    - "/docs/00_charter/**"   # 冻结层
    - "/docs/01_bibles/**"    # L1层（需CR）
scope_guardrails:
  forbid_new_systems: true
  forbid_schema_changes_without_CR: true
  forbid_cross_module_refactor: true
inputs_required:
  - "Task Pack path OR Spec path"
outputs_required:
  - "固定输出壳：完成内容/输出文件/输入映射/自检/风险"
acceptance_style:
  checklist_first: true
  fail_fast_rules:
    - "越权改冻结目录 => 立即失败并回滚"
    - "输出不落指定路径 => 退回"
stable_granularity_limits:
  pr_net_new_lines_max: 400
  touched_files_max: 6
communication:
  upstream: "L1 技术总监 / PMO"
  downstream: "L3 程序执行岗"
  review_by: "L2 组长/QA"
output_templates:
  receipt: |
    【完成内容】
    - ...
    【输出文件】
    - ...
    【输入映射】
    - ...
    【自检】
    - [ ] ...
    【风险与未完成】
    - ...
```

------

# 2）核心角色包样例（可直接复制）

> 下面给你**最关键 12 个**（L0/L1/L2/L3 各挑最核心）。其余岗位你按这个模式批量复制即可。

## 2.1 L0：制作人（你）辅助 Agent（L0 Producer）

```
id: L0_PRODUCER
name: "AI制作人"
level: "L0"
purpose: "把模糊目标固化为里程碑/取舍/风险台账；不介入执行细节"
authority:
  can_read: ["/docs/**"]
  can_write:
    - "/docs/01_bibles/production_plan.md"
    - "/docs/05_logs/decisions_log.md"
    - "/docs/00_charter/change_control.md"
  forbidden_write:
    - "/docs/00_charter/project_charter.md"
scope_guardrails:
  forbid_detail_design: true
  forbid_implementation_advice: true
outputs_required:
  - "production_plan.md 更新（<=3页）"
  - "决策单（每条<=10行）"
stable_granularity_limits:
  pages_max: 3
output_templates:
  decision: |
    DECISION-ID: D-____
    背景:
    选项:
    决策:
    影响范围:
    验收点:
```

## 2.2 L1：策划总监（Design Director）

```
id: L1_DESIGN_DIRECTOR
name: "策划总监"
level: "L1"
purpose: "产出Design Bible：体验闭环、系统清单、章节结构、禁区"
authority:
  can_read: ["/docs/00_charter/**", "/docs/01_bibles/production_plan.md", "/docs/05_logs/decisions_log.md"]
  can_write: ["/docs/01_bibles/design_bible.md"]
scope_guardrails:
  forbid_new_tech_constraints: true
outputs_required:
  - "design_bible.md（列表化、可拆任务）"
stable_granularity_limits:
  lines_per_system_desc_max: 30
  total_pages_target: 5
```

## 2.3 L1：技术总监（Tech Director）

```
id: L1_TECH_DIRECTOR
name: "技术总监"
level: "L1"
purpose: "产出Tech Bible：模块边界、数据契约、质量门禁；决定确定性/可AI域"
authority:
  can_read: ["/docs/00_charter/**", "/docs/01_bibles/design_bible.md"]
  can_write: ["/docs/01_bibles/tech_bible.md"]
scope_guardrails:
  forbid_feature_design: true
stable_granularity_limits:
  modules_max: 12
  schema_fields_max: 20
```

## 2.4 L1：美术总监（Art Director）

```
id: L1_ART_DIRECTOR
name: "美术总监"
level: "L1"
purpose: "产出Art Bible：风格、资产树、命名/尺寸/导出规则（可校验）"
authority:
  can_read: ["/docs/01_bibles/design_bible.md", "/docs/00_charter/**"]
  can_write: ["/docs/01_bibles/art_bible.md", "/docs/02_specs/pipelines/asset_pipeline_spec.md"]
scope_guardrails:
  forbid_uncheckable_rules: true
stable_granularity_limits:
  naming_rules_max: 30
```

## 2.5 L1：QA总监（QA Director）

```
id: L1_QA_DIRECTOR
name: "QA总监"
level: "L1"
purpose: "产出QA Bible与里程碑验收门禁（checkbox化）"
authority:
  can_read: ["/docs/01_bibles/**", "/docs/02_specs/**"]
  can_write: ["/docs/01_bibles/qa_bible.md", "/docs/04_acceptance/**"]
stable_granularity_limits:
  smoke_items_max: 30
```

## 2.6 L1：PMO（制作管理）

```
id: L1_PMO
name: "PMO"
level: "L1"
purpose: "把Bible拆成任务地图与依赖，维护看板与周报"
authority:
  can_read: ["/docs/**"]
  can_write: ["/docs/05_logs/task_log.md"]
outputs_required:
  - "任务地图（issue列表/看板列）"
  - "阻塞与风险摘要（<=1页）"
```

------

## 2.7 L2：系统策划组长（Systems Lead）

```
id: L2_SYSTEMS_LEAD
name: "系统策划组长"
level: "L2"
purpose: "把Design Bible系统清单落成System Spec并拆Task Pack"
authority:
  can_read: ["/docs/01_bibles/**", "/docs/00_charter/**"]
  can_write: ["/docs/02_specs/systems/**", "/docs/03_taskpacks/**"]
stable_granularity_limits:
  spec_lines_max: 120
  states_max: 6
```

## 2.8 L2：脚本/事件组长（Event Scripting Lead）

```
id: L2_EVENT_SCRIPTING_LEAD
name: "脚本/事件组长"
level: "L2"
purpose: "冻结事件schema并派发事件脚本任务包，验收可跑通"
authority:
  can_read: ["/content/**", "/docs/02_specs/**"]
  can_write: ["/content/events/schema.md", "/docs/03_taskpacks/**"]
stable_granularity_limits:
  event_lines_max: 120
  events_per_taskpack_max: 8
```

## 2.9 L2：客户端组长（Client Lead）

```
id: L2_CLIENT_LEAD
name: "客户端组长"
level: "L2"
purpose: "把系统spec拆成PR级任务包，Review与集成回滚"
authority:
  can_read: ["/docs/**", "/src/**", "/tools/**", "/content/**"]
  can_write: ["/docs/03_taskpacks/**"]
stable_granularity_limits:
  pr_net_new_lines_max: 400
  touched_files_max: 6
```

## 2.10 L2：工具/管线组长（Tools Lead）

```
id: L2_TOOLS_LEAD
name: "工具/管线组长"
level: "L2"
purpose: "把规范变成校验器/导入器，减少执行层出错"
authority:
  can_read: ["/docs/**", "/content/**"]
  can_write: ["/tools/**", "/docs/03_taskpacks/**", "/docs/02_specs/pipelines/**"]
stable_granularity_limits:
  cli_args_max: 8
  single_tool_single_responsibility: true
```

## 2.11 L2：QA组长（QA Lead）

```
id: L2_QA_LEAD
name: "QA组长"
level: "L2"
purpose: "维护冒烟/回归清单与缺陷闭环；不参与需求争论"
authority:
  can_read: ["/docs/**"]
  can_write: ["/docs/04_acceptance/**", "/docs/05_logs/**"]
stable_granularity_limits:
  smoke_items_max: 30
  regression_items_per_group_max: 40
```

------

## 2.12 L3：执行岗通用包（Writer/Scripter/Engineer/Tester）

> L3 的核心是：**只认 Task Pack，交付最小可回滚成果**。你可以复用同一模板改个名字。

```
id: L3_EXECUTOR_GENERIC
name: "执行岗（通用）"
level: "L3"
purpose: "严格按Task Pack交付文件/PR/缺陷单；不得越权"
authority:
  can_read: ["TaskPack.AllowedInputs only"]
  can_write: ["TaskPack.Deliverables paths only"]
scope_guardrails:
  forbid_scope_expansion: true
  forbid_schema_changes: true
output_templates:
  receipt: |
    【完成内容】
    - ...
    【输出文件/PR】
    - ...
    【输入映射】
    - ...
    【自检】
    - [ ] ...
    【风险与未完成】
    - ...
rollback_triggers:
  - "改了冻结目录"
  - "引入新字段/新机制"
  - "输出未落指定路径"
```

------

# 3）GitHub Issue/PR 模板全套（可直接放进 `.github`）

## 3.1 Task Pack Issue 模板（`.github/ISSUE_TEMPLATE/taskpack.yml`）

```
name: Task Pack
description: 派单包任务（L2->L3 / L2->L2）
title: "[T-XXXX] <短描述>"
labels: ["taskpack", "ready"]
body:
  - type: input
    id: task_id
    attributes:
      label: Task ID
      placeholder: "T-0001"
    validations:
      required: true

  - type: dropdown
    id: level
    attributes:
      label: Level
      options: ["L1", "L2", "L3"]
    validations:
      required: true

  - type: input
    id: taskpack_path
    attributes:
      label: Task Pack 路径
      placeholder: "/docs/03_taskpacks/T-0001_taskpack.md"
    validations:
      required: true

  - type: input
    id: owner
    attributes:
      label: Owner（上游负责人）
      placeholder: "L2_CLIENT_LEAD"
    validations:
      required: true

  - type: input
    id: reviewer
    attributes:
      label: Reviewer（验收人）
      placeholder: "L2_QA_LEAD / L2_CLIENT_LEAD"
    validations:
      required: true

  - type: input
    id: budget
    attributes:
      label: 对话预算
      placeholder: "1~2 / 3~7"
    validations:
      required: true

  - type: textarea
    id: notes
    attributes:
      label: 备注（可选）
      description: 只写风险/依赖，不写需求正文（正文在Task Pack里）
```

## 3.2 变更单 CR 模板（`.github/ISSUE_TEMPLATE/change_request.yml`）

```
name: Change Request
description: 范围/系统边界/Schema 变更申请（必须审批）
title: "[CR] <变更标题>"
labels: ["change-request", "needs-approval"]
body:
  - type: textarea
    id: background
    attributes:
      label: 背景
      description: 为什么要变更？不变更的代价？
    validations:
      required: true

  - type: textarea
    id: change
    attributes:
      label: 变更内容（明确到文件/字段/系统）
    validations:
      required: true

  - type: textarea
    id: impact
    attributes:
      label: 影响范围（系统/任务/测试/里程碑）
    validations:
      required: true

  - type: dropdown
    id: risk
    attributes:
      label: 风险等级
      options: ["Low", "Medium", "High"]
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: 验收点
    validations:
      required: true
```

## 3.3 Bug 模板（`.github/ISSUE_TEMPLATE/bug_report.yml`）

```
name: Bug Report
description: 缺陷单（必须可复现）
title: "[BUG] <简短描述>"
labels: ["bug", "triage"]
body:
  - type: textarea
    id: repro
    attributes:
      label: 复现步骤（<=6步）
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: 期望结果
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: 实际结果
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: 日志/截图/事件ID/commit（越具体越好）
    validations:
      required: false

  - type: input
    id: env
    attributes:
      label: 环境信息（版本号/平台）
    validations:
      required: true
```

## 3.4 PR 模板（`.github/PULL_REQUEST_TEMPLATE.md`）

```
## 对应任务
- Task Pack: /docs/03_taskpacks/T-____.md
- Issue: #

## 完成内容
- [ ] ...

## 输出文件/模块
- ...

## 输入映射（Spec/Task Pack -> 输出）
- ...

## 自检
- [ ] 通过校验脚本（如有）
- [ ] 未修改冻结目录（/docs/00_charter, /docs/01_bibles, /docs/02_specs/systems）
- [ ] PR 粒度符合（<=400行净新增，<=6文件，单模块）

## 风险与未完成
- ...
```

## 3.5 标签体系（建议）

- `taskpack`, `ready`, `in-progress`, `review`, `qa`, `done`
- `role:writer`, `role:scripter`, `role:ui`, `role:gameplay`, `role:tools`, `role:qa`
- `risk:low`, `risk:med`, `risk:high`
- `change-request`, `needs-approval`

------

# 4）M1 第一周任务地图（80个任务包，带预算与依赖）

## 4.1 M1 定义（可玩闭环）

**M1 目标**：能内部试玩一条“叙事闭环”

- 启动 → 主菜单 → 新游戏
- 进入 ch01：事件链（10–15个事件）
- 至少 1 个关键选择（<=3选项）
- 选择后进入结果事件并结束章节（或回到菜单）
- 冒烟清单通过（<=30条）

> 第一周的策略：**先把轨道铺好（Bible/Spec/Schema/Runner/UI）**，然后内容用 L1/L3 批量填充。

------

## 4.2 任务地图（按泳道分组）

> 表里字段含义：
>
> - **Owner**：负责拆分/验收的人（组长/总监）
> - **Exec**：执行岗位（执行Agent类型）
> - **Budget**：对话预算（稳定范围）
> - **Deps**：依赖任务ID（没写就表示可并行）

### A）L1 总纲层（6个）

1. **T-0100** Production Plan v1 — Owner:L0_PRODUCER Exec:L0_PRODUCER Budget:2~3
2. **T-0101** Design Bible v1 — Owner:L1_DESIGN_DIRECTOR Exec:L1_DESIGN_DIRECTOR Budget:3~5 Dep:T-0100
3. **T-0102** Tech Bible v1 — Owner:L1_TECH_DIRECTOR Exec:L1_TECH_DIRECTOR Budget:3~5 Dep:T-0101
4. **T-0103** Art Bible v1 — Owner:L1_ART_DIRECTOR Exec:L1_ART_DIRECTOR Budget:3~5 Dep:T-0101
5. **T-0104** QA Bible v1 — Owner:L1_QA_DIRECTOR Exec:L1_QA_DIRECTOR Budget:2~4 Dep:T-0102
6. **T-0105** 看板/标签/模板落地 — Owner:L1_PMO Exec:L1_PMO Budget:1~2 Dep:T-0100

### B）L2 规格层（系统/流程/spec）（12个）

1. **T-0200** narrative_system_spec — Owner:L2_SYSTEMS_LEAD Exec:L2_SYSTEMS_LEAD Budget:3~5 Dep:T-0101
2. **T-0201** event_system_spec — Owner:L2_SYSTEMS_LEAD Exec:L2_SYSTEMS_LEAD Budget:3~5 Dep:T-0101
3. **T-0202** choice_system_spec — Owner:L2_SYSTEMS_LEAD Exec:L2_SYSTEMS_LEAD Budget:3~5 Dep:T-0101
4. **T-0203** ui_system_spec — Owner:L2_SYSTEMS_LEAD Exec:L2_SYSTEMS_LEAD Budget:3~5 Dep:T-0101
5. **T-0204** event_schema_v1 — Owner:L2_EVENT_SCRIPTING_LEAD Exec:L2_EVENT_SCRIPTING_LEAD Budget:3~6 Dep:T-0201,T-0102
6. **T-0205** ui_flow_spec_v1 — Owner:L2_UI_LEAD Exec:L2_UI_LEAD Budget:3~6 Dep:T-0101,T-0103,T-0102
7. **T-0206** ui_components_spec_v1 — Owner:L2_UI_LEAD Exec:L2_UI_LEAD Budget:3~6 Dep:T-0205
8. **T-0207** content_pipeline_spec_v1 — Owner:L2_TOOLS_LEAD Exec:L2_TOOLS_LEAD Budget:2~4 Dep:T-0204
9. **T-0208** asset_pipeline_spec_v1 — Owner:L2_TOOLS_LEAD Exec:L2_TOOLS_LEAD Budget:2~4 Dep:T-0103
10. **T-0209** build_acceptance_v1 — Owner:L2_QA_LEAD Exec:L2_QA_LEAD Budget:1~2 Dep:T-0104
11. **T-0210** milestone_acceptance_M1 — Owner:L2_QA_LEAD Exec:L2_QA_LEAD Budget:1~2 Dep:T-0104

### C）L2 → L3 工具/校验器（8个）

1. **T-0300** validate_events_schema_tool — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0204
2. **T-0301** validate_text_tags_tool — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0207
3. **T-0302** validate_assets_naming_tool — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0208
4. **T-0303** import_text_tool — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:2~4 Dep:T-0207
5. **T-0304** run_smoke_script_stub — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0209
6. **T-0305** CI: run validators — Owner:L2_CLIENT_LEAD Exec:L3_build_release_engineer Budget:2~3 Dep:T-0300,T-0301,T-0302
7. **T-0306** CI: artifact packaging stub — Owner:L2_CLIENT_LEAD Exec:L3_build_release_engineer Budget:2~3 Dep:T-0305
8. **T-0307** tools README standard — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0300

### D）L2 → L3 客户端最小实现（16个）

1. **T-0400** EventLoader v1 — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:3~5 Dep:T-0204
2. **T-0401** EventRunner v1 (conditions/actions/next) — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:4~7 Dep:T-0400
3. **T-0402** loop guard & error reporting — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:2~4 Dep:T-0401
4. **T-0403** Choice record/store v1 — Owner:L2_CLIENT_LEAD Exec:L3_data_save_engineer Budget:3~5 Dep:T-0202
5. **T-0404** Save/Load minimal (optional but建议) — Owner:L2_CLIENT_LEAD Exec:L3_data_save_engineer Budget:3~6 Dep:T-0403
6. **T-0405** UI Dialogue Panel — Owner:L2_CLIENT_LEAD Exec:L3_ui_engineer Budget:3~6 Dep:T-0206
7. **T-0406** UI Choice Panel — Owner:L2_CLIENT_LEAD Exec:L3_ui_engineer Budget:3~6 Dep:T-0206
8. **T-0407** UI History/Log minimal (可选) — Owner:L2_CLIENT_LEAD Exec:L3_ui_engineer Budget:2~4 Dep:T-0405
9. **T-0408** Bind event actions -> UI display — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:3~5 Dep:T-0401,T-0405
10. **T-0409** Start menu / New Game stub — Owner:L2_CLIENT_LEAD Exec:L3_ui_engineer Budget:2~4 Dep:T-0205
11. **T-0410** chapter start entry — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:2~4 Dep:T-0409
12. **T-0411** logging format standard — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:1~2 Dep:T-0401
13. **T-0412** build config baseline — Owner:L2_CLIENT_LEAD Exec:L3_build_release_engineer Budget:2~4 Dep:T-0102
14. **T-0413** asset load stub (placeholders) — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:2~3 Dep:T-0103
15. **T-0414** smoke path automation hook — Owner:L2_QA_LEAD Exec:L3_automation_engineer Budget:2~4 Dep:T-0304,T-0409
16. **T-0415** crash-safe guards (null/invalid) — Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:2~4 Dep:T-0401

### E）L2 → L3 叙事与内容（28个：先结构后填充）

1. **T-0500** ch01 chapter_pack — Owner:L2_NARRATIVE_LEAD Exec:L2_NARRATIVE_LEAD Budget:3~5 Dep:T-0101
2. **T-0501** ch01 event list (EventID规划) — Owner:L2_EVENT_SCRIPTING_LEAD Exec:L2_EVENT_SCRIPTING_LEAD Budget:2~3 Dep:T-0500,T-0204
3. **T-0502~T-0511** 事件脚本 E0101-E0110（10个L1）— Owner:L2_EVENT_SCRIPTING_LEAD Exec:L3_scripter Budget:1~2 each Dep:T-0501
4. **T-0512** 关键选择点脚本（含<=3选项）— Owner:L2_EVENT_SCRIPTING_LEAD Exec:L3_scripter Budget:1~2 Dep:T-0501
5. **T-0513~T-0517** 结果事件脚本（5个L1）— Owner:L2_EVENT_SCRIPTING_LEAD Exec:L3_scripter Budget:1~2 each Dep:T-0512
6. **T-0520** ch01 写作规范/style_guide — Owner:L2_WRITING_LEAD Exec:L2_WRITING_LEAD Budget:2~4 Dep:T-0101
7. **T-0521~T-0530** ch01 场景对白包（10个L1）— Owner:L2_WRITING_LEAD Exec:L3_writer Budget:1~2 each Dep:T-0500,T-0520
8. **T-0531** 选项文案包（L1）— Owner:L2_WRITING_LEAD Exec:L3_writer Budget:1~2 Dep:T-0520
9. **T-0532** 文本标签/变量整合（ch01）— Owner:L2_WRITING_LEAD Exec:L3_text_integrator Budget:2~4 Dep:T-0521~T-0531
10. **T-0533** 文本导入运行（tool+流程）— Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0303,T-0532
11. **T-0534** 分支一致性审计（ch01）— Owner:L2_NARRATIVE_LEAD Exec:L3_branch_editor Budget:1~2 Dep:T-0512,T-0513~T-0517
12. **T-0535** 修复审计问题（拆2-4个L1任务）— Owner:L2_EVENT_SCRIPTING_LEAD Exec:L3_scripter Budget:1~2 each Dep:T-0534

### F）L2 → L3 美术占位与一致性（6个：先规范后占位）

1. **T-0600** UI 组件占位资源包（按钮/面板/字体）— Owner:L2_UI_LEAD Exec:L3_ui_artist Budget:2~4 Dep:T-0206,T-0103
2. **T-0601** 图标占位集（10-20个）— Owner:L2_UI_LEAD Exec:L3_ui_artist Budget:2~4 Dep:T-0103
3. **T-0602** assets 命名/尺寸校验跑通 — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0302,T-0600
4. **T-0603** 章节背景占位（1-2张）— Owner:L2_ART_LEAD Exec:L3_env_artist Budget:2~4 Dep:T-0103,T-0500
5. **T-0604** 转场/提示动效占位（1个）— Owner:L2_UI_LEAD Exec:L3_vfx_motion Budget:1~2 Dep:T-0205
6. **T-0605** 资产入库清单更新 — Owner:L2_TOOLS_LEAD Exec:L3_tools_engineer Budget:1~2 Dep:T-0600~T-0604

### G）QA：冒烟/回归与缺陷闭环（12个）

1. **T-0700** Smoke checklist M1（<=30条）— Owner:L2_QA_LEAD Exec:L2_QA_LEAD Budget:2~4 Dep:T-0210,T-0205
2. **T-0701** ch01 冒烟执行（人工）— Owner:L2_QA_LEAD Exec:L3_tester Budget:1~2 Dep:T-0700,T-0409,T-0410
3. **T-0702** 事件跑通自动化（5条）— Owner:L2_QA_LEAD Exec:L3_automation_engineer Budget:2~4 Dep:T-0414,T-0300
4. **T-0703** 分支覆盖测试（关键选择）— Owner:L2_QA_LEAD Exec:L3_tester Budget:1~2 Dep:T-0512,T-0700
5. **T-0704** 缺陷分派与修复回归（循环任务）— Owner:L2_QA_LEAD Exec:L3_tester Budget:持续 Dep:T-0701~
6. **T-0705** Build acceptance gate执行 — Owner:L2_QA_LEAD Exec:L3_tester Budget:1~2 Dep:T-0209,T-0305
7. **T-0706** 发布验收（里程碑M1）— Owner:你 Exec:L2_QA_LEAD Budget:1 Dep:T-0705,T-0703
8. **T-0707~T-0711** 修复类PR（5个预留L2/L3任务）— Owner:L2_CLIENT_LEAD Exec:L3_gameplay_engineer Budget:1~2 each Dep:bug出现后
9. **T-0712** 复盘：返工原因与模板修订 — Owner:L1_PMO Exec:L1_PMO Budget:1~2 Dep:M1完成

> 合计：约 80 个任务包（其中大量 L1 可并行），完全符合你要的“像团队那样逐级派单”。

------

# 5）把“自动派单/回收”落到你现在能用的操作（不等你搭大编排）

你现在就能这么跑（不需要新系统）：

- **L1/L2 产出 Spec/TaskPack 都提交 PR**（或直接合并到主干）
- PMO 用 GitHub Projects 把 Task Pack 建成 Issue（用 taskpack 模板）
- 执行岗（AI）每次只领一个 Issue：
  - 打开 Task Pack → 只读 Allowed Inputs → 交 PR → 填 PR 模板
- Reviewer（L2）只做 checklist：PASS / MINOR / MAJOR / ROLLBACK
- QA 走自己的 lane：smoke checklist + bug 模板

这套机制你一旦跑起来，就具备“组织在滚动”的感觉：你不再靠脑子记上下文，靠看板和工件。

------

# 6）下一步我直接把“第一天怎么启动”也给你（不需要你补信息）

如果你希望我继续把落地做到“小时级操作清单”，下一轮我会给你：

1. **M1 Day1（8小时）行动清单**：你先和我把《备注》核心体验定到 1 页，然后自动触发 L1 Bible 产出顺序。
2. **把上面 80 个任务包生成成真实的 /docs/03_taskpacks/T-xxxx_taskpack.md 文件内容**（不是列表，是每个文件的正文）——这一步会非常长，但确实能直接进仓库用。

你回一句你要哪种粒度：

- “继续：给 Day1 行动清单” 或
- “继续：把 80 个 Task Pack 正文全部生成”



##### 你说：

目前规则和粒度都比较像样了，当然还有些还不够具体的，或者说流程拆得不够细的，我们要结合当前技术架构，纯AI工具情况下，重点是提供有限上下文保证输出结果符合预期，例如UI制作，先分析功能，生成UI的UE图以及图素需求，然后实现功能版UI，然后再回来分析图素需求是否有调整和补充，然后制定详细的图素生产需求，然后再调用文生图生成资产，然后review资产，规范化标准化资产，有问题重新生成，然后再整合到功能版UI里，变成正式版UI，然后测试验收，反馈改进，循环迭代，完成闭环，场景也是大概这样流程，需要生成功能版场景，角色这块更长一点，需要先生成原画，然后根据原画（文生图里的参考图）生成角色三视图，然后根据三视图（文生图里的参考图）生成idle、run等功能性序列帧动画等等，里面岗位流转我没写，你应该能懂，其他岗位工种都要详细到这种程度，我说得可能还不完全，你需要结合你对各个岗位和各个工种的流程的了解，把游戏开发过程中所涉及的所有产出都根据岗位和流转情况做完整补充



###### ChatGPT 说：

你这个要求我完全懂：**不是“岗位列表+大流程”**，而是要把每个工种做到“像工厂工序”那样——**先功能版→再提炼图素需求→生成资产→Review→标准化→集成→测试→回收改进**，并且每一步都有**有限上下文**可稳定执行、可回滚、可复盘。

下面我给你一份 **“AI-Native 游戏研发全工种闭环流程规范 v1.0（UE为例）”**：

- 覆盖：UI、场景、角色、动画、特效、音频、叙事、程序、工具管线、构建发布、QA
- 每个工种：**步骤分解 + 岗位流转 + 输入/输出工件 + 验收门禁 + 返工策略 + 上下文包（Context Pack）模板**
- 重点：**让执行岗拿到一份 Task Pack 就能稳定交付**，不靠长聊天记忆

------

# 0. 统一的“AI-Native 工序模型”

所有工种都用同一个闭环，不然你控不住上下文，也控不住质量。

## 0.1 工序阶段（固定）

1. **功能/结构定义**（可验证、可跑通）
2. **规格固化**（Spec：输入/输出/状态/约束/验收）
3. **功能版实现**（Prototype/Graybox：不追求美）
4. **资产需求提炼**（Asset Requirements：清单化、可校验）
5. **资产生成与筛选**（Gen → Review → Regenerate）
6. **标准化与入库**（命名/尺寸/锚点/层级/元数据）
7. **集成与回归**（替换占位 → 走冒烟/回归）
8. **质量闭环**（缺陷单 → 修复 → 再验收）

## 0.2 三条硬门禁（所有工种通用）

- **门禁A：Spec 冻结后，执行岗不得改 Spec**（要改走 CR）
- **门禁B：资产入库必须过校验器**（命名/尺寸/格式/元数据）
- **门禁C：每次交付必须可回滚**（单 PR / 单资源包 / 单脚本包）

## 0.3 有限上下文规则（最关键）

- 执行岗（L3）**只拿到：任务目标 + 允许输入 + 输出路径 + 验收清单 + 禁止事项**
- 任何“解释背景、讲故事、讨论方案”的内容都不下发给 L3
- 一切依赖靠“工件路径”引用，不靠“你还记得吗”

------

# 1. UI 工种闭环（UE / UMG）

你举的 UI 流程我扩成完整“岗位链条 + 工件链条”。

## 1.1 角色流转

- **L1 UI/UX 总监**：定体验目标、交互原则、信息层级
- **L2 UI 组长**：拆界面/组件、写 UI Spec、派单、验收
- **L3 UI 程序**：做功能版 UI（UMG 结构、数据绑定、状态）
- **L3 UI 美术**：按图素需求产出资源（按钮/面板/图标/字体）
- **L2 工具/管线**：校验器、atlas/导入规则
- **L2 QA**：用例、冒烟、缺陷闭环

## 1.2 工件链条（固定）

1. `ui_flow_spec.md`（流程/状态机）
2. `ui_components_spec.md`（组件清单/变体/状态）
3. **功能版 UMG 蓝图结构**（Widget Tree + Binding + Placeholder）
4. `ui_asset_requirements.md`（图素需求清单）
5. `/content/ui_assets/**`（生成资源）
6. `ui_assets_manifest.json`（入库清单/元数据）
7. **正式版 UI（替换占位）**
8. `smoke_ui.md`（UI冒烟清单） + bug issues

## 1.3 详细工序（你要的“细到可派单”）

### Step UI-S1：功能分析 → UI Spec（L2 UI组长）

- 输入：Design Bible（该功能）、Tech Bible（UI框架约束）
- 输出：`/docs/02_specs/ui/ui_flow_spec.md` + `ui_components_spec.md`
- 验收：
  - 单界面状态 ≤ 6；单组件变体 ≤ 3
  - 每个状态有进入/退出条件 + 可写用例

### Step UI-S2：功能版 UI（L3 UI程序）

- 输入：UI Spec、占位资源规范（art bible）
- 输出：UMG Widgets（布局/交互/数据绑定/状态切换）
- 验收：
  - 可跑通关键路径（不需要美）
  - 日志/调试信息可定位状态流转
- 返工触发：状态不清/交互缺口 → 退回 UI组长补 spec（不是程序硬猜）

### Step UI-S3：图素需求提炼（L2 UI组长 + L2 工具）

- 输入：功能版 UI 截图/Widget Tree 导出 + UI Spec
- 输出：`ui_asset_requirements.md`（**清单化**）
  - 每个资源：ID、用途、尺寸、9-slice、锚点、层级、状态（normal/hover/pressed/disabled/selected）
- 验收：可被脚本校验（尺寸/命名/状态数量）

### Step UI-S4：资产生成与筛选（L3 UI美术）

- 输入：图素需求清单（只给该清单，不给整项目）
- 输出：资源包（PNG/SVG/字体）
- Review：
  - 风格一致性（Art Bible）
  - 清晰度/对比度/可读性
  - 状态之间差异明确
- 不合格：按“失败原因标签”重生成（不要原地修补）

### Step UI-S5：标准化入库（L2 工具/管线）

- 输入：资源包
- 输出：
  - 命名/尺寸校验通过
  - 生成 `ui_assets_manifest.json`（记录来源/版本/用途/状态）
- 验收：CI 跑校验器全绿

### Step UI-S6：集成替换（L3 UI程序）

- 输入：manifest + 正式资源
- 输出：正式 UI（所有占位替换）
- 验收：同一界面截图对比（占位→正式）无布局崩

### Step UI-S7：测试闭环（QA）

- 输入：UI冒烟清单
- 输出：缺陷单（复现≤6步+截图/日志）
- 回流：缺陷单分派到 UI组长（需求/规格问题）或 UI程序（实现问题）或 UI美术（资产问题）

## 1.4 UI 的 Context Pack（执行岗稳定版）

> **只给这 6 块**，不要给更多。

- 任务目标（Outcome）
- 允许输入：UI Spec 路径 + 功能版截图（最多2张）
- 输出路径（明确到文件夹）
- 禁止事项（不得改 spec / 不得新增组件类型）
- 验收 checklist（≤10条）
- 回执格式（完成内容/文件/自检/风险）

------

# 2. 场景/关卡工种闭环（环境：灰盒→美术→整合）

你提到“场景先功能版”非常对。场景的核心不是画得美，而是**可走、可交互、可触发事件**。

## 2.1 角色流转

- L1 关卡/叙事总监：章节目标、节奏、关键事件点
- L2 关卡组长：关卡结构 spec、交互点清单
- L3 关卡执行：灰盒（blockout）+ 触发器布局
- L3 场景美术：模块化资产生产（tile/props）
- L2 TA/管线：网格、尺寸、碰撞、LOD/atlas/命名校验
- QA：路径/触发/软锁测试

## 2.2 工件链条

1. `level_spec.md`（区域划分/路径/事件点）
2. `interaction_points.csv`（触发器清单）
3. **灰盒关卡（可跑通）**
4. `env_asset_requirements.md`（地块/道具/前景遮挡清单）
5. 资产生成→筛选→标准化
6. **美术版关卡替换**
7. 路径/触发回归（软锁/卡死/穿模）

## 2.3 关键工序

- 灰盒必须先过：
  - **可走通**、**触发器可触发**、**节奏可体验**
- 再做资产清单：
  - 模块化优先（tile/props 套件）
  - 所有资产必须有：尺寸单位、锚点、碰撞策略
- 美术替换后必须跑：
  - 触发点偏移检查
  - 遮挡层/交互层一致性检查

------

# 3. 角色工种闭环（你说的“三视图→序列帧→动画”我补全）

角色是最长链条，也是最容易失控的，所以必须拆成“可稳定生成”的段落。

## 3.1 角色流转

- L1 美术总监：风格、比例、材质与禁区
- L2 角色组长：角色规格（比例/关键特征/动作集/帧规格）
- L3 概念原画：生成多候选 → 选定 master
- L3 三视图执行：正/侧/背 + 关键细节放大
- L3 动作设计：动作列表、关键帧描述、节奏
- L3 序列帧生成：idle/run/etc（按统一帧尺寸/对齐点）
- L2 TA/管线：对齐点、切片、命名、atlas、导入规则
- L3 集成：在引擎里跑起来、碰撞/朝向/镜头适配
- QA：动作切换、循环、抖动、穿帮检测

## 3.2 角色工件链条（固定）

1. `character_spec.md`（比例/服饰/色板/禁区/动作集/帧规格）
2. `concept_candidates/`（候选集）→ `concept_master.png`（定稿）
3. `turnaround_3view.png`（三视图定稿）
4. `animation_sheet_specs.md`（每个动作：帧数、节奏、对齐点、loop规则）
5. `spritesheets/`（每个动作一张）+ `meta.json`（frame index、pivot）
6. 引擎内 Animation/Flipbook 资源
7. 集成测试报告 + 缺陷闭环

## 3.3 关键工序细化（保证“有限上下文可稳定交付”）

### Step CH-S1：原画候选 → 定稿（L3概念）

- 输入：character_spec（只给这一份）
- 输出：4–8 张候选 + 选择理由（清单化）
- 评审：L2 角色组长 + L1 美术总监选 1 张 master
- 返工：只允许“重生成”，不允许“口头改一点点”（会越改越漂）

### Step CH-S2：三视图（L3三视图）

- 输入：concept_master + 三视图规范（比例线、关键部位一致性）
- 输出：正/侧/背 + 关键细节（鞋/背包/发型）
- 验收：轮廓一致、比例一致、颜色一致、细节在三视图闭合

### Step CH-S3：动作规格（L2角色组长）

- 输入：玩法/镜头/移动速度设定（简单值即可）
- 输出：动作集：idle/run/walk/turn/hit/…（M1只做2–3个）
- 每个动作给：帧数范围、loop点、关键姿态文字描述、对齐点规则（脚底/重心）

### Step CH-S4：序列帧生成（L3动画执行）

- 输入：三视图 + 动作规格 + 帧尺寸/对齐点模板
- 输出：每个动作一套序列帧（固定命名）
- 验收：
  - 所有帧 pivot 不漂
  - loop 无跳帧
  - run 的脚步节奏一致
- 返工：发现 pivot 漂移 → 回到“对齐点模板”修正，不要继续生成更多动作

### Step CH-S5：标准化入库（L2 TA/管线）

- 产出：atlas + meta.json（frame rect + pivot + fps）
- 校验：命名、尺寸、透明边界、对齐点、帧数一致

### Step CH-S6：引擎集成（L3集成）

- 在 UE 中：导入纹理/atlas，生成 Flipbook/动画资源，接入角色蓝图
- 验收：idle/run 切换不抖、不漂、不穿帮

------

# 4. 特效（VFX）闭环（更像“交互反馈工序”）

特效的本质是**反馈**，所以从“触发条件→表现→时长→可读性”倒推。

- 工件：`vfx_spec.md`（触发、时长、层级、性能预算）
- 先做功能版（方块/闪烁占位）验证节奏
- 再做资产生成（序列帧/材质）
- 校验：同屏数量上限、透明叠加、亮度控制
- 集成：挂到事件 action 列表

------

# 5. 音频闭环（和你项目记忆一致：参数化优先）

- 先定义：事件→音频点位 spec（`audio_points.csv`）
- 功能版：用占位 beep/loop 验证节奏
- 再生成/合成：SFX 参数化脚本 + 少量 AI 音色补充
- 标准化：响度、长度、循环点、命名
- 集成：事件 action 引用音频 ID
- QA：重复触发、叠加、打断策略

------

# 6. 叙事/文本闭环（内容也要“可测试”）

- 先结构：章节包（事件链+选择点）
- 再文案：对白包（带 TextID/标签/变量）
- 工具校验：缺失标签、变量未定义、TextID重复
- 集成：事件脚本引用 TextID
- QA：分支覆盖 + 文本溢出 + 逻辑自洽检查

------

# 7. 程序/工具/构建/QA 的“全流程闭环”

你要 100 人组织真正跑起来，程序侧要把“质量门禁”做成工具。

## 7.1 程序交付闭环（PR级）

- Task Pack 必须限定：单模块、≤400行、≤6文件
- PR 模板必须带：输入映射 + 自检 + 未改冻结目录声明
- CI 必须至少跑：schema 校验、命名校验、基础冒烟脚本
- QA 冒烟清单必须 checkbox 化（≤30条）

------

# 8. “所有产出物”的总清单（按大类）

你说“需要补全所有产出”，我把它列成一个“交付物字典”，后续你可以直接让 PMO/组长按它派单。

## 8.1 规格类（L1/L2）

- Project Charter、Production Plan、Design/Tech/Art/QA Bible
- System Specs（叙事/事件/选择/UI/存档…）
- UI Flow/Components Spec、Level Spec、Character Spec
- Pipelines Spec（资产/文本/事件/构建/校验）

## 8.2 任务包类（L2→L3）

- Task Packs（每个对应一个可回滚交付）

## 8.3 内容/资产类（L3）

- 章节包、事件脚本、对白包、文本索引/变量表
- UI 资产包 + manifest
- 场景块/道具块 + 清单
- 角色：原画、三视图、动作序列帧、atlas+meta
- VFX 资源、音频资源

## 8.4 工具/管线类（程序/工具岗）

- 校验器（schema/命名/尺寸/缺失引用）
- 导入器（文本/事件/atlas）
- CI workflow、构建脚本、冒烟自动化

## 8.5 质量类（QA）

- 冒烟清单、回归清单、里程碑验收清单
- 缺陷单、修复回归记录、质量日报/周报

------

# 9. 你下一步最需要的“落地增强”（把“还不够细”补到可执行）

你现在差的不是理念，而是我把上面这些流程**固化成可派单的“工序卡（Task Pack 模板族）”**。

我建议下一轮我直接给你两样：

1. **按工种输出“工序卡模板族”**（UI/场景/角色/文本/事件/程序/工具/QA 各 1 套模板）
2. **每套模板给 3 个完整实例**（共 ~24 个实例），这样你就能按实例批量复制派单。

我会默认 UE（UMG + 内容脚本 + 资源导入）来写，确保每一步的输入输出都是“有限上下文可稳定执行”的粒度。



##### 你说：

继续



###### ChatGPT 说：

继续。下面给你你要的“**工序卡模板族（Task Pack Family）**”：把每个工种拆到**有限上下文也能稳定产出**的粒度，并且每个工种给 **1 套模板 + 3 份完整实例**（你直接复制到 `/docs/03_taskpacks/` 就能派单跑闭环）。

> 统一约定（所有工序卡通用）

- **Owner（上游）**：L2 组长（负责派单/验收/回滚）
- **Executor（执行）**：L3 执行岗 Agent（只认 Allowed Inputs）
- **Reviewer（验收）**：Owner 或指定下游（如 QA / 客户端组长）
- **对话预算**：L1=1–2；L2=3–7
- **失败就回滚**：越权/改冻结目录/新增字段/输出不落指定路径

------

# 0）通用工序卡模板（所有工种共享骨架）

把它当成“ISO 作业指导书”的统一格式。

## 模板：`TP_BASE.md`

- **TASK-PACK**：T-xxxx
- **Type**：UI / ENV / CHAR / TEXT / EVENT / CODE / TOOL / QA
- **Level**：L1/L2
- **Owner / Executor / Reviewer**
- **Budget**：对话预算
- **Deps**：依赖（文件路径或任务ID）

### 1. Outcome（可观察结果）

- 完成后能“看到/跑通/验证”的变化（1–3条）

### 2. Allowed Inputs（允许引用）

- 文件路径清单（只允许这些）
- 图片/截图（最多2张）
- 规格（spec）路径

### 3. Deliverables（必须交付）

- 输出文件/目录（必须落到指定路径）
- 格式示例（给一段样例）

### 4. Constraints（硬约束）

- 不允许做什么（越权即失败）
- 粒度上限（行数/状态数/帧数/文件数）

### 5. Steps（工序步骤）

- Step 1 …
- Step 2 …
  （最多 7 步，超过就拆任务）

### 6. Acceptance Checklist（验收清单）

-  …（≤10条，checkbox化）

### 7. Regenerate Tags（失败原因标签）

- `STYLE_MISMATCH` / `SPEC_AMBIGUOUS` / `PIVOT_DRIFT` / `NAMING_FAIL` / `FLOW_BROKEN` / `SCHEMA_VIOLATION` …

### 8. Self-Check Receipt（执行回执格式）

- 【完成内容】
- 【输出文件/PR】
- 【输入映射】
- 【自检结果】
- 【风险与未完成】

------

# 1）UI 工序卡模板族（UE/UMG）

你说的那条 UI 闭环，我把它拆成 6 类标准工序卡：
**UI-SPEC → UI-PROTOTYPE → UI-ASSET-REQ → UI-GEN-ASSET → UI-STANDARDIZE → UI-INTEGRATE&QA**

## 1.1 模板族：UI 工序卡（摘要）

- **UI-SPEC（L2）**：写 flow + components spec
- **UI-PROTOTYPE（L2/L3）**：功能版 UMG（占位）
- **UI-ASSET-REQ（L2）**：图素需求清单（可校验）
- **UI-GEN-ASSET（L1）**：按清单生成资源（多候选）
- **UI-STANDARDIZE（L1）**：命名/尺寸/锚点/九宫格/manifest
- **UI-INTEGRATE&QA（L2/L1）**：替换占位 + 冒烟/缺陷闭环

------

## 1.2 UI 工序卡实例 1：功能版 UI（对话+选择）

**T-UI-0001_taskpack.md**

- Type:UI Level:L2
- Owner:L2_UI_LEAD Executor:L3_UI_ENGINEER Reviewer:L2_CLIENT_LEAD+L2_QA_LEAD
- Budget:3–6
- Deps:`/docs/02_specs/ui/ui_flow_spec.md`, `/docs/02_specs/ui/ui_components_spec.md`

### Outcome

- 在 UE 中可跑通：对话显示 → 选项出现 → 选择记录 → 进入下一事件（占位UI即可）

### Allowed Inputs

- `/docs/02_specs/ui/ui_flow_spec.md`
- `/docs/02_specs/ui/ui_components_spec.md`
- `/docs/02_specs/systems/event_system_spec.md`（如有）
- （最多2张）功能流程草图截图（可选）

### Deliverables

- `/src/ui/WBP_Dialogue.uasset`（或对应路径）
- `/src/ui/WBP_Choice.uasset`
- `/src/ui/UIBindings.md`（列出绑定字段/事件）
- 日志输出约定：`UI_STATE: <state>`（写进实现或文档）

### Constraints

- 单界面状态 ≤ 6；单组件变体 ≤ 3
- 禁止新增页面类型（新页面走 CR）
- 禁止跨模块改动（只改 UI 模块）

### Steps

1. 从 `ui_flow_spec` 抽取状态机（进入/退出条件）
2. 搭 Widget Tree（占位图）
3. 做数据绑定（文本、选项列表）
4. 做交互（点击选项→回调）
5. 输出 `UIBindings.md`（让QA可测）

### Acceptance Checklist

-  进入对话状态能显示文本
-  进入选择状态能显示≤3选项
-  点击选项有日志与回调
-  状态切换有日志可定位
-  不依赖任何新资源/新字段

### Regenerate Tags

- `FLOW_BROKEN` `STATE_UNCLEAR` `OVER_SCOPE`

------

## 1.3 UI 工序卡实例 2：图素需求清单（从功能版回推）

**T-UI-0002_taskpack.md**

- Type:UI Level:L2
- Owner:L2_UI_LEAD Executor:L2_UI_LEAD_AGENT Reviewer:L1_ART_DIRECTOR+L2_TOOLS_LEAD
- Budget:3–5
- Deps:功能版 UI 截图 + components spec

### Outcome

- 输出可校验的 `ui_asset_requirements.md`：每个图素ID、尺寸、九宫格、状态集、锚点、用途

### Allowed Inputs

- `/docs/02_specs/ui/ui_components_spec.md`
- 功能版 UI 截图（最多2张）
- `/docs/01_bibles/art_bible.md`（输出规范章节）

### Deliverables

- `/docs/02_specs/ui/ui_asset_requirements.md`（清单化）
  格式必须包含表格列：
  `AssetID | Usage | Size(px) | Slice(9) | Pivot | States | Format | Notes`

### Constraints

- 每个组件最多拆 1–5 个图素（否则说明组件设计过重，需要返工组件）
- States 必须来自规范：`normal/hover/pressed/disabled/selected`（不足可用子集，但需说明）

### Steps

1. 列组件清单 → 逐个分解图素
2. 给每个图素分配 AssetID（可读且稳定）
3. 写尺寸/九宫格/锚点规则
4. 标注状态集差异（哪些状态必须有视觉差）

### Acceptance Checklist

-  每个图素都有唯一 AssetID
-  尺寸与九宫格可实现
-  状态集明确且可测试
-  可被校验器检查（命名/尺寸字段不缺）

### Regenerate Tags

- `SPEC_AMBIGUOUS` `UNTESTABLE_REQ`

------

## 1.4 UI 工序卡实例 3：生成+筛选+标准化一批按钮资源

**T-UI-0003_taskpack.md**

- Type:UI Level:L1
- Owner:L2_UI_LEAD Executor:L3_UI_ARTIST Reviewer:L2_UI_LEAD+L2_TOOLS_LEAD
- Budget:1–2
- Deps:`ui_asset_requirements.md`

### Outcome

- 交付按钮组件资源（含三态）并通过命名/尺寸校验，生成 manifest 条目

### Allowed Inputs

- `/docs/02_specs/ui/ui_asset_requirements.md`（只取 Button_* 相关条目）
- `/docs/01_bibles/art_bible.md`（风格与输出格式）

### Deliverables

- `/content/ui_assets/button/` 下：
  - `Button_Primary_normal.png`
  - `Button_Primary_pressed.png`
  - `Button_Primary_disabled.png`
- `/content/ui_assets/ui_assets_manifest.json`（追加条目）

### Constraints

- 只做这 3 个文件（别顺手做别的）
- 尺寸必须与 requirements 一致
- 不合格直接重生成（不要PS式修补）

### Steps

1. 按 requirements 生成 3–5 套候选（内部筛选）
2. 选最佳 1 套输出到目标路径
3. 跑命名/尺寸校验（若失败按失败标签重来）
4. 更新 manifest（写用途、尺寸、状态）

### Acceptance Checklist

-  三态差异清晰
-  尺寸/透明边界合规
-  命名完全符合规范
-  manifest 有对应条目

### Regenerate Tags

- `STYLE_MISMATCH` `NAMING_FAIL` `LOW_READABILITY`

------

------

# 2）场景/关卡（ENV）工序卡模板族（灰盒→资产→替换→回归）

## 2.1 模板族摘要

- **ENV-SPEC（L2）**：level_spec + interaction_points
- **ENV-GRAYBOX（L2/L3）**：灰盒可跑通
- **ENV-ASSET-REQ（L2）**：模块化资产清单（tile/props/遮挡层）
- **ENV-GEN-ASSET（L1）**：批量生成资产套件
- **ENV-INTEGRATE（L2/L3）**：替换灰盒、保持触发点与路径
- **ENV-QA（L1）**：软锁/卡死/穿模/遮挡回归

## 2.2 ENV 实例 1：灰盒关卡（ch01 走通+触发点）

**T-ENV-0001_taskpack.md**

- Type:ENV Level:L2
- Owner:L2_LEVEL_LEAD Executor:L3_LEVEL_BLOCKOUT Reviewer:L2_EVENT_SCRIPTING_LEAD+L2_QA_LEAD
- Budget:3–6

### Outcome

- ch01 灰盒场景可走通，关键触发点可触发对应 EventID

### Allowed Inputs

- `/content/chapters/ch01/chapter_pack.md`
- `/docs/02_specs/systems/event_system_spec.md`
- `/docs/02_specs/levels/level_spec_ch01.md`（如还未有，可先生成草案）

### Deliverables

- `/src/levels/CH01_Blockout.umap`（或对应关卡文件）
- `/content/levels/ch01/interaction_points.csv`（触发点清单：PointID, Position, EventID）

### Constraints

- 只做灰盒（几何体+占位材质）
- 触发点数量 ≤ 25（超出说明章节设计太碎）
- 不引入新事件ID（没有就标 TODO）

### Steps

1. 从 chapter_pack 提取事件节点与发生位置
2. 搭灰盒路径（入口→关键点→出口）
3. 放触发器并绑定 EventID（以 csv 记录）
4. 走一遍路径，确保不软锁

### Acceptance Checklist

-  入口到出口可走通
-  至少 5 个关键触发点可触发
-  interaction_points.csv 字段齐全
-  没有卡死/穿模的必现点

### Regenerate Tags

- `SOFTLOCK` `EVENT_BIND_MISSING` `OVER_COMPLEX`

## 2.3 ENV 实例 2：资产需求清单（tile/props 套件）

**T-ENV-0002_taskpack.md**

- Type:ENV Level:L2
- Owner:L2_ENV_ART_LEAD Executor:L2_ENV_ART_LEAD_AGENT Reviewer:L2_TOOLS_LEAD+L1_ART_DIRECTOR
- Budget:3–5

### Outcome

- 输出 ch01 的模块化资产需求清单（可复用优先），并能被校验器检查命名/尺寸

### Allowed Inputs

- `/src/levels/CH01_Blockout.umap` 的截图（最多2张）
- `/docs/01_bibles/art_bible.md`
- `/docs/02_specs/levels/level_spec_ch01.md`

### Deliverables

- `/docs/02_specs/env/env_asset_requirements_ch01.md`
  表格列：`AssetID | Category(tile/prop/fg) | SizeUnit | Anchor | Collision | Notes`

### Constraints

- tile 种类 ≤ 12；prop ≤ 20（超出先合并归类）
- 所有资产必须有 SizeUnit 和 Anchor（否则无法对齐）

### Acceptance Checklist

-  清单数量在上限内
-  分类明确，优先复用
-  每项含尺寸/锚点/碰撞策略

## 2.4 ENV 实例 3：生成一套地块 tile（10个以内）并入库

**T-ENV-0003_taskpack.md**

- Type:ENV Level:L1
- Owner:L2_ENV_ART_LEAD Executor:L3_ENV_ARTIST Reviewer:L2_TOOLS_LEAD
- Budget:1–2

### Outcome

- 交付 tile 套件（≤10个）并通过命名/尺寸/透明边界校验

### Allowed Inputs

- `/docs/02_specs/env/env_asset_requirements_ch01.md`（只取 tile 条目）
- `/docs/01_bibles/art_bible.md`

### Deliverables

- `/content/env_tiles/ch01/`（PNG/SVG）
- `/content/env_tiles/ch01/manifest.json`

### Constraints

- 每个 tile 尺寸必须一致（如 64x64 或 Spec 指定）
- 不合格直接重生成（不要补丁式修）

### Acceptance Checklist

-  命名符合规范
-  尺寸一致、无多余透明边
-  manifest 有尺寸与用途

------

------

# 3）角色（CHAR）工序卡模板族（原画→三视图→动作→序列帧→入库→集成）

这是你最关心的“长链条”，我按可稳定生成拆得更细。

## 3.1 模板族摘要

- **CHAR-SPEC（L2）**：比例/特征/动作集/帧规格
- **CHAR-CONCEPT（L1）**：候选→选 master
- **CHAR-3VIEW（L1）**：三视图
- **CHAR-ANIM-SPEC（L2）**：每个动作帧数/节奏/对齐点
- **CHAR-ANIM-FRAMES（L1）**：生成序列帧（单动作）
- **CHAR-ATLAS&META（L1）**：atlas + meta(pivot/fps)
- **CHAR-INTEGRATE（L2/L1）**：引擎内跑通 idle/run

## 3.2 CHAR 实例 1：角色原画候选→选 master

**T-CHAR-0001_taskpack.md**

- Type:CHAR Level:L1
- Owner:L2_CHARACTER_LEAD Executor:L3_CONCEPT_ARTIST Reviewer:L1_ART_DIRECTOR+L2_CHARACTER_LEAD
- Budget:1–2

### Outcome

- 输出 6 张候选原画，并给出“可实现性”理由，供选定 master

### Allowed Inputs

- `/docs/02_specs/characters/character_A_spec.md`
- `/docs/01_bibles/art_bible.md`（风格禁区）

### Deliverables

- `/content/characters/A/concept_candidates/`（6张）
- `/content/characters/A/concept_select_notes.md`（每张3条理由）

### Constraints

- 候选必须同一风格同一比例
- 禁止新增设定/新装备（超出 spec）

### Acceptance Checklist

-  比例一致
-  轮廓识别强
-  服饰细节可在三视图闭合

### Regenerate Tags

- `STYLE_MISMATCH` `PROPORTION_DRIFT` `DETAIL_UNCLOSABLE`

## 3.3 CHAR 实例 2：三视图（正/侧/背）+细节放大

**T-CHAR-0002_taskpack.md**

- Type:CHAR Level:L1
- Owner:L2_CHARACTER_LEAD Executor:L3_TURNAROUND_ARTIST Reviewer:L2_CHARACTER_LEAD
- Budget:1–2
- Deps:concept_master

### Outcome

- 交付三视图定稿，保证关键细节一致，便于动画帧生成

### Allowed Inputs

- `/content/characters/A/concept_master.png`
- `/docs/02_specs/characters/turnaround_rules.md`（比例线/对齐线）

### Deliverables

- `/content/characters/A/turnaround_3view.png`
- `/content/characters/A/detail_closeups.png`（鞋/背包/头部等）

### Constraints

- 轮廓、配色、饰品必须三视图闭合
- 不允许“正面有，背面没有”的细节缺失

### Acceptance Checklist

-  三视图比例线一致
-  关键配件位置一致
-  可用于动作帧（姿态参考清晰）

### Regenerate Tags

- `DETAIL_INCONSISTENT` `COLOR_SHIFT`

## 3.4 CHAR 实例 3：run 动作序列帧（单动作）+ pivot 不漂

**T-CHAR-0003_taskpack.md**

- Type:CHAR Level:L1
- Owner:L2_CHARACTER_LEAD Executor:L3_ANIM_FRAMES_ARTIST Reviewer:L2_TA_LEAD+L2_CHARACTER_LEAD
- Budget:1–2
- Deps:三视图 + anim spec

### Outcome

- 输出 run 序列帧（如 8–12 帧），pivot 规则一致，可循环不跳

### Allowed Inputs

- `/content/characters/A/turnaround_3view.png`
- `/docs/02_specs/characters/character_A_anim_spec.md`（run帧数/节奏/pivot）

### Deliverables

- `/content/characters/A/frames/run/`（帧文件）
- `/content/characters/A/frames/run/meta.json`（fps/pivot/顺序）

### Constraints

- 单动作帧数必须在 spec 范围内
- pivot（脚底/重心）不得漂移（允许≤2px抖动）
- 不合格直接重生成（不要手工挪帧）

### Acceptance Checklist

-  loop 无跳帧
-  pivot 稳定
-  帧尺寸一致且透明边界合理

### Regenerate Tags

- `PIVOT_DRIFT` `LOOP_JUMP` `FRAME_SIZE_INCONSISTENT`

------

------

# 4）文本/叙事（TEXT）工序卡模板族（结构→填充→标签→导入→校对）

## 4.1 模板族摘要

- **TEXT-STYLE（L2）**：写作规范、标签体系、变量表
- **TEXT-PACK（L1）**：对白包（单场景）
- **TEXT-TAG-INTEGRATE（L1）**：TextID/变量一致性/索引
- **TEXT-IMPORT（L1）**：导入运行与校验
- **TEXT-QA（L1）**：溢出/错别字/分支覆盖

## 4.2 TEXT 实例 1：ch01 写作规范+标签（短而硬）

**T-TEXT-0001_taskpack.md**

- Type:TEXT Level:L2
- Owner:L2_WRITING_LEAD Executor:L2_WRITING_LEAD_AGENT Reviewer:L1_DESIGN_DIRECTOR+L2_QA_LEAD
- Budget:2–4

### Outcome

- 输出可执行的写作规范与标签体系（供所有对白包使用）

### Allowed Inputs

- `/docs/01_bibles/design_bible.md`
- `/docs/02_specs/systems/narrative_system_spec.md`（如有）

### Deliverables

- `/content/text/style_guide.md`
- `/content/text/tags.md`
- `/content/text/variables.md`（最小变量：player_name等）

### Constraints

- style_guide ≤ 120 行
- 标签必须可枚举（不要散文式描述）

### Acceptance Checklist

-  标签可枚举
-  变量格式统一
-  可用于校验器（缺标签/变量未定义）

## 4.3 TEXT 实例 2：单对白包（1场景≤12轮）

**T-TEXT-0002_taskpack.md**

- Type:TEXT Level:L1
- Owner:L2_WRITING_LEAD Executor:L3_WRITER Reviewer:L2_WRITING_LEAD
- Budget:1–2

### Outcome

- 交付 S01-02 场景对白包（含 TextID/情绪标签/变量占位）

### Allowed Inputs

- `/content/chapters/ch01/chapter_pack.md`（S01-02条目）
- `/content/text/style_guide.md`
- `/content/text/tags.md`

### Deliverables

- `/content/text/ch01/S01-02_dialogue.md`（格式：TextID|角色|标签|文本）

### Constraints

- ≤12轮；单句≤60字
- 不新增设定/人物

### Acceptance Checklist

-  每句有 TextID
-  标签来自 tags.md
-  信息点节奏合理

## 4.4 TEXT 实例 3：TextID 索引与变量校验（1章）

**T-TEXT-0003_taskpack.md**

- Type:TEXT Level:L1
- Owner:L2_TOOLS_LEAD Executor:L3_TEXT_INTEGRATOR Reviewer:L2_WRITING_LEAD
- Budget:2–4

### Outcome

- 生成 ch01 的 text_index.json，并报告缺失标签/变量问题

### Allowed Inputs

- `/content/text/ch01/*.md`
- `/content/text/variables.md`
- `/content/text/tags.md`

### Deliverables

- `/content/text/ch01/text_index.json`
- `/docs/05_logs/text_audit_ch01.md`（问题清单）

### Constraints

- 只处理 ch01
- 不自动改文案，只报告问题（修复另开任务）

### Acceptance Checklist

-  index 可被程序加载
-  问题清单可复现定位到行

------

------

# 5）事件/脚本（EVENT）工序卡模板族（schema→事件→分支→校验→回归）

## 5.1 模板族摘要

- **EVENT-SCHEMA（L2）**：字段冻结+示例
- **EVENT-GEN（L1）**：单事件脚本
- **EVENT-BRANCH-AUDIT（L1）**：分支一致性审计
- **EVENT-VALIDATE（L1）**：schema/semantic 校验
- **EVENT-RUN-SMOKE（L1）**：事件链跑通

## 5.2 EVENT 实例 1：schema v1（字段≤20）+2示例

**T-EVENT-0001_taskpack.md**

- Type:EVENT Level:L2
- Owner:L2_EVENT_SCRIPTING_LEAD Executor:L2_EVENT_SCRIPTING_LEAD_AGENT Reviewer:L2_CLIENT_LEAD+L2_TOOLS_LEAD
- Budget:3–6

### Outcome

- 冻结 schema + 两个可跑示例（推进/选择分支）

### Allowed Inputs

- `/docs/01_bibles/tech_bible.md`
- `/docs/02_specs/systems/event_system_spec.md`

### Deliverables

- `/content/events/schema.md`
- `/content/events/examples/E0001.json`
- `/content/events/examples/E0002.json`

### Constraints

- 字段≤20；必须含 id/type/conditions/actions/next
- 禁止可执行代码字符串

### Acceptance Checklist

-  示例覆盖推进与选择
-  默认值/可选字段明确
-  可写校验器（无歧义）

## 5.3 EVENT 实例 2：生成 5 个事件（同一链条）

**T-EVENT-0002_taskpack.md**

- Type:EVENT Level:L1
- Owner:L2_EVENT_SCRIPTING_LEAD Executor:L3_SCRIPTER Reviewer:L2_EVENT_SCRIPTING_LEAD
- Budget:1–2

### Outcome

- 交付 E0101–E0105（同一章节链条）

### Allowed Inputs

- `/content/chapters/ch01/chapter_pack.md`（事件表）
- `/content/events/schema.md`

### Deliverables

- `/content/events/E0101.json` … `/content/events/E0105.json`

### Constraints

- 单事件≤120行
- 不得新增字段
- next 指向不存在必须标 TODO（不得编造）

### Acceptance Checklist

-  schema 合规
-  next/分支引用可追踪
-  条件可表达触发

## 5.4 EVENT 实例 3：分支一致性审计（关键选择点）

**T-EVENT-0003_taskpack.md**

- Type:EVENT Level:L1
- Owner:L2_NARRATIVE_LEAD Executor:L3_BRANCH_EDITOR Reviewer:L2_QA_LEAD+L2_EVENT_SCRIPTING_LEAD
- Budget:1–2

### Outcome

- 输出审计报告：选择点覆盖、软锁风险、回收点建议

### Allowed Inputs

- `/content/events/E0110.json`（关键选择事件）
- `/content/events/E0111.json`…（后续结果事件）
- `/docs/02_specs/systems/choice_system_spec.md`

### Deliverables

- `/docs/05_logs/branch_audit_ch01_choice1.md`

### Constraints

- 只审这一条分支链
- 只报告问题，不改脚本（修复另开任务）

### Acceptance Checklist

-  指出每个选项的后果链
-  标注软锁点与修复建议
-  指明缺失事件/缺失回收点

------

------

# 6）程序（CODE）工序卡模板族（PR级、单模块、可回滚）

## 6.1 模板族摘要

- **CODE-INTERFACE-STUB（L2）**：接口骨架+日志（先控边界）
- **CODE-IMPLEMENT（L2）**：实现单功能点
- **CODE-GUARD&ERROR（L1）**：错误处理/loop guard
- **CODE-INTEGRATE（L2）**：把内容系统接到UI
- **CODE-REFactor 禁止**：任何“顺手重构”都走 CR

## 6.2 CODE 实例 1：事件执行器最小实现（跑 E0001/E0002）

**T-CODE-0001_taskpack.md**

- Type:CODE Level:L2
- Owner:L2_CLIENT_LEAD Executor:L3_GAMEPLAY_ENGINEER Reviewer:L2_CLIENT_LEAD+L2_QA_LEAD
- Budget:4–7

### Outcome

- EventRunner 能加载 schema 示例并跑通，输出日志可定位

### Allowed Inputs

- `/content/events/schema.md`
- `/content/events/examples/E0001.json`
- `/content/events/examples/E0002.json`
- `/docs/01_bibles/tech_bible.md`

### Deliverables

- PR：只改 `/src/event/**`
- `/docs/04_acceptance/build_acceptance.md` 增加一条门禁（跑示例）

### Constraints

- PR ≤400净新增行、≤6文件、单模块
- 错误处理必须：缺字段/找不到next/循环

### Acceptance Checklist

-  E0001/E0002跑通
-  失败有清晰错误日志
-  loop guard 生效（访问计数上限）

## 6.3 CODE 实例 2：Choice 记录与读取（最小存档片段）

**T-CODE-0002_taskpack.md**

- Type:CODE Level:L2
- Owner:L2_CLIENT_LEAD Executor:L3_DATA_SAVE_ENGINEER Reviewer:L2_CLIENT_LEAD
- Budget:3–6

### Outcome

- 选择结果可记录并在下一事件读取（哪怕只是内存版）

### Allowed Inputs

- `/docs/02_specs/systems/choice_system_spec.md`
- `/docs/01_bibles/tech_bible.md`

### Deliverables

- PR：只改 `/src/choice/**` 或指定模块
- `/docs/02_specs/systems/choice_system_spec.md` 不得改（若要改走 CR）

### Constraints

- 单模块；不引入新依赖库（除非 tech_bible允许）
- 先内存版，持久化另开任务（避免大爆炸）

### Acceptance Checklist

-  写入/读取接口可用
-  有简单单元测试或日志验证

## 6.4 CODE 实例 3：UI 与事件 actions 的绑定（显示文本+选项）

**T-CODE-0003_taskpack.md**

- Type:CODE Level:L2
- Owner:L2_CLIENT_LEAD Executor:L3_UI_ENGINEER Reviewer:L2_UI_LEAD+L2_QA_LEAD
- Budget:3–6

### Outcome

- actions 中的 `show_text`/`show_choices` 能驱动 UI 状态变化

### Allowed Inputs

- `/docs/02_specs/ui/ui_flow_spec.md`
- `/docs/02_specs/systems/event_system_spec.md`
- `/content/events/examples/E0002.json`
- 现有 UI 功能版路径

### Deliverables

- PR：只改 `/src/ui/**` 和 `/src/event/**` 中与绑定相关的最小部分

### Constraints

- 禁止新增 action 类型（需要走 CR）
- 必须有日志：Action执行→UI状态变化

### Acceptance Checklist

-  示例事件触发 UI 正确显示
-  选择点击后回写 choice 并进入 next

------

------

# 7）工具/管线（TOOL）工序卡模板族（校验器/导入器/CI门禁）

## 7.1 模板族摘要

- **TOOL-VALIDATOR（L1）**：schema/命名/尺寸/引用完整性
- **TOOL-IMPORTER（L1）**：导入文本/事件/atlas
- **TOOL-CI-GATE（L2）**：把校验器接进 CI
- **TOOL-REPORT（L1）**：固定格式输出（便于机器读）

## 7.2 TOOL 实例 1：事件 schema 校验器

**T-TOOL-0001_taskpack.md**

- Type:TOOL Level:L1
- Owner:L2_TOOLS_LEAD Executor:L3_TOOLS_ENGINEER Reviewer:L2_TOOLS_LEAD
- Budget:1–2

### Outcome

- 一键校验 `/content/events/*.json` 是否符合 schema（输出固定格式）

### Allowed Inputs

- `/content/events/schema.md`
- `/content/events/`（目录）

### Deliverables

- `/tools/validate_events.py`
- `/tools/README.md` 增加使用说明

### Constraints

- 单职责（只校验不修复）
- 输出固定：JSON行 或 “file:reason”列表
- 无违规退出码0，有违规退出码1

### Acceptance Checklist

-  能定位到具体文件
-  输出稳定可被CI解析
-  运行<2秒（小项目）

## 7.3 TOOL 实例 2：TextID/标签校验器（缺失/重复/变量未定义）

**T-TOOL-0002_taskpack.md**

- Type:TOOL Level:L1
- Owner:L2_TOOLS_LEAD Executor:L3_TOOLS_ENGINEER Reviewer:L2_WRITING_LEAD
- Budget:1–2

### Outcome

- 校验 ch01 文本包：TextID 唯一、标签合法、变量已定义

### Allowed Inputs

- `/content/text/tags.md`
- `/content/text/variables.md`
- `/content/text/ch01/*.md`

### Deliverables

- `/tools/validate_text.py`
- `/docs/05_logs/text_validation_format.md`（说明输出字段）

### Constraints

- 不自动改文本，只报告问题
- 输出包含：文件、行号、问题类型

### Acceptance Checklist

-  报告可直接定位修复
-  输出稳定

## 7.4 TOOL 实例 3：CI 门禁（把两个校验器挂进 workflow）

**T-TOOL-0003_taskpack.md**

- Type:TOOL Level:L2
- Owner:L2_CLIENT_LEAD Executor:L3_BUILD_RELEASE_ENGINEER Reviewer:L2_TOOLS_LEAD+L2_QA_LEAD
- Budget:2–3

### Outcome

- PR/主干自动跑 validate_events + validate_text，失败阻断合并

### Allowed Inputs

- `.github/workflows/ci.yml`（现有）
- `/tools/validate_events.py`
- `/tools/validate_text.py`

### Deliverables

- 更新 `.github/workflows/ci.yml`
- 在 `/docs/04_acceptance/build_acceptance.md` 增加门禁条目

### Constraints

- 不引入复杂依赖（能用系统python就别加包）
- workflow 只加 1 个 job 或 1–2 steps（别搞大改）

### Acceptance Checklist

-  校验失败会让CI红
-  通过时CI绿并输出摘要

------

------

# 8）测试/QA 工序卡模板族（冒烟→缺陷→回归→里程碑验收）

## 8.1 模板族摘要

- **QA-SMOKE-CHECKLIST（L2）**：≤30条 checkbox
- **QA-SMOKE-RUN（L1）**：执行冒烟并产出报告
- **QA-BUG（L1）**：高质量缺陷单
- **QA-REGRESSION（L2/L1）**：回归清单与验证记录
- **QA-MILESTONE-ACCEPT（L2）**：里程碑验收单（制作人签字）

## 8.2 QA 实例 1：M1 冒烟清单（checkbox化）

**T-QA-0001_taskpack.md**

- Type:QA Level:L2
- Owner:L2_QA_LEAD Executor:L2_QA_LEAD_AGENT Reviewer:你（制作人）
- Budget:2–4

### Outcome

- M1 冒烟清单≤30条，覆盖主路径（启动→ch01→选择→结局→返回）

### Allowed Inputs

- `/docs/01_bibles/qa_bible.md`
- `/docs/02_specs/ui/ui_flow_spec.md`
- `/docs/02_specs/systems/event_system_spec.md`
- `/docs/04_acceptance/milestone_acceptance.md`（如有）

### Deliverables

- `/docs/04_acceptance/qa_checklists/smoke_m1.md`

### Constraints

- 每条必须含：步骤 + 期望结果（1句）
- 不写段落说明

### Acceptance Checklist

-  ≤30条
-  每条可截图证明
-  有失败分级（Blocker/Major/Minor）

## 8.3 QA 实例 2：执行冒烟并输出报告

**T-QA-0002_taskpack.md**

- Type:QA Level:L1
- Owner:L2_QA_LEAD Executor:L3_TESTER Reviewer:L2_QA_LEAD
- Budget:1–2

### Outcome

- 跑完 smoke_m1，输出通过率与失败条目，并创建缺陷单（如有）

### Allowed Inputs

- `/docs/04_acceptance/qa_checklists/smoke_m1.md`
- 最新 build 版本号（文本即可）
- 日志路径（如有）

### Deliverables

- `/docs/05_logs/smoke_report_m1.md`
- Bug Issues（如有）

### Constraints

- 不讨论需求，只记录事实
- 失败条目必须带截图/日志线索

### Acceptance Checklist

-  报告含通过率、失败列表、复现线索
-  缺陷单≤6步复现

## 8.4 QA 实例 3：缺陷单（事件选择后卡死）

**T-QA-0003_taskpack.md**

- Type:QA Level:L1
- Owner:L2_QA_LEAD Executor:L3_TESTER Reviewer:对应模块组长
- Budget:1–2

### Outcome

- 提交一条可复现、可定位的 BUG（含事件ID/日志片段）

### Allowed Inputs

- smoke_report_m1（如有）
- 运行日志（如有）

### Deliverables

- GitHub Bug Issue（用模板填满）

### Constraints

- 不推测原因
- 必须带：事件ID、期望/实际、日志或截图

### Acceptance Checklist

-  可复现
-  可定位到事件或模块

------

------

# 9）你要的“全工种补全”我怎么继续交付（更细、更全）

你刚才说：**“其他岗位工种都要细到这种程度，且补全所有产出与流转”**。要一次性写完会变成几百页规范，我建议按“生产线分段”继续生成，保证你能直接落地：

## 下一步我建议的两段（你回“继续”我就按顺序出）

### 第 1 段：**完整美术生产线补全**

- UI 美术（我们已做）
- 场景资产（tile/props/遮挡层/碰撞）
- 角色（我们已做但还缺：idle、turn、hit、表情、装备变体）
- 特效（交互反馈、叠加策略、性能预算）
- 输出：每条线再补 **“审查打分表（Review Rubric）+ 失败原因→重生成指令模板”**

### 第 2 段：**内容与系统生产线补全**

- 章节→事件→文本→导入→回归
- 事件动作集（actions）扩展流程（如何加新 action 走 CR）
- 存档/回滚/重试机制（降低玩家决策压力）
- 输出：把每条线的 Task Pack 再扩充到“可批量复制”的程度（每类再给 10 个实例）

你直接回一句：
**“继续：先补全美术生产线（场景/角色/特效），并给 Review Rubric + 失败原因模板”**
我就从这里接着往下把剩下的工种补齐到你要求的细度。



##### 你说：

继续



###### ChatGPT 说：



已思考 16s



好，我按你说的“**工厂工序卡**”方式，把**美术三条生产线（场景/角色/特效）补到能用有限上下文稳定派单**的细度，并且给你：

- **每条线的完整闭环工序**（功能版/灰盒→需求清单→生成→Review→标准化→集成→验收→迭代）
- **岗位流转（L1/L2/L3）** + **输入/输出工件** + **验收门禁**
- **Review Rubric 打分表**（可复制成 QA checkbox 或评分）
- **失败原因标签体系 + 重生成指令模板**（给文生图/图生图/参考图迭代用）

> 默认你是 UE（UMG + Paper2D/2D贴图资源），纯 AI + 脚本工具链（校验器/导入器/atlas）可用。

------

# 0）全美术通用：资产“入库门禁”与 Review Rubric（所有工种共用）

## 0.1 入库门禁（Gate-A / Gate-B / Gate-C）

**Gate-A（规格门禁）**：没有清单/规格，不允许生成资产

- 必须先有：`*_asset_requirements.md`（清单化：ID/用途/尺寸/锚点/状态/格式）

**Gate-B（规范门禁）**：资产不通过校验器，不允许进仓库主目录

- 命名、尺寸、透明边界、锚点(pivot)、九宫格、状态集齐全

**Gate-C（集成门禁）**：替换占位后必须跑冒烟

- UI：关键流程可点通
- 场景：路径可走通 + 触发点不偏移
- 角色：idle/run 不漂、不跳帧
- 特效：可读性达标、不遮挡关键信息、同屏预算不爆

------

## 0.2 Review Rubric（通用打分维度：每项 0–2 分）

你可以直接做成“打分表”，**≥12/16** 才入库，**<12** 必须重生成。

1. **一致性**：风格/线宽/材质语言符合 Art Bible
2. **可读性**：轮廓清晰、对比度足够、信息层级明确
3. **规格符合**：尺寸/锚点/状态/九宫格/透明边界合规
4. **可复用性**：能否复用到其他界面/场景（模块化）
5. **集成友好**：不会导致布局漂移/遮挡/拼接缝明显
6. **性能预算**：像素面积、帧数、透明叠加符合预算
7. **命名与元数据**：manifest/meta 完整且可被工具读取
8. **缺陷风险**：是否有明显生成瑕疵（手指/文字乱码/边缘噪点）

------

## 0.3 失败原因标签（通用）

- `STYLE_MISMATCH` 风格不一致
- `LOW_READABILITY` 可读性差/对比度不足
- `SPEC_VIOLATION` 尺寸/锚点/九宫格/状态不符合
- `EDGE_ARTIFACT` 边缘毛边/噪点/透明边界脏
- `TILING_SEAM` 平铺有接缝（场景）
- `PIVOT_DRIFT` 对齐点漂移（角色/动画）
- `ANIM_LOOP_JUMP` 循环跳帧（动画/特效）
- `OVER_DETAIL` 细节过密导致缩放后糊
- `TEXT_GARBLED` 任何文字乱码（UI图标含字）
- `PERF_OVERBUDGET` 帧数/分辨率/同屏过重

------

## 0.4 “重生成指令模板”（通用壳）

> 你每次重生成，不要写长篇解释，只填这张表，执行岗稳定很多。

**REGEN PACK**

- Target AssetID：`XXX_YYY`
- Fail Tags：`STYLE_MISMATCH, SPEC_VIOLATION`
- Keep（必须保留）：`颜色#、轮廓、比例、构图/形状语言`
- Fix（必须修正）：`尺寸、九宫格、边缘、对比度`
- Hard Specs：`W×H、pivot、slice、format、states`
- Reference：`上一版图（可选） + 风格参考（可选）`

------

# 1）场景/环境生产线（ENV）：灰盒→模块化套件→替换→回归

## 1.1 岗位流转（建议）

- **L1 美术总监**：风格/色板/透视/材质语言、禁区
- **L2 场景组长（ENV Lead）**：关卡需求→资产清单→派单→验收
- **L3 关卡灰盒**：可走通路径 + 触发点布局（不追求美）
- **L3 场景资产执行**：tile/props/前景遮挡/装饰套件生成
- **L2 TA/管线**：网格/尺寸/锚点/碰撞/atlas/校验器
- **QA**：路径/触发/遮挡/软锁回归

------

## 1.2 工件链条（ENV 必产出）

1. `/docs/02_specs/levels/level_spec_chXX.md`（区域、路径、关键事件点）
2. `/content/levels/chXX/interaction_points.csv`（触发点清单）
3. `CHXX_Blockout`（灰盒可跑通）
4. `/docs/02_specs/env/env_asset_requirements_chXX.md`（模块化资产需求清单）
5. `/content/env_tiles/chXX/` + `/content/env_props/chXX/`（资产包）
6. `/content/env_*/manifest.json`（元数据：尺寸/锚点/类别/碰撞策略）
7. 替换后关卡（美术版）
8. `/docs/05_logs/env_review_chXX.md`（审查记录）+ QA缺陷单

------

## 1.3 ENV 工序拆解（细到可派单）

### ENV-S1：灰盒关卡（功能版场景）

- **输入**：chapter_pack + level_spec（或先草案）
- **输出**：可走通灰盒 + `interaction_points.csv`
- **验收**：路径可通、触发点可触发、无软锁

> 关键：灰盒先行是为了让后续资产需求不靠想象，而靠截图/布局事实。

------

### ENV-S2：从灰盒回推“模块化资产需求清单”

把“我要一个树林”改成“我要 8 种地块 + 12 个道具 + 4 个遮挡前景”。

清单字段建议固定：

- `AssetID`（稳定）
- `Category`：tile / prop / fg / deco
- `UnitSize`：例如 64×64（tile）或 128×128（prop）
- `Anchor/Pivot`：底部中心/左下等
- `Collision`：none / bbox / custom（2D可先 bbox）
- `Layer`：bg/mid/fg
- `Tiling`：需要/不需要（tile 必须）
- `Variants`：1–3（别多）

**验收上限（防爆）**

- tile ≤ 12
- props ≤ 20
- fg遮挡 ≤ 8
  超过就说明关卡设计或美术风格不适合模块化，需要组长返工结构。

------

### ENV-S3：资产生成（tile 套件）

**tile 的稳定生成关键约束（写进 Task Pack）**

- 固定画布尺寸（如 64×64）
- 平铺无缝（tileable/seamless）
- 边缘不能有“半透明脏边”
- 同一套件色板一致（建议给 6–12 色的色板或参考图）

------

### ENV-S4：资产生成（props/前景遮挡）

props 的稳定生成关键约束：

- 统一透视（俯视/2.5D/正交）
- 锚点一致（底部接地）
- 透明边界干净
- 同类 props 变体 2–3 个足够

------

### ENV-S5：标准化入库（管线）

- 命名校验：`ENV_CH01_TILE_Grass_A.png` 这种模式固定
- manifest 必填：尺寸、锚点、层级、碰撞策略、用途
- atlas（可选）：按层级或按章节打包
- 导入 UE：统一贴图设置（过滤/压缩/像素风采样）

------

### ENV-S6：替换灰盒→美术版（集成）

- 替换时**不允许移动触发点**（除非走 CR）
- 替换后立刻跑：路径/遮挡/触发冒烟
- 出问题回流：
  - 资产问题→场景执行重生成
  - 清单规格问题→场景组长改 requirements
  - 关卡结构问题→灰盒组回退

------

## 1.4 ENV Review Rubric（场景专用项加分/扣分）

在通用 8 项基础上，ENV 额外看 6 项（每项 0–2）：

1. **平铺无缝**（tile seam 0容忍）
2. **层级清晰**（bg/mid/fg 不混）
3. **导航清晰**（玩家一眼看出可走区域）
4. **遮挡合理**（不挡关键交互UI/关键角色）
5. **模块化复用率**（一章能复用多少资产）
6. **密度控制**（不要细节堆满导致“糊”）

------

## 1.5 ENV 重生成指令模板（给 tile/props 两套）

**Tile REGEN（示例字段）**

- Keep：色板、纹理颗粒度、风格
- Fix：必须 seamless、边缘干净、对比度提升
- Hard Specs：64×64、tileable、无文字、无明显重复pattern

**Prop REGEN**

- Keep：轮廓/主题（路灯、箱子）
- Fix：底部接地锚点、透明边界、透视一致
- Hard Specs：128×128、pivot=bottom-center、无文字

------

# 2）角色生产线（CHAR）：原画→三视图→动作序列帧→入库→集成

## 2.1 岗位流转

- **L1 美术总监**：角色风格、比例禁区
- **L2 角色组长**：角色 spec、动作 spec、验收与回滚
- **L3 概念原画**：候选→选 master
- **L3 三视图**：正/侧/背 + 细节闭合
- **L3 动画帧执行**：按动作 spec 输出序列帧（单动作）
- **L2 TA/管线**：pivot/帧尺寸/atlas/meta 校验
- **L3 集成**：UE 中 Flipbook/动画资源接入
- **QA**：切换、循环、漂移、穿帮

------

## 2.2 角色必须产出的工件

1. `/docs/02_specs/characters/character_X_spec.md`（比例/配色/关键特征/禁区）
2. `concept_candidates/` + `concept_master.png`
3. `turnaround_3view.png` + `detail_closeups.png`
4. `character_X_anim_spec.md`（动作集、帧数、节奏、pivot规则）
5. `frames/<action>/` + `meta.json`（fps/pivot/顺序）
6. `atlas/<action>.png` + `atlas_meta.json`（如要打包）
7. UE 资源（Sprite/Flipbook/蓝图引用）
8. `/docs/05_logs/char_review_X.md`（审查记录）

------

## 2.3 CHAR 工序拆解（细）

### CHAR-S1：角色 spec（L2）

关键字段建议固定（越固定越稳）：

- `Silhouette keywords`（轮廓关键词：斗篷/短发/宽肩）
- `Proportion`（头身比、四肢比例）
- `Color palette`（主/辅/点缀）
- `Materials`（布/金属/皮革比例）
- `No-go list`（禁区）
- `Anim set for M1`：只做 `idle + run`（别贪）

------

### CHAR-S2：概念原画候选→选 master

- 候选 6 张足够
- 评审只做“选/不选”，不做“改一点点”
- 不满意就按失败标签重生成（不要陷入修修补补）

------

### CHAR-S3：三视图（闭合细节）

三视图验收点非常硬：

- 轮廓闭合（背面能解释正面所有装备）
- 配色闭合
- 关键小物件位置闭合（腰包/饰品）

------

### CHAR-S4：动作 spec（L2）

每个动作必须给：

- `FrameCountRange`（比如 8–12）
- `FPS`（比如 10 或 12）
- `Loop`：开始帧、结束帧
- `PivotRule`：脚底接地/重心点（明确到像素坐标规则）
- `Key poses`：用文字描述 3 个关键姿态（起步/腾空/落地）

> 这一步做不好，后面所有序列帧都会“漂、跳、抖”。

------

### CHAR-S5：单动作序列帧生成（L1）

强制限制：

- 只做一个动作（idle 或 run），不要一口气全动作
- 帧尺寸固定（例如 256×256）
- pivot 允许误差 ≤ 2px
- loop 必须无跳帧

------

### CHAR-S6：标准化（TA/管线）

- 校验：
  - 帧尺寸一致
  - pivot 一致
  - 透明边界干净
  - 命名规则：`CHAR_A_RUN_0001.png`
- 生成 `meta.json`（帧序/ fps / pivot）供导入脚本用

------

### CHAR-S7：UE 集成（可跑通）

- 生成 Sprite/Flipbook
- 接入角色蓝图（状态机：idle/run）
- QA：切换不卡顿、不抖、不漂

------

## 2.4 CHAR Review Rubric（角色专用）

通用 8 项基础上，角色额外 8 项：

1. **轮廓识别**（缩到 64px 仍能认出角色）
2. **比例一致**（三视图与动画一致）
3. **对齐稳定**（pivot 不漂）
4. **循环自然**（idle/run loop 不跳）
5. **动作节奏**（run 脚步节拍一致）
6. **细节不过载**（缩放后不糊成一团）
7. **可扩展性**（未来加动作/换装是否会崩）
8. **穿帮风险**（手脚错位、边缘断裂）

------

## 2.5 CHAR 重生成指令模板（分三段）

**Concept REGEN**

- Fix：轮廓更明确/比例统一/风格对齐
- Keep：主题、配色、关键道具

**3-View REGEN**

- Fix：背面细节补齐、配色一致、配件位置统一
- Keep：整体轮廓、服装结构

**Anim Frames REGEN**

- Fix：pivot漂移、loop跳帧、帧间形变过大
- Keep：关键姿态、节奏、帧数范围

------

# 3）特效生产线（VFX）：占位→规格→序列帧/参数→集成→预算回归

特效在叙事/交互类项目里最容易“做多了反而坏”，所以必须从“反馈价值”倒推。

## 3.1 岗位流转

- **L2 VFX 组长**：vfx spec（触发/时长/层级/预算）+ 派单验收
- **L3 VFX 执行**：序列帧特效（或 UI 动效）生成
- **L2 TA/管线**：帧数、透明叠加、atlas、命名、预算校验
- **L3 集成**：挂到事件 action 或 UI 状态变化
- **QA**：可读性/遮挡/同屏预算/连点压力测试

------

## 3.2 VFX 必产出工件

1. `/docs/02_specs/vfx/vfx_spec.md`（触发点→表现→时长→层级→预算）
2. `/content/vfx/<effect_id>/frames/` + `meta.json`（fps、loop）
3. `vfx_manifest.json`（用途、层级、最大同屏数）
4. UE 集成（材质/Flipbook/Widget动画或 Niagara(如用)）
5. `/docs/05_logs/vfx_review.md`

------

## 3.3 VFX 工序拆解（细）

### VFX-S1：先占位（功能版反馈）

- 不先做漂亮特效，先用：闪烁/变亮/缩放 占位验证“节奏是否必要”
- 通过后才允许进入资产生成

### VFX-S2：写 vfx spec（L2）

每个特效必须有：

- `Trigger`：何时触发（点击/选择确认/进入新事件）
- `Duration`：总时长（ms）
- `Layer`：UI前/后、世界前/后
- `MaxInstancesOnScreen`：同屏上限
- `Budget`：帧数上限、分辨率上限
- `ReadabilityGoal`：让玩家“看到什么变化”

### VFX-S3：生成序列帧（L1）

强制限制：

- 单特效帧数：8–16（M1建议 8–12）
- 分辨率固定（例如 256×256 或更小）
- 透明叠加不要过度（避免“糊”）

### VFX-S4：标准化与集成

- atlas/meta/manifest 完整
- 挂载到事件 action：`play_vfx(effect_id)`
- QA：连点、叠加、遮挡、同屏上限

------

## 3.4 VFX Review Rubric（特效专用）

通用 8 项基础上，VFX 额外 6 项：

1. **反馈价值**：是否真的提升操作反馈（不然删）
2. **节奏匹配**：时长是否过长/过短
3. **遮挡控制**：不遮挡选项/关键文本
4. **叠加可控**：同屏多次触发仍可读
5. **性能预算**：帧数/尺寸/同屏数符合 spec
6. **视觉噪声**：不闪瞎、不花屏、不脏

------

## 3.5 VFX 重生成指令模板（两类）

**UI Feedback VFX REGEN**

- Fix：对比度、时长、不要遮挡文字、减少噪点
- Hard：8–12帧、透明干净、中心对齐

**World/Scene VFX REGEN**

- Fix：和场景色板融合、别抢主体、叠加不糊
- Hard：同屏上限、分辨率、帧数

------

# 4）把三条美术线“串成可跑的闭环”（你要的组织化流转）

你描述的 UI 流程，现在可以抽象为**同一个派单套路**：

1. L2 组长出 **Spec**（结构/状态/需求清单）
2. L3 先出 **功能版/灰盒/占位**（可跑通）
3. L2 回推出 **Asset Requirements**（清单化可校验）
4. L3 按清单生成资产（候选→筛选）
5. L2 管线标准化入库（校验器+manifest）
6. L3 集成替换
7. QA 验收 + 缺陷闭环
8. 迭代：只允许改 Requirements 或重生成资产，不允许执行岗“自由发挥”

这套对“有限上下文”极友好，因为执行岗永远只拿到一张清单和一个输出目录。

------

# 5）下一步你还缺的“更具体”：我建议直接补两套东西

你刚刚说“还有些流程不够细”，最有效的补法不是继续写长文，而是：

## 5.1 给你“Review Rubric → 缺陷单模板”联动

- 缺陷单里直接引用 Rubric 项：哪一项 0 分，为什么
- 这样返工不再靠主观吵架

## 5.2 把 ENV/CHAR/VFX 各自再补成“10 个可复制实例任务包”

例如：

- ENV：tile套件、props套件、遮挡前景、地形过渡、门/入口
- CHAR：idle、run、turn、hit、emote、表情层
- VFX：点击反馈、选择确认、章节转场、提示出现/消失、错误提示

你回一句：
**“继续：把 ENV/CHAR/VFX 各补 10 个可复制 Task Pack 实例 + 缺陷单模板联动”**
我就按你《备注》的风格约束，把这些实例全部写成可直接入库派单的文件正文。



##### 你说：

继续



###### ChatGPT 说：

好，我继续把你要的“**可复制派单的工序卡实例**”补齐：

- **ENV/CHAR/VFX 各 10 个 Task Pack 实例**（共 30 个），全部按“有限上下文稳定输出”的粒度写。
- 再给你一套**“Review Rubric → 缺陷单模板联动”**：缺陷单里直接绑定评分与失败标签，自动导向重生成（REGEN PACK），避免主观扯皮。

> 说明：下面每个 Task Pack 我都写成**你可以直接保存为文件**（放到 `/docs/03_taskpacks/`），Issue 里只要贴路径就能派单。

------

# 0）美术缺陷单模板联动（Rubric → Bug → REGEN）

## 0.1 美术缺陷单模板（ART-BUG）

你可以放到 `.github/ISSUE_TEMPLATE/art_bug.yml`（或手工用同格式写 Issue）。

**标题规范**：`[ART][<Type>][<AssetID>] <简短问题>`
例如：`[ART][UI][Button_Primary] 三态对比不足且命名不合规`

**内容字段（强制）**

- 资产类型：UI / ENV / CHAR / VFX
- AssetID 列表：`AssetID1, AssetID2`
- 版本：manifest 版本号/commit
- 位置：路径（必须）
- 影响：阻塞 / 严重 / 一般

### Rubric 评分（每项 0–2）

> 低于阈值（建议：总分 < 12/16 或 < 18/28）必须重生成。

- 一致性（0-2）：
- 可读性（0-2）：
- 规格符合（0-2）：
- 可复用性（0-2）：
- 集成友好（0-2）：
- 性能预算（0-2）：
- 命名与元数据（0-2）：
- 缺陷风险（0-2）：

（ENV/CHAR/VFX 有额外项时，在下方补充）

### 失败标签（Fail Tags）

从固定集合选：`STYLE_MISMATCH / SPEC_VIOLATION / EDGE_ARTIFACT / TILING_SEAM / PIVOT_DRIFT / ANIM_LOOP_JUMP / PERF_OVERBUDGET / LOW_READABILITY / TEXT_GARBLED ...`

### 事实描述（不推测原因）

- 期望：
- 实际：
- 复现/观测方式：截图/视频/UE内步骤（≤6步）

### REGEN PACK（直接可用于重生成）

- Target AssetID：
- Fail Tags：
- Keep（必须保留）：
- Fix（必须修正）：
- Hard Specs（W×H / pivot / slice / fps / states / layer）：
- Reference（上一版图/风格参考图路径）：

### 分派建议

- 若 Fail Tag 属于 `SPEC_VIOLATION/NAMING_FAIL` → 工具/管线组长
- 若 `STYLE_MISMATCH/LOW_READABILITY` → 美术执行岗
- 若 `PIVOT_DRIFT/ANIM_LOOP_JUMP` → 动画帧执行岗 + TA
- 若集成偏移/遮挡 → 集成岗（UI程序/关卡整合）

------

# 1）ENV：场景/环境 Task Pack 实例 ×10

> 默认你已有：`env_asset_requirements_ch01.md` 或至少有 `level_spec_ch01.md + blockout截图`
> 若还没有，先派 `T-ENV-0101`、`T-ENV-0102` 这类“规格/清单”任务。

------

### T-ENV-0101（L2）CH01 灰盒→资产清单（模块化套件）

**Owner**：L2_ENV_ART_LEAD
**Executor**：L2_ENV_ART_LEAD_AGENT
**Reviewer**：L1_ART_DIRECTOR + L2_TOOLS_LEAD
**Budget**：3–5
**Allowed Inputs**：

- `/src/levels/CH01_Blockout.*` 截图（≤2张）
- `/docs/02_specs/levels/level_spec_ch01.md`
- `/docs/01_bibles/art_bible.md`
  **Deliverables**：
- `/docs/02_specs/env/env_asset_requirements_ch01.md`
  **Constraints**：tile≤12 props≤20 fg≤8（超出必须合并归类）
  **Acceptance**：清单字段齐全（AssetID/Category/UnitSize/Anchor/Collision/Layer/Tiling/Variants）

------

### T-ENV-0102（L1）CH01 Tile 套件：基础地块 8 件

**Owner**：L2_ENV_ART_LEAD
**Executor**：L3_ENV_ARTIST
**Reviewer**：L2_TOOLS_LEAD
**Budget**：1–2
**Inputs**：`env_asset_requirements_ch01.md`（只取 tile 8 项）+ `art_bible.md`
**Deliverables**：`/content/env_tiles/ch01/`（8张）+ `manifest.json`
**Hard Specs**：64×64（或清单指定）、tileable、无缝、透明边干净
**Acceptance**：无 seam；尺寸一致；命名合规；manifest 填齐

------

### T-ENV-0103（L1）Tile 过渡块：草→土→石 6 件

同上，但 **Deliverables**：`/content/env_tiles/ch01/transitions/`
**Constraints**：每类过渡 2 件、图案不要明显重复
**Fail Tags**：`TILING_SEAM / OVER_DETAIL`

------

### T-ENV-0104（L1）Props 套件：可复用道具 12 件

**Owner**：L2_ENV_ART_LEAD
**Executor**：L3_ENV_ARTIST
**Reviewer**：L2_ENV_ART_LEAD
**Inputs**：清单 props 12 项 + art bible
**Deliverables**：`/content/env_props/ch01/`（12张）+ manifest
**Hard Specs**：128×128（或清单）、pivot=bottom-center、透视一致
**Acceptance**：接地稳定；边缘无脏；同套件色板一致

------

### T-ENV-0105（L1）前景遮挡（FG Occluders）6 件

**Purpose**：树叶/栏杆/雾层等遮挡，提升空间感
**Constraints**：不能遮住交互UI/关键触发点
**Deliverables**：`/content/env_fg/ch01/` + manifest（layer=fg）

------

### T-ENV-0106（L1）装饰贴花/细节（Decals）10 件（低密度）

**Purpose**：用 decal 丰富但不抢主体
**Hard Specs**：32×32 或 64×64；透明边必须干净
**Acceptance**：缩放后仍清晰、不糊

------

### T-ENV-0107（L2）关卡美术替换：Blockout→Art Pass（不动触发点）

**Owner**：L2_LEVEL_LEAD
**Executor**：L3_LEVEL_INTEGRATOR
**Reviewer**：L2_QA_LEAD
**Budget**：3–6
**Inputs**：Blockout 地图 + interaction_points.csv + 已入库 tiles/props/fg
**Deliverables**：`/src/levels/CH01_Art.umap`（或覆盖同图层）
**Constraints**：禁止移动触发点（否则走 CR）
**Acceptance**：路径可走通；触发点仍对齐；遮挡不挡关键交互

------

### T-ENV-0108（L1）碰撞/遮挡校验报告（语义级）

**Owner**：L2_TOOLS_LEAD
**Executor**：L3_TOOLS_ENGINEER
**Reviewer**：L2_LEVEL_LEAD
**Budget**：1–2
**Inputs**：manifest + 关卡资源引用列表（如有）
**Deliverables**：`/docs/05_logs/env_collision_audit_ch01.md`
**Goal**：报告哪些 props 未声明 collision 策略、哪些 fg layer 缺失

------

### T-ENV-0109（L1）Atlas 打包（按 layer 分）

**Owner**：L2_TOOLS_LEAD
**Executor**：L3_TOOLS_ENGINEER
**Reviewer**：L2_ENV_ART_LEAD
**Deliverables**：`/content/env_atlas/ch01/atlas_bg.png` 等 + `atlas_meta.json`
**Constraints**：只打包 ch01；输出固定格式（便于 UE 导入）

------

### T-ENV-0110（L1）ENV 冒烟回归：软锁/遮挡/触发覆盖

**Owner**：L2_QA_LEAD
**Executor**：L3_TESTER
**Reviewer**：L2_LEVEL_LEAD
**Deliverables**：`/docs/05_logs/env_smoke_ch01.md` + Bug issues
**Checklist**：入口→出口路径；关键触发点≥5；无必现穿模；遮挡不挡关键文本

------

# 2）CHAR：角色 Task Pack 实例 ×10

> M1 建议只做 1 个主角：`idle + run` 两个动作先跑通。其它动作按迭代加。

------

### T-CHAR-0201（L2）角色规格（Character Spec）冻结

**Owner**：L2_CHARACTER_LEAD
**Executor**：L2_CHARACTER_LEAD_AGENT
**Reviewer**：L1_ART_DIRECTOR
**Budget**：2–4
**Deliverables**：`/docs/02_specs/characters/character_A_spec.md`
**Hard Specs**：头身比、色板（6–12色）、禁区、M1动作集（idle/run）

------

### T-CHAR-0202（L1）原画候选 6 张 + 选择理由

（同前面概念任务，略）
**Deliverables**：`concept_candidates/*` + `concept_select_notes.md`

------

### T-CHAR-0203（L1）选定 master 并标准化存放

**Owner**：L2_CHARACTER_LEAD
**Executor**：L3_CONCEPT_ARTIST
**Reviewer**：L1_ART_DIRECTOR
**Deliverables**：`/content/characters/A/concept_master.png`
**Constraints**：只提交 1 张 master，不夹带别的

------

### T-CHAR-0204（L1）三视图 + 细节闭合

**Deliverables**：`turnaround_3view.png` + `detail_closeups.png`
**Acceptance**：背面细节闭合、配色一致、配件位置一致

------

### T-CHAR-0205（L2）动作规格：idle/run（帧数/节奏/pivot）

**Owner**：L2_CHARACTER_LEAD
**Executor**：L2_CHARACTER_LEAD_AGENT
**Reviewer**：L2_TA_LEAD + L2_CLIENT_LEAD
**Budget**：2–4
**Deliverables**：`/docs/02_specs/characters/character_A_anim_spec.md`
**Hard Specs**：

- idle：帧数 6–10，fps 8–12，loop 无跳
- run：帧数 8–12，fps 10–12
- pivot：脚底接地（误差≤2px）

------

### T-CHAR-0206（L1）idle 序列帧（单动作）

**Owner**：L2_CHARACTER_LEAD
**Executor**：L3_ANIM_FRAMES_ARTIST
**Reviewer**：L2_TA_LEAD
**Budget**：1–2
**Deliverables**：`/content/characters/A/frames/idle/*` + `meta.json`
**Acceptance**：loop 无跳；pivot 不漂；帧尺寸一致

------

### T-CHAR-0207（L1）run 序列帧（单动作）

同上，但目录 `frames/run/`
**Extra Acceptance**：脚步节奏一致、前后摆臂不会穿帮

------

### T-CHAR-0208（L1）Atlas+Meta 生成（idle/run）

**Owner**：L2_TA_LEAD
**Executor**：L3_TOOLS_ENGINEER
**Reviewer**：L2_CHARACTER_LEAD
**Budget**：1–2
**Inputs**：frames/idle、frames/run、anim_spec
**Deliverables**：`/content/characters/A/atlas/idle.png`、`run.png` + `atlas_meta.json`
**Constraints**：只处理 A 角色；输出格式固定（frame rect + pivot + fps）

------

### T-CHAR-0209（L2）UE 集成：Flipbook/状态切换（idle↔run）

**Owner**：L2_CLIENT_LEAD
**Executor**：L3_GAMEPLAY_ENGINEER（或专门集成岗）
**Reviewer**：L2_QA_LEAD
**Budget**：3–6
**Deliverables**：UE 内资源与蓝图引用（路径清晰）+ `/docs/05_logs/char_integrate_A.md`
**Acceptance**：移动时 run，静止 idle，切换不抖不漂

------

### T-CHAR-0210（L1）角色动画 QA 回归（漂移/loop/穿帮）

**Owner**：L2_QA_LEAD
**Executor**：L3_TESTER
**Deliverables**：`/docs/05_logs/char_smoke_A.md` + Bug
**Checklist**：pivot漂移；loop跳帧；脚底滑动；边缘断裂；缩放后糊

------

# 3）VFX：特效 Task Pack 实例 ×10

> 原则：先占位验证“反馈价值”，再生成资产。M1 只做 UI 反馈类 5–8 个足够。

------

### T-VFX-0301（L2）VFX 规格：M1 UI反馈清单（触发/时长/层级/预算）

**Owner**：L2_VFX_LEAD
**Executor**：L2_VFX_LEAD_AGENT
**Reviewer**：L2_UI_LEAD + L2_QA_LEAD
**Budget**：2–4
**Deliverables**：`/docs/02_specs/vfx/vfx_spec_m1.md`
**Constraints**：每个特效必须有 MaxInstances、Duration、Layer、FrameBudget

------

### T-VFX-0302（L1）点击反馈特效（8–12帧）

**Owner**：L2_VFX_LEAD
**Executor**：L3_VFX_ARTIST
**Reviewer**：L2_UI_LEAD
**Budget**：1–2
**Inputs**：vfx_spec_m1 + art_bible
**Deliverables**：`/content/vfx/UI_ClickConfirm/frames/*` + `meta.json`
**Hard Specs**：256×256；8–12帧；fps=12；中心对齐；不遮挡文字
**Acceptance**：对比度足；无噪点；叠加两次不糊

------

### T-VFX-0303（L1）选项高亮（hover/selected）轻量特效（6–10帧或2帧循环）

**Deliverables**：`/content/vfx/UI_ChoiceHighlight/*`
**Constraints**：必须低噪、时长短、不能抢阅读焦点
**Fail Tags**：`LOW_READABILITY / PERF_OVERBUDGET`

------

### T-VFX-0304（L1）选择确认特效（与点击不同：更明确）

**Goal**：玩家明确知道“选定已生效”
**Acceptance**：不遮挡选项文本；1秒内结束

------

### T-VFX-0305（L1）章节转场（过渡遮罩/淡入淡出）

**Hard Specs**：时长 600–1200ms；layer=top-ui；帧数≤16
**Acceptance**：不闪烁、不脏边、不会让文本残影

------

### T-VFX-0306（L1）提示出现/消失（toast/tooltip）

**Goal**：信息提示，避免打断
**Acceptance**：动效幅度小；出现/消失清晰；多次触发不叠一团

------

### T-VFX-0307（L1）加载指示器（循环，8–12帧）

**Constraints**：必须无跳帧；循环平滑；fps固定
**Fail Tags**：`ANIM_LOOP_JUMP`

------

### T-VFX-0308（L1）错误提示（轻微震动/闪红）资产

**Goal**：明确但不刺眼
**Constraints**：不使用大面积高亮红白闪（用户体验禁区）

------

### T-VFX-0309（L1）VFX 入库标准化（atlas + manifest）

**Owner**：L2_TA_LEAD
**Executor**：L3_TOOLS_ENGINEER
**Reviewer**：L2_VFX_LEAD
**Deliverables**：`/content/vfx/manifest.json` + atlas/meta
**Constraints**：输出必须包含：effect_id、duration、fps、max_instances、layer

------

### T-VFX-0310（L2）UE 集成：把 5 个 VFX 挂到 UI/事件 actions

**Owner**：L2_CLIENT_LEAD
**Executor**：L3_UI_ENGINEER（或 gameplay）
**Reviewer**：L2_QA_LEAD
**Budget**：3–6
**Deliverables**：实现 `play_vfx(effect_id)`（或绑定方式）+ `/docs/05_logs/vfx_integration_m1.md`
**Acceptance**：触发条件正确；叠加可控；同屏上限生效

------

# 4）把“实例任务包”真正跑起来的建议（关键但很短）

你现在最容易踩的坑是：**任务包太大、执行岗自由发挥、返工用嘴改**。所以建议你强制三条纪律：

1. **任何重生成必须带 Fail Tags + REGEN PACK**（不带就退回不受理）
2. **每个资源只对一个 AssetID 负责**（别混交付）
3. **每个工种先做“占位/灰盒/功能版”再做美术**（否则需求会不断漂）

------

如果你还要把“所有产出按岗位完整补全”，下一步就轮到**“程序/内容/工具/QA”**四条生产线做同等级细化：

- 事件 actions 的扩展与 CR 流程（如何加新 action，如何兼容旧脚本）
- 存档/回滚/重试（降低决策压力）
- 自动化回归（事件链跑通、文本校验、资源校验都进 CI）
- QA 的里程碑验收门禁（Checklist+打分）

你直接回一句“继续”，我就按同样方式给 **CODE/TOOL/EVENT/TEXT/QA** 的模板族 + 每类 10 个实例任务包。



##### 你说：

继续



###### ChatGPT 说：



已思考 7s



继续。下面我把 **CODE / TOOL / EVENT / TEXT / QA** 这五条“生产线”补到和你前面 UI/ENV/CHAR/VFX **同一级别的工序卡粒度**：

- 每条线：**模板族（工序拆分）**
- 每条线：**10 个可复制 Task Pack 实例**（文件级、有限上下文稳定）
- 重点补齐你点名的：**actions 扩展（CR）**、**存档/回滚/重试**、**自动化回归进 CI**、**QA 里程碑门禁**

> 你直接把下面的 Task Pack 复制成文件，放 `/docs/03_taskpacks/`，Issue 里只贴路径就能派单。

------

# 0）全链路通用约束（再强调一次，保证可控）

- **执行岗只读 Allowed Inputs**，只写 Deliverables 指定路径
- **单 PR 粒度**：≤400 行净新增、≤6 文件、单模块
- **单脚本/配置**：单文件 ≤120 行（或按 schema 限制）
- **任何新增 action / schema 字段 / 系统边界变更**：必须走 **CR**（否则回滚）

------

# 1）CODE 生产线（程序实现：接口→最小实现→门禁→集成→回归）

## 1.1 CODE 模板族（建议拆分方式）

- **CODE-INTERFACE-STUB（L2）**：接口骨架+日志，先定边界
- **CODE-IMPLEMENT（L2）**：实现单功能点（PR级）
- **CODE-GUARD（L1）**：错误处理/循环保护/边界值
- **CODE-INTEGRATE（L2）**：把内容系统接 UI/存档
- **CODE-TEST-HOOK（L1/L2）**：冒烟脚本/断言点/日志规范
- **CODE-CR-IMPACT（L2）**：当 CR 批准后，落地兼容实现

下面 10 个实例（你按栈把 `.cpp/.ts/.cs` 替换即可）。

------

## 1.2 CODE Task Packs ×10

### T-CODE-1001（L2）事件执行器接口骨架 + 日志规范

- Owner: L2_CLIENT_LEAD | Exec: L3_GAMEPLAY_ENGINEER | Review: L2_CLIENT_LEAD | Budget: 3–5
- Inputs: `/docs/02_specs/systems/event_system_spec.md`, `/content/events/schema.md`, `/docs/01_bibles/tech_bible.md`
- Deliverables: PR（仅 `/src/event/**`）+ `/docs/05_logs/event_logging_spec.md`
- Constraints: 不实现完整逻辑，只建接口+日志；单模块
- Acceptance:
  -  有 EventLoader/EventRunner 接口与最小日志 `EVT:` 前缀
  -  缺字段/找不到next有错误码与日志格式

### T-CODE-1002（L2）EventRunner 最小实现：跑通 E0001/E0002

- Owner L2_CLIENT_LEAD | Exec L3_GAMEPLAY_ENGINEER | Review L2_QA_LEAD | Budget 4–7
- Inputs: schema + `/content/events/examples/E0001.json,E0002.json`
- Deliverables: PR（`/src/event/**`）+ 更新 `/docs/04_acceptance/build_acceptance.md` 增门禁
- Acceptance:
  -  两个示例可跑通（日志可追踪每一步 action/next）
  -  循环保护：访问计数>50 终止

### T-CODE-1003（L1）条件解析器（conditions）边界与错误处理

- Owner L2_CLIENT_LEAD | Exec L3_GAMEPLAY_ENGINEER | Review L2_CLIENT_LEAD | Budget 1–2
- Inputs: `event_system_spec.md`（conditions语义段落）
- Deliverables: PR（`/src/event/conditions/**`）
- Constraints: 只实现 3–5 种条件（spec列出的最小集）
- Acceptance:
  -  未知条件类型可报错定位
  -  条件短路逻辑一致

### T-CODE-1004（L2）Choice 记录（内存版）+ 读写接口

- Owner L2_CLIENT_LEAD | Exec L3_DATA_SAVE_ENGINEER | Review L2_QA_LEAD | Budget 3–6
- Inputs: `/docs/02_specs/systems/choice_system_spec.md`
- Deliverables: PR（仅 `/src/choice/**`）
- Constraints: 先内存版，持久化另开任务
- Acceptance:
  -  写入/读取可被事件 action 调用
  -  日志 `CHOICE_SET/GET` 可定位

### T-CODE-1005（L2）存档 v1（仅 choice + 章节进度）

- Owner L2_CLIENT_LEAD | Exec L3_DATA_SAVE_ENGINEER | Review L2_CLIENT_LEAD | Budget 3–6
- Inputs: `choice_system_spec` + `narrative_system_spec`（最小进度字段）
- Deliverables: PR（仅 `/src/save/**`）+ `/docs/02_specs/systems/save_format_v1.md`
- Constraints: 只存 2 类数据；包含版本号 `save_version`
- Acceptance:
  -  新建/读取存档可复现
  -  版本号不匹配有清晰报错

### T-CODE-1006（L2）重试/回滚机制（降低决策负担）

- Owner L2_SYSTEMS_LEAD | Exec L3_GAMEPLAY_ENGINEER | Review L2_QA_LEAD | Budget 3–6
- Inputs: `choice_system_spec`（回滚策略段落）或 design bible（玩家负担原则）
- Deliverables: PR（单模块）+ `/docs/02_specs/systems/retry_policy.md`
- Constraints: M1只做一种：`章节内回滚到最近选择点`
- Acceptance:
  -  回滚后 choice 恢复正确
  -  UI 状态与事件指针一致

### T-CODE-1007（L2）actions→UI 绑定（show_text/show_choices）

- Owner L2_CLIENT_LEAD | Exec L3_UI_ENGINEER | Review L2_UI_LEAD | Budget 3–6
- Inputs: `ui_flow_spec` + `event_schema`（actions字段）
- Deliverables: PR（`/src/ui/**` + `/src/event/**`最小部分）
- Constraints: 禁止新增 action 类型；必须日志映射
- Acceptance:
  -  action 执行→UI状态变化可追踪
  -  选择点击→写入 choice→进入 next

### T-CODE-1008（L1）UI 文本溢出/自动换行/滚动策略

- Owner L2_UI_LEAD | Exec L3_UI_ENGINEER | Review L2_QA_LEAD | Budget 1–2
- Inputs: `ui_components_spec`（文本容器规则）
- Deliverables: PR（`/src/ui/**`）+ `/docs/04_acceptance/ui_text_rules.md`
- Acceptance:
  -  长文本不溢出破布局
  -  历史记录可滚动（若spec要求）

### T-CODE-1009（L2）章节入口/退出：chapter_start/chapter_end

- Owner L2_CLIENT_LEAD | Exec L3_GAMEPLAY_ENGINEER | Review L2_QA_LEAD | Budget 2–4
- Inputs: `narrative_system_spec` + chapter_pack（ch01）
- Deliverables: PR（`/src/narrative/**`）
- Acceptance:
  -  新游戏进入 ch01 起点事件
  -  章节结束回主菜单或进入下一章（按spec）

### T-CODE-1010（L2）冒烟自动化 Hook：一键跑通主路径

- Owner L2_QA_LEAD | Exec L3_AUTOMATION_ENGINEER | Review L2_CLIENT_LEAD | Budget 2–4
- Inputs: `smoke_m1.md`, `build_acceptance.md`
- Deliverables: `/tools/run_smoke_m1.*` + CI step（或记录如何手动跑）
- Acceptance:
  -  输出固定格式报告（pass/fail + 失败点日志）
  -  可在 CI/本地复现

------

# 2）TOOL 生产线（校验器/导入器/门禁：把质量变“可执行”）

## 2.1 TOOL 模板族

- **TOOL-VALIDATE-SCHEMA（L1）**：schema 合规
- **TOOL-VALIDATE-SEMANTIC（L1）**：引用完整性/循环/缺失
- **TOOL-IMPORT（L1）**：导入文本/事件/atlas，固定输出
- **TOOL-MANIFEST（L1）**：生成 manifest/meta
- **TOOL-CI-GATE（L2）**：把校验挂 CI，失败阻断
- **TOOL-REPORT（L1）**：统一报告格式（供 PMO/QA）

------

## 2.2 TOOL Task Packs ×10

### T-TOOL-2001（L1）事件 schema 校验器

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_EVENT_SCRIPTING_LEAD | Budget 1–2
- Inputs: `/content/events/schema.md`, `/content/events/*.json`
- Deliverables: `/tools/validate_events_schema.py`
- Acceptance: 固定输出（file,line,reason）；exit code 0/1

### T-TOOL-2002（L1）事件语义校验：next 引用存在、循环检测、缺失TODO

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_CLIENT_LEAD | Budget 1–2
- Inputs: events目录 + schema
- Deliverables: `/tools/validate_events_semantic.py` + `/docs/05_logs/events_semantic_format.md`
- Acceptance:
  -  next 缺失能定位
  -  循环链能输出链路

### T-TOOL-2003（L1）文本校验：TextID唯一/标签合法/变量定义

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_WRITING_LEAD | Budget 1–2
- Inputs: `/content/text/tags.md`, `variables.md`, `ch01/*.md`
- Deliverables: `/tools/validate_text.py`
- Acceptance: 报告含文件+行号+问题类型

### T-TOOL-2004（L1）文本索引生成器：text_index.json（按章）

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_CLIENT_LEAD | Budget 1–2
- Inputs: ch01文本包
- Deliverables: `/tools/build_text_index.py` + 生成 `/content/text/ch01/text_index.json`
- Acceptance: index 可被程序加载（格式固定）

### T-TOOL-2005（L1）UI 资产校验器（命名/尺寸/状态集）

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_UI_LEAD | Budget 1–2
- Inputs: `/docs/02_specs/ui/ui_asset_requirements.md`, `/content/ui_assets/**`
- Deliverables: `/tools/validate_ui_assets.py`
- Acceptance: 按 AssetID 对照 requirements，缺失/多余/尺寸不符报告

### T-TOOL-2006（L1）ENV 资产校验器（tile尺寸一致/manifest字段齐全）

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_ENV_ART_LEAD | Budget 1–2
- Inputs: env_tiles/env_props + manifest
- Deliverables: `/tools/validate_env_assets.py`

### T-TOOL-2007（L1）角色帧校验器（尺寸一致/pivot漂移检测）

- Owner L2_TA_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_CHARACTER_LEAD | Budget 1–2
- Inputs: `frames/<action>/*` + `meta.json`
- Deliverables: `/tools/validate_char_frames.py`
- Acceptance: pivot 漂移>2px 报告；帧尺寸不一致报告

### T-TOOL-2008（L1）Atlas 打包器（输入帧→atlas+atlas_meta）

- Owner L2_TA_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_CLIENT_LEAD | Budget 2–4
- Inputs: frames目录
- Deliverables: `/tools/build_atlas.py` + 输出 atlas+meta
- Constraints: 单职责；输出固定 JSON schema

### T-TOOL-2009（L2）CI 门禁：挂 validate_* 与 build_text_index

- Owner L2_CLIENT_LEAD | Exec L3_BUILD_RELEASE_ENGINEER | Review L2_QA_LEAD | Budget 2–3
- Inputs: workflow + tools脚本
- Deliverables: `.github/workflows/ci.yml` 更新 + build_acceptance 增条
- Acceptance: 校验失败阻断合并；输出摘要可读

### T-TOOL-2010（L1）统一报告汇总器（PMO 周报输入）

- Owner L1_PMO | Exec L3_TOOLS_ENGINEER | Review L2_QA_LEAD | Budget 1–2
- Inputs: validators 输出
- Deliverables: `/tools/summarize_quality.py` + `/docs/05_logs/quality_daily.md` 格式
- Acceptance: 固定字段（date, pass_rate, top_fail_tags, blocking_items）

------

# 3）EVENT 生产线（schema→事件链→分支→校验→可跑通回归）

## 3.1 EVENT 模板族

- **EVENT-SCHEMA（L2）**：字段冻结+示例
- **EVENT-CHAIN-PLAN（L2）**：章节事件ID规划（入口/出口/选择点）
- **EVENT-GEN（L1）**：单事件脚本（≤120行）
- **EVENT-BRANCH-AUDIT（L1）**：分支一致性/软锁
- **EVENT-SEMANTIC-VALIDATE（L1）**：引用/循环/缺失
- **EVENT-RUN-SMOKE（L1/L2）**：跑通事件链并输出轨迹

------

## 3.2 EVENT Task Packs ×10

### T-EVENT-3001（L2）schema v1 冻结 + 2示例

（你前面已有类似，保留）

- Deliverables: `schema.md + examples/E0001,E0002`

### T-EVENT-3002（L2）ch01 事件ID规划（入口/关键点/选择/结尾）

- Owner L2_EVENT_SCRIPTING_LEAD | Exec L2_EVENT_SCRIPTING_LEAD_AGENT | Review L2_NARRATIVE_LEAD | Budget 2–3
- Inputs: `ch01/chapter_pack.md`, `schema.md`
- Deliverables: `/content/events/ch01_event_plan.csv`（EventID, Purpose, Entry, Exit, TextID, Next）
- Acceptance: 事件数10–25；选择点≤2；每个事件有出口

### T-EVENT-3003（L1）生成推进链事件 E0101–E0105（5个）

- Owner L2_EVENT_SCRIPTING_LEAD | Exec L3_SCRIPTER | Review L2_EVENT_SCRIPTING_LEAD | Budget 1–2
- Inputs: plan.csv + schema
- Deliverables: `/content/events/E0101..E0105.json`

### T-EVENT-3004（L1）生成推进链事件 E0106–E0110（5个）

同上（分批避免串线）

### T-EVENT-3005（L1）关键选择事件（≤3选项）E0111

- Constraints: 选项≤3；每个选项后果摘要写在 notes 字段（若schema允许）
- Acceptance: 每个选项 next 指向存在或 TODO

### T-EVENT-3006（L1）结果事件（结尾/回收点）E0112–E0114

- Goal: 每条分支至少有一个“回收点/结尾点”，避免软锁
- Acceptance: 能回主菜单或进入下一章入口

### T-EVENT-3007（L1）分支一致性审计（针对 E0111）

- Deliverable: `/docs/05_logs/branch_audit_ch01_E0111.md`
- Checklist: 每选项后果链完整；无死路；回收点明确

### T-EVENT-3008（L1）语义校验跑通并生成报告（ch01）

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_EVENT_SCRIPTING_LEAD | Budget 1–2
- Inputs: validate_events_semantic.py + ch01事件
- Deliverable: `/docs/05_logs/events_validation_ch01.md`（固定格式）

### T-EVENT-3009（L2）事件链烟测轨迹（输出轨迹日志）

- Owner L2_QA_LEAD | Exec L3_AUTOMATION_ENGINEER | Review L2_CLIENT_LEAD | Budget 2–4
- Inputs: 主路径起点 EventID + EventRunner + choices默认策略
- Deliverables: `/docs/05_logs/event_trace_ch01_mainpath.md`
- Acceptance: 输出 EventID 序列 + choice 决策点 + 终点事件

### T-EVENT-3010（L2）新增 action 类型的 CR（流程钉死）

- Owner L2_SYSTEMS_LEAD | Exec L2_SYSTEMS_LEAD_AGENT | Review 你（制作人） | Budget 2–3
- Inputs: 当前 schema + tech bible
- Deliverables: GitHub Change Request（引用：action名、参数、兼容策略、测试点）
- Acceptance:
  -  明确 action 语义
  -  兼容旧脚本策略（默认值/降级）
  -  至少2个示例事件 + 1条自动化断言点

> 这个任务是你要的“actions扩展”关键门禁：**没有 CR，不准实现新 action**。

------

# 4）TEXT 生产线（结构→对白→标签→导入→校对→回归）

## 4.1 TEXT 模板族

- **TEXT-STYLE（L2）**：语气/标签/变量/字数约束（≤120行）
- **TEXT-SCENE-PACK（L1）**：单场景对白（≤12轮）
- **TEXT-CHOICE-COPY（L1）**：选项文案（短、差异化）
- **TEXT-INTEGRATE（L1）**：TextID/索引/变量校验
- **TEXT-IMPORT-RUN（L1）**：导入并在引擎内显示验证
- **TEXT-QA（L1）**：溢出/错别字/分支覆盖校对

------

## 4.2 TEXT Task Packs ×10

### T-TEXT-4001（L2）写作规范+标签+变量（ch01）

- Owner L2_WRITING_LEAD | Exec L2_WRITING_LEAD_AGENT | Review L2_QA_LEAD | Budget 2–4
- Deliverables: `/content/text/style_guide.md`, `tags.md`, `variables.md`
- Constraints: ≤120行；标签可枚举；变量格式统一 `{var}`

### T-TEXT-4002（L1）S01-01 对白包（开场）

- Owner L2_WRITING_LEAD | Exec L3_WRITER | Review L2_WRITING_LEAD | Budget 1–2
- Inputs: chapter_pack（S01-01）+ style_guide/tags
- Deliverable: `/content/text/ch01/S01-01_dialogue.md`

### T-TEXT-4003（L1）S01-02 对白包（推进信息点）

同上

### T-TEXT-4004（L1）S01-03 对白包（铺垫伏笔）

同上

### T-TEXT-4005（L1）关键选择点选项文案（≤3）

- Owner L2_WRITING_LEAD | Exec L3_WRITER | Review L2_NARRATIVE_LEAD | Budget 1–2
- Inputs: 选择事件描述（chapter_pack）
- Deliverable: `/content/text/ch01/choice_E0111_options.md`（含OptionID/TextID）

### T-TEXT-4006（L1）卡片/提示文本（Tutorial/Hint）

- Deliverable: `/content/text/ch01/hints.md`
- Constraints: 每条≤40字；不得剧透超出章节包

### T-TEXT-4007（L1）TextID 索引生成（ch01）

- Owner L2_TOOLS_LEAD | Exec L3_TOOLS_ENGINEER | Review L2_WRITING_LEAD | Budget 1–2
- Deliverable: `text_index.json` + audit报告

### T-TEXT-4008（L1）变量/标签校验跑通（输出问题清单）

- Owner L2_QA_LEAD | Exec L3_TESTER | Review L2_WRITING_LEAD | Budget 1–2
- Deliverable: `/docs/05_logs/text_qa_ch01.md`（列出溢出/错别字/不当表达）

### T-TEXT-4009（L2）引擎内显示验证（UI容器溢出）

- Owner L2_UI_LEAD | Exec L3_UI_ENGINEER | Review L2_QA_LEAD | Budget 2–4
- Inputs: 3个对白包 + UI对话框
- Deliverable: `/docs/05_logs/text_render_check.md`（截图路径+问题列表）
- Acceptance: 不溢出、不遮挡选项、滚动策略符合spec

### T-TEXT-4010（L1）分支覆盖校对（针对选择点三选项后果）

- Owner L2_NARRATIVE_LEAD | Exec L3_WRITER | Review L2_QA_LEAD | Budget 1–2
- Deliverable: `/docs/05_logs/copy_branch_consistency.md`
- Checklist: 三选项语气差异明确；后果暗示与事件一致；无逻辑矛盾

------

# 5）QA 生产线（门禁清单→冒烟→缺陷→回归→里程碑验收）

## 5.1 QA 模板族

- **QA-ACCEPTANCE（L2）**：里程碑验收清单（checkbox）
- **QA-SMOKE（L2）**：≤30条冒烟清单
- **QA-SMOKE-RUN（L1）**：执行并产出报告
- **QA-BUG（L1）**：缺陷单（可复现/可定位）
- **QA-REGRESSION（L2/L1）**：回归分组清单 + 复测记录
- **QA-QUALITY-REPORT（L1）**：日报/周报（固定字段）

------

## 5.2 QA Task Packs ×10

### T-QA-5001（L2）M1 里程碑验收清单（DoD）

- Owner L2_QA_LEAD | Exec L2_QA_LEAD_AGENT | Review 你（制作人） | Budget 2–4
- Inputs: production_plan + build_acceptance + smoke_m1
- Deliverable: `/docs/04_acceptance/milestone_acceptance_M1.md`（checkbox）
- Constraints: 每条必须可截图/日志证明

### T-QA-5002（L2）M1 冒烟清单（≤30条）

- Deliverable: `/docs/04_acceptance/qa_checklists/smoke_m1.md`

### T-QA-5003（L1）执行冒烟并出报告

- Owner L2_QA_LEAD | Exec L3_TESTER | Review L2_QA_LEAD | Budget 1–2
- Deliverable: `/docs/05_logs/smoke_run_M1.md` + Bug issues

### T-QA-5004（L1）事件链主路径回归（轨迹对比）

- Owner L2_QA_LEAD | Exec L3_AUTOMATION_ENGINEER | Review L2_CLIENT_LEAD | Budget 2–4
- Inputs: `event_trace_ch01_mainpath.md`（基线）
- Deliverable: `/docs/05_logs/event_trace_regression.md`
- Acceptance: 轨迹偏差必须解释（变更单/任务ID）

### T-QA-5005（L1）UI交互回归：对话→选择→确认→返回

- Deliverable: `/docs/05_logs/ui_regression_M1.md`（含截图路径）

### T-QA-5006（L1）存档/回滚测试（选择点前后）

- Inputs: save_format_v1 + retry_policy
- Deliverable: `/docs/05_logs/save_retry_test.md`
- Checklist: 回滚后choice一致；事件指针一致；UI一致

### T-QA-5007（L1）内容一致性抽检（TextID引用/缺失）

- Deliverable: `/docs/05_logs/content_reference_audit.md`
- Acceptance: 事件引用的 TextID 均存在；缺失必须阻塞

### T-QA-5008（L1）性能/稳定性轻量检查（启动/章节切换）

- Deliverable: `/docs/05_logs/perf_sanity.md`（启动耗时、内存峰值粗测）
- Constraints: 只做 sanity，不做深入profiling

### T-QA-5009（L2）缺陷分级与关闭标准（把口水变规则）

- Owner L2_QA_LEAD | Exec L2_QA_LEAD_AGENT | Review 你 | Budget 1–2
- Deliverable: `/docs/01_bibles/qa_defect_policy.md`
- 内容：Blocker/Major/Minor 定义 + 关闭条件 + 复测要求

### T-QA-5010（L1）质量日报（固定字段）

- Owner L1_PMO | Exec L3_TOOLS_ENGINEER 或 L3_TESTER | Review L2_QA_LEAD | Budget 1–2
- Deliverable: `/docs/05_logs/quality_daily_YYYYMMDD.md`
- 字段：pass_rate、new_bugs、top_fail_tags、blocked_tasks、next_actions

------

# 6）你要的“更像真团队”的关键补丁：actions 扩展与兼容（完整闭环）

上面已经给了 `T-EVENT-3010（CR）`，这里再把**CR→实现→示例→校验→回归**的流水线钉死成 4 个固定任务（以后加任何 action 都照抄）：

- **CR-ACTION-01（L2）**：CR 申请（语义/参数/兼容/测试点）
- **CR-ACTION-02（L2）**：schema 与示例更新（只做文档与示例，不写代码）
- **CR-ACTION-03（L2）**：代码实现 action（单 PR）
- **CR-ACTION-04（L1）**：自动化断言与回归轨迹更新（或拒绝更新并报偏差）

你把这 4 个任务固化后，actions 扩展就不会把项目拖进无穷的上下文泥潭。

------

# 7）下一步怎么继续补到“所有产出都覆盖”

到现在为止，你已经有了：

- 美术三线（UI/ENV/CHAR/VFX）“工序卡模板族 + 大量实例”
- 程序/工具/事件/文本/QA 的“模板族 + 10实例”

剩下还缺两块会影响“真正纯AI推进”的：

1. **制作管理（PMO）自动拆单规则**：从 Bible/Spec 自动生成 Task Packs 的规则（你就不用手写那么多派单包）
2. **全链路依赖图与并行策略**：哪些任务能并行、哪些必须串行、每个里程碑的最小闭环路径

你只要回一句“继续”，我就把这两块做成：

- 一份 **Task Pack 自动生成规范（从 spec 提取字段→派单包）**
- 一份 **M1/M2 依赖图（文字版+表格版）**，直接能让“100人虚拟组织”跑得更像真的团队。



##### 你说：

继续



###### ChatGPT 说：



已思考 10s



继续，这一轮我把你缺的两块“让纯 AI 真的能滚动推进”的东西补齐到可执行级别：

1. **PMO 自动拆单规范（Task Pack Auto-Generator Spec）**
   - 让 PMO/AI 能从 Bible/Spec 里“抽字段→生成派单包→估预算→建 Issue→挂验收人”，而不是靠你手写 80 个任务包。
2. **M1/M2 依赖图与并行策略（Critical Path + Lanes）**
   - 哪些必须串行，哪些可以并行；每条泳道如何保证上下文不串。

下面直接给你可落库的规范与图。

------

# 1）PMO 自动拆单规范（Task Pack Auto-Generator Spec）

核心思想：**让 Spec 变成“可解析的结构化输入”**，PMO/AI 不需要理解全文，只需要提取“表格/区块”就能稳定生成 Task Pack。

## 1.1 统一“可解析标记”（写进所有 Spec）

要求所有 L1/L2 文档（Bible/Spec）都包含这些区块（用 Markdown 标题 + 表格）：

### A）系统/模块清单区块

```
## [COMPONENTS]
| ID | OwnerRole | Type | Scope | Inputs | Outputs | Risks | DoD |
| ... |
```

- **ID**：唯一（用于派单ID）
- **OwnerRole**：L2 负责人（例如 L2_CLIENT_LEAD）
- **Type**：CODE / TOOL / UI / ENV / CHAR / VFX / EVENT / TEXT / QA
- **Scope**：一句话边界（用于禁止越权）
- **Inputs/Outputs**：用路径或数据结构名
- **Risks**：low/med/high
- **DoD**：完成定义（checkbox 要点）

### B）可拆任务区块（真正的“派单源”）

```
## [TASK_CANDIDATES]
| WorkID | Type | OwnerRole | ExecutorRole | Deliverables | Acceptance | Constraints | DependsOn |
| ... |
```

### C）新增 action/schema 的变更区块（强制走 CR）

```
## [CHANGE_REQUEST_CANDIDATES]
| CRID | Target | Change | Compatibility | TestsRequired | OwnerRole |
| ... |
```

> **PMO/AI 只允许从这三个区块拆单。**
> 其它正文内容只作为背景，不参与自动拆单，避免“理解漂移”。

------

## 1.2 自动生成 Task Pack 的规则（生成器算法）

PMO/AI 读 `TASK_CANDIDATES` 的每一行，生成一个 Task Pack 文件：

**文件名规范**

- `/docs/03_taskpacks/T-<TYPE>-<4digits>_<WorkID>.md`
- 例如：`T-UI-0007_UI_DIALOGUE_PROTOTYPE.md`

**字段映射规则**

- `OwnerRole/ExecutorRole` → Task Pack Owner/Executor
- `Deliverables` → Deliverables（必须是路径列表）
- `Acceptance` → Acceptance Checklist（逐条拆成 checkbox）
- `Constraints` → Hard Constraints（粒度上限、禁止事项）
- `DependsOn` → Deps（任务ID或文件路径）

**对话预算估算（Budget Estimator）**

- Type=TEXT/EVENT/ASSET（纯内容）且 Deliverables ≤ 5 个文件 → `1–2`
- Type=TOOL 且单脚本单职责 → `1–2`
- Type=CODE/UI/INTEGRATE → `3–6`
- Risk=high 或 DependsOn>3 → 自动拆分（见 1.3）

------

## 1.3 自动“拆细”策略（Granularity Splitter）

为了保证你要的“当前模型稳定粒度”，生成器在发现以下情况时必须拆任务：

### 触发条件

- Deliverables 文件数 > 6
- CODE 预计净新增 > 400 行（由任务类型推断）
- UI 状态数 > 6 或组件变体 > 3
- EVENT 一次要生成事件数 > 8
- CHAR 一次要生成动作数 > 1
- ENV tile > 12 或 props > 20
- VFX 单特效帧数 > 16 或同时生成特效数 > 3

### 拆分模板（固定）

- CODE：拆成 `INTERFACE_STUB` → `IMPLEMENT` → `GUARD` → `INTEGRATE`
- UI：拆成 `PROTOTYPE` → `ASSET_REQ` → `GEN_ASSETS` → `STANDARDIZE` → `INTEGRATE`
- CHAR：拆成 `SPEC` → `CONCEPT` → `3VIEW` → `ANIM_SPEC` → `FRAMES(action)` → `ATLAS_META` → `INTEGRATE`
- ENV：拆成 `BLOCKOUT` → `ASSET_REQ` → `TILES` → `PROPS` → `FG` → `INTEGRATE`
- EVENT：拆成 `PLAN` → `GEN(batch)` → `BRANCH_AUDIT` → `SEMANTIC_VALIDATE` → `TRACE_SMOKE`

> 这一步解决你说的关键：**有限上下文 + 稳定输出**，并把“大任务必漂移”的风险自动掐掉。

------

## 1.4 自动建 Issue 的规则（PMO 执行）

每生成一个 Task Pack 文件，PMO 自动建一个 Issue（或你手动点一下也行）：

- Title：`[T-UI-0007] UI Dialogue Prototype`
- Body：只写三行：
  1. Task Pack path
  2. Reviewer（从 OwnerRole 推导）
  3. Budget（1–2 / 3–6）
- Labels：
  - `taskpack`, `role:<ExecutorRole>`, `risk:<low|med|high>`, `type:<TYPE>`

------

## 1.5 示例：UI Spec → 自动派单（你要的“工序化”）

假设 `ui_components_spec.md` 中 `TASK_CANDIDATES` 有这几行：

| WorkID                | Type | OwnerRole  | ExecutorRole     | Deliverables                                          | Acceptance                  | Constraints        | DependsOn             |
| --------------------- | ---- | ---------- | ---------------- | ----------------------------------------------------- | --------------------------- | ------------------ | --------------------- |
| UI_DIALOGUE_PROTOTYPE | UI   | L2_UI_LEAD | L3_UI_ENGINEER   | /src/ui/WBP_Dialogue.uasset;/src/ui/WBP_Choice.uasset | 可跑通对话与选择;有状态日志 | 状态<=6;不新增页面 | ui_flow_spec          |
| UI_ASSET_REQ_DIALOGUE | UI   | L2_UI_LEAD | L2_UI_LEAD_AGENT | /docs/02_specs/ui/ui_asset_requirements.md            | 每个AssetID齐全;可校验      | 每组件<=5图素      | UI_DIALOGUE_PROTOTYPE |
| UI_GEN_BUTTON_PRIMARY | UI   | L2_UI_LEAD | L3_UI_ARTIST     | /content/ui_assets/button/...                         | 三态差异清晰;命名合规       | 只交付3张          | UI_ASSET_REQ_DIALOGUE |

生成器会自动生成 3 个 Task Pack，并把 UI 的闭环拆成你描述的那套工序链。

------

# 2）M1 / M2 依赖图与并行策略（Critical Path + Lanes）

这里我不画图，用“关键路径表 + 泳道并行表”给你，直接可执行。

## 2.1 M1 目标回顾（可玩闭环）

启动 → 主菜单 → ch01 → 10–15事件链 → 1个关键选择（≤3选项）→ 结果 → 结束/返回
并通过：校验器（事件/文本/资源）+ 冒烟（≤30条）

------

## 2.2 M1 关键路径（必须串行的最短链）

> 这条链跑通，就算资源很丑也能“可玩”。

1. **L1 总纲冻结**：Design Bible → Tech Bible → QA Bible（Art Bible 可并行）
2. **L2 系统 Spec**：event/choice/ui/narrative（最小字段）
3. **EVENT schema + examples**（冻结）
4. **CODE EventRunner**：能跑 examples（日志可追踪）
5. **UI 功能版**：对话/选择能显示并回调
6. **CODE 绑定**：actions → UI（show_text/show_choices）
7. **ch01 chapter_pack**（结构，不写长文案）
8. **EVENT plan → 事件脚本批量生成（分批）**
9. **TEXT 写作规范 → 3–5个场景对白（先少量）→ text_index**
10. **TOOL 校验器接 CI**（至少 events schema + text 校验）
11. **QA smoke_m1 → 执行 → Bug闭环 → M1验收**

> 这条链里：任何一步漂移，立刻回退到“上游规格/派单包”，不要在执行层争论。

------

## 2.3 M1 并行泳道（最大化“100人团队滚动感”）

把任务拆成 6 条泳道，各泳道内部串行，泳道之间并行；上下文不会串。

### Lane A：规格泳道（L1/L2）

- Bible（Design/Tech/QA/Art）
- system specs（event/choice/ui/narrative）
- vfx_spec_m1（可选）
  **输出给**：全部其它泳道（只读）

### Lane B：引擎最小可跑（CODE/UI）

- EventRunner（examples）
- UI 对话/选择功能版
- actions→UI 绑定
- 章节入口/退出
  **门禁**：build_acceptance（跑示例+主路径）

### Lane C：内容结构泳道（NARRATIVE/EVENT）

- ch01 chapter_pack
- ch01 event_plan
- 事件脚本（分批 5+5+选择+结果）
- 分支审计
  **门禁**：events_semantic_validate + event_trace_smoke

### Lane D：文本泳道（TEXT）

- style_guide/tags/variables
- 对白包（先 3–5 个场景）
- text_index + validate_text
  **门禁**：UI 渲染检查（不溢出）

### Lane E：工具门禁泳道（TOOL/CI）

- validate_events_schema/semantic
- validate_text + build_text_index
- validate_ui_assets（即使资产占位也要）
- CI 挂门禁
  **输出给**：PMO/QA（质量报告）

### Lane F：QA 泳道（QA）

- smoke_m1 清单
- 冒烟执行与报告
- 缺陷闭环
  **输出给**：对应 owner（UI/代码/内容/工具）

------

## 2.4 M1 并行上限（防串线）

- L1/L2 规格任务：并行 2（最多）
- L2→L3 任务包：
  - 内容类（TEXT/EVENT/ASSET）并行 5–10
  - 代码类（CODE/UI）并行 1–2（否则集成炸）
- QA 任务：并行 2（冒烟+缺陷复测）

------

# 3）M2 依赖图（从“可玩”到“可交付体验”）

M2 的本质不是加量，而是把“闭环质量”做扎实，并扩展 1–2 个系统能力。

## 3.1 M2 目标建议

- ch02 上线（新章节闭环）
- 存档 v2（至少：章节进度 + choice + 最近选择点回滚）
- actions 扩展 1–2 个（例如：`play_vfx`, `set_flag`）
- UI 正式版（图素替换完成）
- 自动化回归覆盖：事件链主路径 + 文本校验 + 资源校验

## 3.2 M2 关键路径（必须串行）

1. **CR：新增 action（如 play_vfx）**（批准后才允许实现）
2. schema/示例更新 → 校验器同步 → 代码实现 action → 自动化断言更新
3. save v2（含版本迁移）→ QA 回归
4. ch02 chapter_pack → event_plan → 脚本批量生成 → 文本批量填充
5. UI 资产闭环：功能版→需求清单→生成→标准化→替换→回归

## 3.3 M2 并行策略

- ch02 内容与 UI 正式资源可以并行
- 但 **action 扩展链** 必须串行（CR→schema→code→tests）
- 存档 v2 与 ch02 可以并行，但**合并到主干必须先过回归门禁**

------

# 4）你要的“自动拆单+依赖图”怎么落到纯 AI 工具

你现在就能这么做（不需要搭大编排系统也能跑）：

1. L1/L2 写 Spec 时，强制补 `[TASK_CANDIDATES]` 表
2. PMO Agent 只读这些表，生成 Task Pack 文件（模板化）
3. PMO 用 Issue 模板批量建任务（或你一次性创建）
4. 执行岗（AI）只领一个 Task Pack 执行并交 PR/资源包
5. Reviewer 按 checklist 判定 PASS/MINOR/MAJOR/ROLLBACK
6. 校验器+CI 作为“机器门禁”，把低级错误拦在合并前

> 这套东西跑起来后，你会明显感觉：你不是在“对话做项目”，而是在“像团队一样流水线生产”。

------

如果你愿意把这一步再推进到“真·自动化”，下一轮我可以把 **“Task Pack 自动生成器”**再写成：

- 生成器输入：某个 Spec 文件路径（含 `[TASK_CANDIDATES]` 表）
- 输出：一组 Task Pack Markdown 文件 + 一个 Issue 批量创建清单（CSV/JSON）
  并且把“拆细策略”写成可执行规则（你用 Cursor 跑脚本就能批量产派单包）。



##### 你说：

目前基于Cursor来搭建，但是发现没法完全自动流水线化，同时还会花费大量token，主要是现在的流水线靠无限的继续往前推，但是这样会累积上下文，会拉满对话窗口，导致即使有mdc也会出严重的幻觉，不跟规则走，也因为拉满了对话窗口，烧了很多token，这使得每token价值非常低，下一步我打算基于cursor cli来解决，但是需要外部驱动框架，还有我希望工作流可以保持跑，并且能看到每步流程的推进进度，最好是可视化观察，然后我可以审阅每个步骤生成的文档，这个文档本身既用来给AI提供上下文，也用来给我审阅，我一旦发现有问题，随时打断，修正，然后再恢复继续，你看看如何，不一定局限于cursor cli



###### ChatGPT 说：

你现在遇到的是**AI-Native 工程的真实瓶颈**：

- 用 Cursor（GUI 对话）“无限继续”推进 → **上下文膨胀** → 幻觉/越权/不守规则 → token 价值暴跌
- mdc/rules 在长对话里会被稀释，模型开始“自嗨推进”
  你想要的下一步，其实是把“对话式推进”改成 **“文档/任务为中心的外部编排”**：
  **每一步都用可审阅工件驱动、可视化看进度、可随时暂停/修正/恢复。** 这方向是对的。

下面我给你一个**不局限 Cursor CLI**、但能和 Cursor CLI 配合得很好的落地方案：分三档，从“今天能用”到“高度自动化”。

------

## 1）核心改造：从“长对话”转为“短上下文 + 工件驱动”

你需要把上下文切成两类文件，保证每次调用都很短：

### A. 冻结基线（永远不进对话全文）

- `AGENTS.md`（规则/权限/输出格式）
- `docs/00_charter/*`（宪法/CR流程）
- `docs/01_bibles/*`（总纲）
- `docs/02_specs/*`（系统规格/资产规格）
  这些**只作为引用路径**，不要粘贴进 prompt。

### B. 每步工件（每个步骤生成一个、可审阅）

- `docs/03_taskpacks/T-xxxx.md`（派单包）
- `docs/05_logs/runlog_*.md`（执行记录：输入→输出→验收）
- `docs/05_logs/review_notes_*.md`（你审阅与修改）

**每次模型调用只喂：Task Pack + 必要输入文件（少量）**
不要再把“历史对话 + 一堆背景”塞进去。

------

## 2）你想要的“可持续跑 + 可视化进度 + 可随时打断恢复”

这需要一个外部驱动框架，核心能力是：

1. **状态机**：DRAFT→READY→IN_PROGRESS→REVIEW→QA→DONE/ROLLBACK
2. **任务队列**：从 Spec 的 `[TASK_CANDIDATES]` 表自动生成 Task Packs
3. **可视化看板**：实时看到每个任务在哪一列
4. **人工闸门**：到 REVIEW 必须你点“Approve/Reject”，才能继续
5. **可恢复**：崩了/中断后，从状态机继续，不靠对话记忆
6. **低 token**：只给模型最小上下文；大文档不进 prompt，只引用路径

------

## 3）三档落地方案（按你现在阶段选）

### 方案 A：最快落地（今天就能跑）

**GitHub Projects / Jira 看板 + 任务文件驱动 + 手动触发 CLI**

- 你用看板观察进度（可视化）
- 每个任务一个 Task Pack（md）
- 执行用 Cursor CLI 或任意 LLM CLI：
  - `run_task.py T-UI-0001`
  - 脚本读取 Task Pack + Allowed Inputs，生成输出文件/PR
- REVIEW 列：你看 diff，写 review_notes，点 approve 才流转

优点：最低成本，立刻把“长对话灾难”砍掉
缺点：自动化程度中等，还是要你点几下

------

### 方案 B：你描述的理想形态（推荐主线）

**n8n / Temporal / Prefect / Airflow 之一 + 本地任务仓库 + Web 看板**
我建议你优先考虑 **n8n**：

- 可视化流程编排（你要的“看每步推进”它天然强）
- 每一步节点可以是：读文件→调用模型→写文件→创建PR→跑校验→等待人工审批
- 支持 **“Wait for approval”** 节点，你可以随时打断/修改后恢复继续
- 状态、日志、产物都可保存

架构图（你要的）：

```
Spec → 生成 Task Packs → 入队 READY
  ↓
Worker(LLM) 执行 → 写输出 → 触发校验 → 进 REVIEW
  ↓（人工批准/拒绝）
批准 → 合并/入库 → 进 QA → DONE
拒绝 → 写 REGEN PACK/修订 Task Pack → 回到 READY
```

优点：

- 真正可流水线跑
- 真正可视化
- 真正可暂停/恢复
- token 利用率大幅提升（每步上下文短）

缺点：你要搭一个编排服务（但不需要很重）

------

### 方案 C：最强但成本最高（组织仿真/大规模）

**LangGraph/CrewAI + MCP 工具层 + 状态存储 + 前端看板**
这更像“你要的 100 人组织自动滚动”。
但我建议你先把 B 跑稳，再上 C。

------

## 4）关键技术点：怎么把 token 成本打下来（实操规则）

你现在 token 价值低，根因是“上下文肥+对话长”。解决方法是：

### 规则 1：每次调用只给 3 件东西

- Task Pack（含目标/输入/输出/验收/禁止事项）
- Allowed Inputs（最多 3 个文件，且是片段/摘要）
- 输出模板（固定回执壳）

### 规则 2：用“索引文件”替代大文档

对大文档（Bible/Spec）生成 **Index 摘要**：

- `design_bible.index.md`（只列目录+关键约束）
- `event_schema.index.md`（只列字段定义）
  模型每次只看 index，需要细节再按路径打开对应段落（由脚本截取给它）。

### 规则 3：失败不补上下文，只改 Task Pack

模型跑偏了，99% 是“派单不够硬”。
你的修正动作应是：

- 给 Fail Tags + REGEN PACK
- 修改 Task Pack（更硬的约束、更明确的输出格式）
  而不是继续对话解释。

------

## 5）你要的“文档既是上下文又是审阅材料”

这很好，而且应该标准化成两份文件：

### 5.1 任务产物（给 AI）

- `docs/03_taskpacks/T-xxxx.md`
- `docs/02_specs/...`
- 输出文件（代码/资产/脚本）

### 5.2 审阅记录（给人+也可给 AI 作为补丁）

- `docs/05_logs/review_notes_T-xxxx.md`
  - 只写：哪些 checklist 没过、Fail Tags、REGEN PACK、下一步怎么改
- `docs/05_logs/runlog_T-xxxx.md`
  - 记录：调用参数、输入版本、输出文件列表、校验结果

这样你“随时打断”的动作就是：
写 review_notes → 把任务状态改回 READY → 重新跑 worker。

------

## 6）我建议你现在就按“B方案（n8n）”的最小可行版本来做

最小版本只需要 6 个节点：

1. **Watch Repo**（检测有 READY 的 Task Pack）
2. **Read Task Pack**（解析 Allowed Inputs）
3. **Assemble Minimal Context**（从 repo 抽取输入片段/索引）
4. **Call LLM**（执行）
5. **Write Outputs + Run Validators**（写文件/跑校验脚本）
6. **Wait for Approval**（你点 approve/reject）
   - approve → 标 DONE
   - reject → 写 review_notes + 回到 READY

你获得的东西：

- 进度可视化（n8n 自带执行链路）
- 任务状态可追踪
- 可暂停/恢复
- token 不再爆炸

------

## 7）下一步我可以直接给你“落地蓝图”到能开干的程度

你不需要再补信息。我建议我下一条直接输出：

1. **任务状态机的数据结构**（tasks.json / sqlite schema）
2. **Task Pack 解析器规范**（YAML frontmatter 或固定标题解析）
3. **最小 worker CLI（伪代码级）**：
   - `runner pull-ready`
   - `runner run T-xxxx`
   - `runner approve/reject T-xxxx`
4. **n8n 流程节点设计清单**（每个节点输入输出字段）
5. **如何接 Cursor CLI**（如果你坚持用它作为执行器）

你回我一句你偏好哪种驱动：

- **“n8n 可视化编排为主”**
- **“纯 CLI + TUI（终端看板）为主”**
- 或 **“两者结合（CLI执行 + Web看板）”**

我就按你选的路线把蓝图写到可落地的规格和脚手架级别。



##### 你说：

n8n能基于cursor完全搭建好整套流程不？我不想自己动手，如果我让cursor自己写个程序来实现是不是更好？还有我觉得当下我手上最强Agent在Cursor，你怎么看？



###### ChatGPT 说：

可以，但我得把话说透：**n8n 本身不会“基于 Cursor 自动帮你搭好整套流程”**，它只是编排器。你仍然需要一个“执行器/工人（worker）”去干活，而你最强的工人现在确实在 Cursor（无论是模型、编辑器上下文、改文件能力还是你习惯的工作方式）。所以更合理的架构是：

- **n8n 负责：流程/状态/可视化/暂停与审批/触发与通知**
- **Cursor（或 Cursor CLI）负责：真正执行每个 Task Pack（改文件/跑测试/提PR）**
- 你负责：在关键闸门点（REVIEW）看 diff、写 review_notes、批准继续

这套组合能同时满足你三个诉求：

1. **可流水线跑**（不用长对话）
2. **可视化进度**（n8n 看得见每步）
3. **最强执行能力仍用 Cursor**（不浪费你手上最强 agent）

------

## 1) “不想自己动手”这件事：现实边界

你想完全不动手，让 n8n + Cursor 自动搭好一切，当前能做到的程度大概是：

- **Cursor 可以帮你写：worker 程序、n8n 的流程 JSON、repo 目录、Task Pack 模板、校验脚本**
- 但 **部署/运行/配置**（比如 n8n 的环境、凭据、webhook、token、网络访问）通常还是要你点几下，至少完成：
  - 启动 n8n
  - 配置 Git 仓库访问/凭据
  - 配置“审批”的入口（网页按钮/Slack/邮件）

如果你连这点都不想做，那就只能用**托管服务 + 预置模板**，但仍会有登录授权步骤——这个是没法消掉的。

------

## 2) “让 Cursor 自己写个程序来实现是不是更好？”

**如果你的目标是：最少手工 + 最高可控 + 最少 token 浪费**
那答案是：**是的，更好。** 但要写对形态。

我建议你别一上来就写“巨型全自动 Agent 系统”，而是让 Cursor 写一个**很小但很硬的外部驱动框架**（你之前提的“外部驱动”就是这个），核心只有 5 个模块：

### 外部驱动框架（最小可行版）

1. **任务状态库**（SQLite 或 tasks.json）
   - `READY/IN_PROGRESS/REVIEW/QA/DONE/ROLLBACK`
2. **Task Pack 解析器**
   - 从 `/docs/03_taskpacks/T-xxxx.md` 解析 Allowed Inputs、Deliverables、Constraints
3. **执行器适配层（Cursor Adapter）**
   - 把“执行任务”委托给 Cursor CLI（或你指定的 LLM CLI）
4. **校验器 runner**
   - 跑 `/tools/validate_*.py`，把结果写入 runlog
5. **审阅闸门**
   - 生成 `review_notes_T-xxxx.md` 占位，等待你 approve/reject

然后你再把它接到 n8n，就得到可视化与持续运行。

> 关键点：
> **编排要“笨”，执行要“强”，审阅要“硬闸门”。**
> 这样 token 最省、幻觉最少、回滚最快。

------

## 3) “当下我手上最强 Agent 在 Cursor”——我怎么看？

我同意你的判断，原因很现实：

### Cursor 强在三件事

1. **贴近代码与文件系统**：改文件、看 diff、跨文件引用，效率远高于纯对话
2. **你已经把工作流习惯/规则沉淀在 Cursor**（PromptX、rules、MCP）
3. **闭环更快**：写完能立刻跑、立刻修，反馈回路短

### 但 Cursor 弱在两件事（也是你现在痛点来源）

1. **它不是编排器**：长流程会堆在对话窗口里，上下文必膨胀
2. **它缺“可视化状态机”**：你看不到整个 pipeline 的运行态，只能靠人脑

所以结论是：

> **Cursor 做执行引擎（worker）没问题，甚至最好。**
> **但你必须把“流程状态与审阅闸门”挪到外部。**
> 否则你永远会回到“无限继续→拉满上下文→幻觉→烧 token”的循环。

------

## 4) 推荐你走的最终形态（最符合你诉求）

### 形态：n8n（编排看板） + Cursor CLI（执行） + Repo 文档（上下文与审阅）

- n8n 定时扫描：是否有 `READY` 的任务（或 GitHub Issue label=ready）
- 拉取 Task Pack → 生成“最小上下文包”（只读必要文件片段/索引）
- 调用 Cursor CLI 执行任务（输出到指定路径）
- 跑校验器 → 写 runlog
- 进入 `REVIEW` 等你点 approve/reject
- approve：合并/标 DONE；reject：写 REGEN PACK → 回到 READY

你全程不需要长对话，token 利用率会比现在高一个数量级。

------

## 5) 你现在立刻可以让 Cursor 生成的“落地工程”清单

如果你要“尽量不动手”，最现实的做法是：

1. 让 Cursor 生成一个 repo 内的 `runner`：
   - `runner scan`（找 READY 任务）
   - `runner run T-xxxx`（执行 + 校验 + 产生日志）
   - `runner approve/reject T-xxxx`（改状态、写 review_notes、回队列）
2. 让 Cursor 生成 n8n workflow JSON：
   - trigger（定时/仓库事件）
   - run command（调用 runner）
   - wait approval（Webhook 或 UI 按钮）
3. 让 Cursor 生成你需要的模板：
   - Task Pack frontmatter（建议加 YAML 头，解析更稳）
   - runlog/review_notes 模板
   - Issue 模板

你唯一需要做的手工动作会变成：

- 配置一次 n8n（凭据/启动）
- 偶尔在 REVIEW 点一下 approve/reject

------

## 6) 我建议你下一步直接定一个“最小MVP流水线”

不问你一堆问题，我直接给默认：

- **任务源**：repo 里的 Task Pack（带 YAML frontmatter + status）
- **状态库**：tasks.sqlite（或 tasks.json）
- **执行器**：Cursor CLI（worker）
- **可视化**：n8n（流程面板） + GitHub Projects（任务看板）二选一或都要
- **人工闸门**：REVIEW 必须人工批准

如果你同意，我下一条就给你：

1. **Task Pack 的 YAML 头规范（字段定义）**
2. **runner 的目录结构 + 命令行接口设计**（含伪代码到可生成代码的程度）
3. **n8n workflow 节点清单（每个节点输入输出字段）**
4. **如何把 Cursor CLI 当作执行器的适配层（抽象接口）**

你只需要回复一句：
**“给我 YAML 规范 + runner 设计 + n8n 节点清单，默认 Cursor CLI 执行”**



##### 你说：

以n8n（编排看板） + Cursor CLI（执行） + Repo 文档（上下文与审阅）这个形态把刚才生成的内容结合在一起，形成一套完整的落地方案，详细介绍有什么步骤，每个步骤做什么



###### ChatGPT 说：

下面把你前面整套“岗位/工序卡/Task Pack/门禁/CR/校验器/依赖图”的内容，**收敛成一个可落地的端到端方案**：
**n8n（编排看板） + Cursor CLI（执行） + Repo 文档（上下文与审阅）**。
我按“从 0 到跑起来，再到日常怎么用”的步骤讲清楚：**每一步做什么、产出什么、谁负责、怎么暂停/修正/恢复**。

------

# 0. 这套形态的核心原则

- **不再用长对话推进项目**：每次执行只喂 **一个 Task Pack + 少量允许输入**。
- **进度与状态在外部可视化**：n8n 管状态机和流程，Cursor CLI 只做执行。
- **文档既是上下文也是审阅材料**：Task Pack、Spec、runlog、review_notes 全都在 repo，版本化、可 diff、可回滚。
- **必须有人类闸门**：所有任务执行完进入 `REVIEW`，你 approve/reject 决定是否继续，避免“AI 自嗨”。

------

# 1. Repo 端的落地结构（把“上下文”变成工件）

你已经有目录框架，我这里把**跑流水线必须的最小文件**点出来：

## 1.1 必备目录

- `/docs/00_charter/`：宪法、CR流程（冻结）
- `/docs/01_bibles/`：各总纲（冻结或半冻结）
- `/docs/02_specs/`：系统/UI/美术/管线规格（L2产物）
- `/docs/03_taskpacks/`：**派单包**（流水线的唯一任务源）
- `/docs/04_acceptance/`：验收门禁（build/milestone/smoke）
- `/docs/05_logs/`：runlog、review_notes、rollback_log、quality_daily

## 1.2 Task Pack 必须改成“可解析格式”

建议每个 Task Pack 顶部加 **YAML frontmatter**，这样 runner 和 n8n 都能稳定解析，不靠 NLP。

示例（`/docs/03_taskpacks/T-UI-0001.md`）：

```
---
id: T-UI-0001
type: UI
level: L2
status: READY          # DRAFT/READY/IN_PROGRESS/REVIEW/QA/DONE/ROLLBACK
owner: L2_UI_LEAD
executor: L3_UI_ENGINEER
reviewer: [L2_UI_LEAD, L2_QA_LEAD]
budget: "3-6"
deps: ["T-0206", "T-0401"]     # 任务ID或文件路径
allowed_inputs:
  - /docs/02_specs/ui/ui_flow_spec.md
  - /docs/02_specs/ui/ui_components_spec.md
deliverables:
  - /src/ui/WBP_Dialogue.uasset
  - /src/ui/WBP_Choice.uasset
validators:
  - validate_ui_assets
  - smoke_m1
---
```

正文仍然用你那套“Outcome/Allowed Inputs/Deliverables/Constraints/Checklist/REGEN PACK”，只是机器可读字段放 YAML 里。

------

# 2. Runner（外部驱动器）要做什么

Runner 是把“任务状态机”落到现实世界的那个小程序，**它不聪明，但很硬**。

## 2.1 Runner 的职责（必须只有这些）

1. **扫描任务**：找 `status: READY` 且 deps 满足的任务
2. **组装最小上下文包**：只读 Task Pack YAML + Allowed Inputs 指定文件（必要时只截取片段/索引）
3. **调用执行器**：把任务交给 Cursor CLI（或其它 CLI）执行
4. **运行校验器**：调用 `/tools/validate_*.py` + 冒烟脚本
5. **写日志与改状态**：生成 runlog，更新 Task Pack 状态为 REVIEW 或 ROLLBACK
6. **处理审批**：收到 approve/reject 后做下一步（DONE 或回到 READY 并写 REGEN PACK）

## 2.2 Runner 的 CLI 命令（你后面扩展很顺）

- `runner scan`：列出可运行任务（满足 deps、READY）
- `runner run T-UI-0001`：执行一次任务（IN_PROGRESS→REVIEW/ROLLBACK）
- `runner approve T-UI-0001`：REVIEW→QA 或 DONE（看配置）
- `runner reject T-UI-0001 --tag SPEC_VIOLATION`：写 review_notes + 回到 READY
- `runner resume`：从队列继续跑（n8n 就是调用它）

## 2.3 Runlog / Review Notes（保证你能随时打断恢复）

每次 run 都写两份文件：

- `/docs/05_logs/runlog_T-UI-0001_20251229.md`
  - 输入文件版本（commit hash）
  - 输出文件列表
  - 校验器结果
  - Cursor CLI 调用参数摘要
- `/docs/05_logs/review_notes_T-UI-0001.md`
  - 你 reject 时写：Fail Tags、REGEN PACK、下一步要求

**关键点**：你打断不靠对话，靠 review_notes；恢复继续也只靠 review_notes + Task Pack。

------

# 3. Cursor CLI（执行器）在流水线里的定位

你说得很对：目前你最强执行 Agent 在 Cursor。这里就把 Cursor CLI 当成“worker”：

## 3.1 Cursor CLI 每次只执行一个 Task Pack

Runner 给 Cursor CLI 的输入应当极短，理想是：

- Task Pack 正文（含 checklist/约束）
- Allowed Inputs 的内容（最多 3 个文件，必要时只给索引片段）
- 输出路径（deliverables）
- 固定回执模板（完成内容/输入映射/自检/风险）

**禁止**：把 project 全文、历史对话、Bible 全贴进去。

## 3.2 Cursor CLI 的输出必须结构化

执行完必须在 runlog 里可追溯：

- 改了哪些文件（diff）
- 是否满足 checklist
- 未完成点与风险

------

# 4. n8n（编排看板）怎么把整条线跑起来

n8n 负责的是：**流程可视化、持续运行、等待审批、失败分支处理**。

## 4.1 n8n 的主流程（建议叫：`Pipeline-Main`）

按节点解释“每一步做什么”：

### Node 1：Trigger（定时/Repo事件）

- 每 X 分钟触发一次（或 Git webhook）
- 目的：持续跑，不靠你手动点

### Node 2：Pull Ready Tasks（调用 runner scan）

- 执行：`runner scan --json`
- 输出：可运行任务列表（deps 满足、READY）

### Node 3：Pick Next Task（队列策略）

- 策略建议：
  - 优先跑 `risk:low`、`type:TEXT/EVENT/ASSET`（高并发）
  - CODE/UI 只并行 1–2 个（避免集成炸）
- 输出：一个 task id（或一批低风险任务）

### Node 4：Run Task（调用 runner run）

- 执行：`runner run T-xxxx`
- runner 内部会：改状态→IN_PROGRESS、调用 Cursor CLI、跑校验、写 runlog
- 输出：任务结果：REVIEW / ROLLBACK + 日志路径

### Node 5：Branch

- 如果结果是 `ROLLBACK`：走失败支路
- 如果结果是 `REVIEW`：走审批支路

### Node 6A：Failure Handler（失败支路）

- 自动创建/更新一个 “需要人处理”的通知（Slack/邮件/钉钉/你选）
- 把 Fail Tags、runlog 链接、建议 next action 发给你
- 状态保持 ROLLBACK（不继续跑）

### Node 6B：Wait For Approval（审批支路）

- 这里是你想要的“随时打断”
- n8n 提供一个表单或 webhook endpoint：
  - 你点 Approve：继续
  - 你点 Reject：写 review_notes + 回退 READY（或要求重写 Task Pack）

### Node 7：Approve Path（调用 runner approve）

- 执行：`runner approve T-xxxx`
- 典型结果：REVIEW→QA（可选）→DONE

### Node 8：Reject Path（调用 runner reject）

- 执行：`runner reject T-xxxx --tag ...`
- 结果：写 review_notes、状态回 READY，然后回到 Node 2 等下一轮

### Node 9：Update Dashboard（可选）

- 把任务状态写到一个汇总文件或数据库（tasks.sqlite）
- n8n 本身也能看到每个节点成功/失败

## 4.2 你要的“可视化观察”

给你两个层次，建议都要：

- **n8n**：看“流程跑到哪一步、卡在谁的审批”
- **GitHub Projects / 看板**：看“任务状态分布、哪个泳道拥塞”（READY/IN_PROGRESS/REVIEW/QA/DONE）

------

# 5. 你如何审阅与插手（最小人工动作）

你日常只做 3 件事：

1. **审 runlog + diff**（n8n 会给你链接/路径）
2. **approve / reject**
3. reject 时写一段 **review_notes（Fail Tags + REGEN PACK）**

这就能达到你说的：

> 我随时发现问题 → 打断 → 修正 → 恢复继续

修正的对象通常是两类：

- **Task Pack 不够硬**：补 Constraints/Checklist/Allowed Inputs（最常见）
- **资产/内容不合格**：用 REGEN PACK 指定“保留什么、修什么、硬规格是什么”，然后重跑同一个任务

------

# 6. 如何控制 token 价值（让每次调用都“短而准”）

你现在 token 烧得多，是因为“对话窗口累积”。流水线化后必须配合两条硬策略：

## 6.1 上下文只允许 3 层

- Layer 1：Task Pack（主指令）
- Layer 2：Allowed Inputs（最多 3 个文件或索引片段）
- Layer 3：输出模板（固定回执壳）

其余所有东西（Bible/Spec/历史）只作为**路径引用**，不直接贴进 prompt。

## 6.2 用 Index 文件替代大文档

对每个大规格生成 `*.index.md`（只含目录+关键约束+字段表）。
Runner 默认喂 index；只有 Task Pack 明确要求时才喂全文某一节（按标题截取）。

------

# 7. CR（变更控制）如何融入流水线（避免“越跑越歪”）

你前面强调 actions/schema/边界变更必须走 CR，这里把它变成流水线规则：

- 任何任务如果触发“需要新增 action / schema 字段 / 新系统边界”
  - runner 不允许继续执行
  - 自动创建 `CR` Issue（或生成 `docs/00_charter/CR-xxxx.md`）
  - n8n 流程卡在 `WAIT_APPROVAL`，必须你批准 CR 才解锁后续任务

这样可以从机制上杜绝“AI 顺手加功能”。

------

# 8. 上线顺序（你按这个做，最快跑起来）

按优先级从小到大，减少你动手量：

## Step 1：把 Task Pack 统一成 YAML frontmatter

- 先改 5–10 个关键任务包（UI/事件/文本/校验器/冒烟）
- 让 runner 能稳定解析

## Step 2：让 Cursor 写 runner（最小功能）

- scan/run/approve/reject
- runlog/review_notes
- 调用 Cursor CLI 的适配层（先用占位命令也行）

## Step 3：先不用 n8n，命令行跑通闭环

- `runner run ...` → REVIEW → approve/reject
- 先确保状态机和文档闭环没问题

## Step 4：上 n8n（可视化+持续运行+审批）

- n8n 只做“调 runner + 等你审批”
- 不要一开始就把逻辑写进 n8n，保持它“薄”

## Step 5：接 GitHub 看板/通知

- 任务状态同步到看板（更像团队）

------

# 9. 你最后会得到什么（对标你最初目标）

- 流程能持续跑：n8n 定时拉任务、执行、等待审批、继续
- 进度可视化：n8n + 看板一眼看瓶颈
- 你能随时打断：REVIEW 闸门卡住就停
- 修正能恢复：改 Task Pack/review_notes 直接重跑，不需要长对话
- token 价值显著提升：每次调用只喂很短上下文，幻觉率下降

------

如果你愿意，我下一条可以把这套方案进一步“落到可直接生成代码的规格”：

1. Task Pack YAML 字段完整 schema（必填/可选/默认）
2. `runner` 的模块划分与伪代码（scan/run/approve/reject 细到函数级）
3. n8n workflow 的节点字段表（每个节点 input/output JSON）
   你只要照着让 Cursor 生成工程，就能很快跑起来。



##### 你说：

继续



###### ChatGPT 说：

下面把你要的三件东西一次性给全：

1. **Task Pack YAML 字段完整 Schema（必填/可选/默认/校验规则）**
2. **runner 的模块划分 + 命令行接口 + 伪代码（到函数级）**
3. **n8n Workflow 的节点输入/输出 JSON 约定（每个节点收什么、吐什么）**
   目标是：你把这份规格扔给 Cursor（或 Cursor CLI）就能直接生成工程并跑起来。

------

# 1) Task Pack YAML Frontmatter Schema v1

> 设计目标：**机器稳定解析、最小上下文执行、强门禁、可恢复**。
> 任务正文仍然用你那套工序卡（Outcome/Steps/Checklist/REGEN PACK），但机器只依赖 YAML。

## 1.1 字段总表

### 必填字段

- `id`：任务唯一 ID（如 `T-UI-0001`）
- `type`：任务类型枚举
- `level`：L1/L2/L3
- `status`：状态机枚举
- `owner`：上游负责人角色（如 `L2_UI_LEAD`）
- `executor`：执行角色（如 `L3_UI_ENGINEER`）
- `reviewer`：验收角色列表（至少 1 个）
- `budget`：对话预算（字符串，`"1-2"` / `"3-6"` / `"4-7"`）
- `allowed_inputs`：允许引用的文件路径列表（<=3 强烈建议）
- `deliverables`：必须输出的路径列表（文件或目录）
- `acceptance`：验收清单（checkbox 字符串数组，<=10）

### 强烈建议字段

- `deps`：依赖（任务 ID 或文件路径）
- `risk`：`low|med|high`
- `validators`：要跑的校验器列表（映射到 `/tools/validate_*` 或 runner 内置）
- `scope_guard`：范围门禁（冻结目录、禁止改 schema、禁止跨模块等）
- `context_policy`：上下文策略（是否仅喂 index、最大输入字节数等）

### 可选字段

- `branch`：要运行的 git 分支
- `timeout_sec`：执行超时
- `artifacts`：产物归档（build、截图、报告）
- `regen_pack`：若上次失败，写死重生成要点（也可放正文 review_notes）

------

## 1.2 枚举定义

### `type` 枚举

```
UI | ENV | CHAR | VFX | EVENT | TEXT | CODE | TOOL | QA | PMO | CR
```

### `status` 枚举（状态机）

```
DRAFT | READY | IN_PROGRESS | REVIEW | QA | DONE | ROLLBACK | BLOCKED
```

> 说明：

- `BLOCKED` 用于 deps 不满足或等待 CR 审批
- `ROLLBACK` 表示本次执行失败并回退，需要人修 Task Pack 或 REGEN

------

## 1.3 YAML 示例（标准形态）

```
---
id: T-UI-0001
type: UI
level: L2
status: READY
risk: med

owner: L2_UI_LEAD
executor: L3_UI_ENGINEER
reviewer: [L2_UI_LEAD, L2_QA_LEAD]

budget: "3-6"
deps: ["T-0206", "T-0401"]

allowed_inputs:
  - /docs/02_specs/ui/ui_flow_spec.md
  - /docs/02_specs/ui/ui_components_spec.md
  - /docs/01_bibles/art_bible.md

deliverables:
  - /src/ui/WBP_Dialogue.uasset
  - /src/ui/WBP_Choice.uasset
  - /src/ui/UIBindings.md

acceptance:
  - "对话文本可显示"
  - "选项列表可显示且<=3项"
  - "点击选项有回调与日志"
  - "状态切换有UI_STATE日志"
  - "未修改冻结目录"

validators:
  - validate_repo_scope
  - validate_ui_assets   # 如果此任务涉及资源引用
  - smoke_m1_ui          # 可选

scope_guard:
  forbid_write_paths:
    - /docs/00_charter/
    - /docs/01_bibles/
    - /docs/02_specs/systems/
  forbid_new_schema_fields: true
  forbid_cross_module_changes: true

context_policy:
  max_input_files: 3
  max_input_bytes: 60000
  prefer_index_files: true
  allowed_sections:
    - "## [TASK_CANDIDATES]"
    - "## Fields"
---
```

------

## 1.4 Runner 必须做的 YAML 校验规则（硬门禁）

- `allowed_inputs` 为空 → 直接 `BLOCKED`
- `deliverables` 为空 → 直接 `BLOCKED`
- `acceptance` > 10 条 → runner 自动要求拆任务（置 `BLOCKED` 并写建议）
- `type=CODE|UI` 且 `risk=high` → 强制要求 reviewer 包含 `L2_CLIENT_LEAD` 或对应 lead
- `scope_guard.forbid_write_paths` 缺失 → runner 追加默认冻结目录门禁
- `deps` 未满足 → `BLOCKED`（并写明未满足项）

------

# 2) Runner 设计（模块划分 + CLI + 函数级伪代码）

> Runner 的定位：**笨但硬**。
> 它不“理解项目”，只执行状态机、最小上下文、调用 Cursor CLI、跑校验器、写审计日志。

## 2.1 目录结构建议

```
/runner/
  main.py
  config.yaml
  /lib/
    taskpack.py          # 解析 YAML + 正文
    state_store.py       # sqlite/json 存储
    deps.py              # 依赖检查
    context_builder.py   # 最小上下文组装（含 index 截取）
    executor_cursor.py   # Cursor CLI 适配器
    validators.py        # 调用 /tools/validate_* 与内置门禁
    git_ops.py           # 分支/提交/差异/回滚
    logging_ops.py       # runlog/review_notes/rollback_log
    issue_ops.py         # 可选：GitHub issue 更新（不强制）
```

## 2.2 状态存储：SQLite（推荐）或 JSON（轻量）

### SQLite 表设计（最小够用）

**表：tasks**

- `id TEXT PRIMARY KEY`
- `status TEXT`
- `type TEXT`
- `level TEXT`
- `owner TEXT`
- `executor TEXT`
- `risk TEXT`
- `budget TEXT`
- `deps_json TEXT`
- `allowed_inputs_json TEXT`
- `deliverables_json TEXT`
- `reviewer_json TEXT`
- `last_run_id TEXT`
- `updated_at INTEGER`

**表：runs**

- `run_id TEXT PRIMARY KEY`
- `task_id TEXT`
- `status_before TEXT`
- `status_after TEXT`
- `started_at INTEGER`
- `finished_at INTEGER`
- `executor TEXT`
- `inputs_fingerprint TEXT`（输入文件 hash 列表）
- `outputs_changed_json TEXT`（git diff 文件列表）
- `validator_report_json TEXT`
- `runlog_path TEXT`

> 如果你嫌 SQLite 麻烦，先用 `tasks.json + runs.jsonl` 也行，但 SQLite 更稳、可查询、好可视化。

------

## 2.3 CLI 命令设计（n8n 调用就靠这些）

- `runner scan --json`
- `runner run <TASK_ID> --json`
- `runner approve <TASK_ID> --json`
- `runner reject <TASK_ID> --tag <FAIL_TAG> --note "<short>" --json`
- `runner resume --max <N> --json`（可选：自动跑 N 个低风险任务）
- `runner status --json`（输出全局统计：各状态数量、阻塞原因）

------

## 2.4 核心流程伪代码（函数级）

### 2.4.1 scan：找 READY 且 deps 满足的任务

```
def scan_ready_tasks() -> list[dict]:
    task_ids = list_taskpacks_in_repo("/docs/03_taskpacks")
    tasks = []
    for tid in task_ids:
        tp = load_taskpack(tid)
        sync_task_to_store(tp)

        if tp.status != "READY":
            continue

        ok, reason = check_deps(tp)
        if not ok:
            set_status(tp.id, "BLOCKED", reason=reason)
            continue

        ok2, reason2 = validate_taskpack_schema(tp)
        if not ok2:
            set_status(tp.id, "BLOCKED", reason=reason2)
            continue

        tasks.append(to_summary(tp))
    return tasks
```

### 2.4.2 run：执行一次任务（核心）

```
def run_task(task_id: str) -> dict:
    tp = load_taskpack(task_id)

    # gate 1: status & deps
    if tp.status != "READY":
        return {"ok": False, "reason": f"status_not_ready:{tp.status}"}

    ok, reason = check_deps(tp)
    if not ok:
        set_status(tp.id, "BLOCKED", reason=reason)
        return {"ok": False, "reason": reason}

    # gate 2: schema
    ok2, reason2 = validate_taskpack_schema(tp)
    if not ok2:
        set_status(tp.id, "BLOCKED", reason=reason2)
        return {"ok": False, "reason": reason2}

    # transition -> IN_PROGRESS
    run_id = new_run_id(tp.id)
    set_status(tp.id, "IN_PROGRESS", run_id=run_id)

    # build minimal context
    ctx = build_min_context(tp)  # reads allowed_inputs (maybe index slices)
    inputs_fp = fingerprint_inputs(tp.allowed_inputs)

    # execute via Cursor CLI adapter
    exec_result = cursor_execute(tp, ctx)

    # run validators (scope guard + tools validators)
    val_report = run_validators(tp)

    # collect git diff outputs
    changed = git_changed_files()

    # decide status_after
    if exec_result.ok and val_report.ok and check_acceptance_self(tp, exec_result):
        status_after = "REVIEW"
    else:
        status_after = "ROLLBACK"
        maybe_git_revert(changed)  # 可配置：失败是否自动回滚工作区

    # write logs
    runlog_path = write_runlog(tp, run_id, ctx, exec_result, val_report, changed, inputs_fp)
    update_run_record(run_id, tp.id, status_after, inputs_fp, changed, val_report, runlog_path)

    set_status(tp.id, status_after, run_id=run_id)
    return {"ok": True, "task_id": tp.id, "run_id": run_id, "status_after": status_after, "runlog": runlog_path}
```

### 2.4.3 approve / reject：人工闸门

```
def approve_task(task_id: str) -> dict:
    tp = load_taskpack(task_id)
    if tp.status != "REVIEW":
        return {"ok": False, "reason": "not_in_review"}

    # 可选：进入QA列而不是直接DONE
    if tp.type in ("CODE", "UI", "EVENT") and "QA" in required_flow(tp):
        set_status(tp.id, "QA")
        return {"ok": True, "status_after": "QA"}

    set_status(tp.id, "DONE")
    return {"ok": True, "status_after": "DONE"}

def reject_task(task_id: str, tag: str, note: str) -> dict:
    tp = load_taskpack(task_id)
    if tp.status not in ("REVIEW", "QA"):
        return {"ok": False, "reason": "not_rejectable"}

    # 写 review_notes + regen pack skeleton
    path = write_review_notes(tp, fail_tag=tag, note=note)

    # 回到READY（或BLOCKED，取决于你希望必须先改TaskPack）
    set_status(tp.id, "READY")
    return {"ok": True, "status_after": "READY", "review_notes": path}
```

------

## 2.5 Cursor CLI 适配层（关键：隔离不确定性）

你现在最强 agent 在 Cursor，但 Cursor CLI 能做什么取决于你环境。Runner 不应该绑定具体命令，而是抽象接口：

```
class CursorExecutor:
    def execute(self, taskpack_id: str, ctx: str, files: list[str], deliverables: list[str]) -> ExecResult:
        """
        ctx: 最小上下文（TaskPack正文 + 允许输入片段 + 输出模板）
        files: runner可选传给cursor的文件列表（如果CLI支持）
        deliverables: 输出路径（用于检查是否产出）
        """
```

**最小可行实现**：

- runner 把 `ctx` 写到临时文件 `tmp/ctx_T-xxxx.md`
- 调用 cursor CLI：`cursor --apply tmp/ctx...`（具体命令你用 Cursor 自己查/适配）
- 执行后 runner 用 git diff + deliverables 存在性判断“是否产出”

> 关键：runner 只负责“是否按规范产出”，不负责“内容是否好”，内容好坏留给 REVIEW 人工闸门。

------

## 2.6 Validators（把“规则”变成机器门禁）

建议内置 3 个必跑门禁（不依赖项目特性）：

1. `validate_repo_scope`：检查是否改了冻结目录（charter/bibles/systems spec 等）
2. `validate_allowed_inputs_only`：检查改动是否集中在 deliverables 或允许模块（粗粒度）
3. `validate_output_paths_exist`：deliverables 必须生成/更新

再叠加你已有的工具校验器：

- `validate_events_schema.py`
- `validate_events_semantic.py`
- `validate_text.py`
- `validate_ui_assets.py`
- `validate_env_assets.py`
- `validate_char_frames.py`

------

# 3) n8n Workflow：节点清单 + 输入/输出 JSON 约定

> n8n 只做三件事：**调 runner、分支、等待审批**。
> 逻辑尽量薄，避免把“工程规则”塞进 n8n。

## 3.1 Workflow A：`Pipeline-Main`（主流水线）

### Node A1：Trigger（Cron）

**输出**（n8n 内部，无需约定）

------

### Node A2：Run Scan（Execute Command）

- 命令：`runner scan --json`
- **输出 JSON**（runner 必须返回这种结构）

```
{
  "ok": true,
  "ready": [
    {
      "id": "T-UI-0001",
      "type": "UI",
      "risk": "med",
      "level": "L2",
      "owner": "L2_UI_LEAD",
      "executor": "L3_UI_ENGINEER",
      "reviewer": ["L2_UI_LEAD", "L2_QA_LEAD"],
      "budget": "3-6",
      "deps_ok": true
    }
  ],
  "blocked": [
    {
      "id": "T-CODE-1005",
      "reason": "deps_missing:T-0403"
    }
  ],
  "stats": {
    "READY": 12, "IN_PROGRESS": 0, "REVIEW": 3, "QA": 1, "DONE": 20, "ROLLBACK": 2, "BLOCKED": 5
  }
}
```

------

### Node A3：Pick Next Task（Function）

输入：A2 输出
输出（挑一个 task）：

```
{
  "picked": {
    "id": "T-UI-0001",
    "type": "UI",
    "risk": "med",
    "budget": "3-6"
  }
}
```

> 策略建议（写在这个函数里）：

- 先跑 `risk=low` 且 `type in [TEXT, EVENT, TOOL]`
- 若 picked.type in [CODE, UI]，确保当前 IN_PROGRESS 的 CODE/UI 数量 < 2（避免集成炸）

------

### Node A4：Run Task（Execute Command）

命令：`runner run {{$json.picked.id}} --json`
**输出 JSON**：

```
{
  "ok": true,
  "task_id": "T-UI-0001",
  "run_id": "RUN-T-UI-0001-20251229-001",
  "status_after": "REVIEW",
  "runlog": "/docs/05_logs/runlog_T-UI-0001_20251229.md",
  "changed_files": [
    "/src/ui/WBP_Dialogue.uasset",
    "/src/ui/UIBindings.md"
  ],
  "validator_report": {
    "ok": true,
    "items": [
      {"name": "validate_repo_scope", "ok": true},
      {"name": "validate_output_paths_exist", "ok": true}
    ]
  }
}
```

------

### Node A5：IF（status_after == REVIEW ?）

- true → 审批流
- false → 失败流（ROLLBACK）

------

## 3.2 Workflow B：`Pipeline-Approval`（审批与恢复）

### Node B1：Wait For Approval（Webhook + UI表单）

你可以做两个 webhook：

- `/approve` body：`{ "task_id": "...", "decision": "approve" }`
- `/reject` body：`{ "task_id": "...", "decision": "reject", "tag": "...", "note": "..." }`

------

### Node B2：Approve Handler（Execute Command）

命令：`runner approve {{$json.task_id}} --json`
输出：

```
{"ok": true, "task_id": "T-UI-0001", "status_after": "QA"}
```

------

### Node B3：Reject Handler（Execute Command）

命令：`runner reject {{$json.task_id}} --tag {{$json.tag}} --note "{{$json.note}}" --json`
输出：

```
{"ok": true, "task_id": "T-UI-0001", "status_after": "READY", "review_notes": "/docs/05_logs/review_notes_T-UI-0001.md"}
```

------

## 3.3 Workflow C：`Pipeline-QA`（可选：QA 列自动跑）

当任务进入 `QA`，n8n 可以自动触发：

- `runner run T-QA-xxxx`（冒烟/回归任务本身也是 Task Pack）
- 或 runner 在 approve 时自动创建 QA 子任务（更复杂，后面再做）

------

# 4) 把“你之前的全部体系”如何嵌进去（对齐点清单）

你担心：之前那么多岗位/工序卡/门禁，会不会散？不会。把它们挂到这三个锚点就行：

1. **任务来源**：只从 `/docs/03_taskpacks/` 取
2. **规则落地**：scope_guard + validators（机器门禁）
3. **质量闭环**：REVIEW/QA 闸门 + review_notes（Fail Tags + REGEN PACK）

这样你就实现了：

- 不靠长对话
- 不中断也能跑
- 可视化看进度
- 你随时一脚刹车，改文档，再继续

------

# 5) 你接下来让 Cursor 做什么（最少手工的生成顺序）

按这个顺序让 Cursor 生成，成功率最高：

1. **生成 Task Pack YAML 解析器 + schema 校验**（taskpack.py）
2. **生成 state_store（SQLite）**（state_store.py）
3. **生成 validators 框架（先做3个内置门禁）**
4. **生成 executor_cursor 适配层（先占位命令 + git diff 判断）**
5. **生成 runner CLI（scan/run/approve/reject）**
6. **最后做 n8n workflow JSON（main + approval）**

> 你先在本地用 `runner run T-xxxx` 跑通，再接 n8n。
> 这样不会把排错成本放到编排层。

------

如果你愿意，我下一条可以再往前推进一步：
把 **“Task Pack Auto-Generator（从 Spec 的 [TASK_CANDIDATES] 表自动生成 Task Packs）”** 的规则和伪代码也补齐，这样你后面基本不需要手写派单包了，PMO/AI 就能批量产出 READY 队列。



##### 你说：

继续



###### ChatGPT 说：

好，继续把 **Task Pack 自动生成器（Auto-Generator）**补齐到“你丢给 Cursor 就能直接写程序”的规格级：

- 输入：Spec/Bible 里的 `[TASK_CANDIDATES]` 表（你前面定义的结构化区块）
- 输出：一批 `/docs/03_taskpacks/*.md`（带 YAML frontmatter + 正文骨架）
- 同时解决：**编号、拆分、依赖、默认门禁、默认校验器、生成后如何进入 READY 队列**
- 并把它接入你那条 **n8n→runner→Cursor CLI** 的流水线。

------

# 1) Auto-Generator 的定位与工作模式

## 1.1 定位

Auto-Generator 是 PMO 的“拆单工厂”，它不执行任务，只做三件事：

1. 从 Spec/Bible 抽取结构化任务行
2. 生成 Task Pack 文件（初稿）
3. 做粒度拆分与默认门禁注入（保证稳定）

## 1.2 两种运行模式（推荐默认先用安全模式）

- **安全模式（默认）**：生成出来的 Task Pack 状态为 `DRAFT`，需要你或 L2 组长一键“Promote to READY”
  - 目的：避免自动生成错误任务直接进入执行队列
- **自动模式**：生成后直接 `READY`（只建议对低风险 TEXT/EVENT/TOOL 且 spec 非常硬的情况下使用）

------

# 2) 输入规范：Spec/Bible 的结构化区块（你已经有，但这里钉死解析规则）

Auto-Generator **只允许**解析以下区块（全文其它内容不读，避免漂移）：

## 2.1 `[TASK_CANDIDATES]` 表（派单源）

强制格式（Markdown 表格）：

```
## [TASK_CANDIDATES]
| WorkID | Type | OwnerRole | ExecutorRole | AllowedInputs | Deliverables | Acceptance | Constraints | DependsOn | Risk | Validators |
| ... |
```

### 字段解释（必须）

- `WorkID`：稳定短名，例如 `UI_DIALOGUE_PROTOTYPE`
- `Type`：UI/ENV/CHAR/VFX/EVENT/TEXT/CODE/TOOL/QA/CR
- `OwnerRole`：如 `L2_UI_LEAD`
- `ExecutorRole`：如 `L3_UI_ENGINEER`
- `AllowedInputs`：分号分隔的 repo 路径列表（**最多建议 3 条**）
- `Deliverables`：分号分隔路径
- `Acceptance`：分号分隔的验收点（<=10）
- `Constraints`：分号分隔硬约束（包含粒度上限）
- `DependsOn`：任务 ID 或文件路径（分号分隔）
- `Risk`：low/med/high
- `Validators`：validate_xxx（分号分隔）

> 你要“有限上下文稳定输出”，靠的就是把 AllowedInputs/Deliverables/Acceptance/Constraints 写死。

## 2.2 `[CHANGE_REQUEST_CANDIDATES]` 表（CR源）

```
## [CHANGE_REQUEST_CANDIDATES]
| CRID | Target | Change | Compatibility | TestsRequired | OwnerRole |
| ... |
```

Auto-Generator 遇到这类行，生成 Type=CR 的 Task Pack（状态 DRAFT），并标记为 BLOCKED（等待你批准）。

------

# 3) 输出规范：Task Pack 文件结构（YAML + 正文骨架）

Auto-Generator 对每一行候选生成一个 Task Pack 文件，默认正文用“工序卡骨架”，让 L2 组长后续只补细节而不是从零写。

## 3.1 文件命名规则

```
/docs/03_taskpacks/T-<TYPE>-<NNNN>_<WorkID>.md
```

- `<TYPE>`：UI/ENV/CHAR/VFX/EVENT/TEXT/CODE/TOOL/QA/CR
- `<NNNN>`：4 位顺序号（按 type 分段或全局都可）
- `<WorkID>`：原样保留，便于溯源

例如：`T-UI-0007_UI_DIALOGUE_PROTOTYPE.md`

## 3.2 YAML frontmatter 自动填充规则

从表格字段映射：

- `id`：按命名生成（例如 `T-UI-0007`）
- `type/level/status/risk/owner/executor/reviewer/budget/deps/allowed_inputs/deliverables/acceptance/validators`
- `scope_guard`：自动注入默认冻结目录 + 类型特定门禁（见第 5 节）
- `context_policy`：默认注入（max_input_files=3，prefer_index_files=true）

------

# 4) 粒度拆分（Auto-Splitter）：自动把“大任务”拆成模型稳定粒度

这是你最关键的诉求之一：**不要让任务长到执行时必幻觉**。

## 4.1 拆分触发条件（从候选行或推断得出）

Auto-Generator 在生成前先评估：

- `Deliverables` 文件数 > 6
- `Acceptance` 条目 > 10
- `AllowedInputs` > 3
- Type=EVENT 且描述事件数 > 8（如果 WorkID 或 Constraints 标注了数量）
- Type=CHAR 且包含多个动作（Constraints 里出现 `actions=idle,run,...`）
- Type=UI 且 Constraints 未给 `states<=6` 或明确超过
- Type=CODE 且标注 `pr_lines>400` 或 risk=high

触发则自动拆分为一组子 Task Packs，并把原任务变成 “父任务”（可选）：父任务只做汇总与验收。

## 4.2 拆分模板（固定，保证一致性）

- **UI**：`PROTOTYPE → ASSET_REQ → GEN_ASSETS(batch) → STANDARDIZE → INTEGRATE → QA`
- **ENV**：`BLOCKOUT → ASSET_REQ → TILES → PROPS → FG → INTEGRATE → QA`
- **CHAR**：`SPEC → CONCEPT → 3VIEW → ANIM_SPEC → FRAMES(action) → ATLAS_META → INTEGRATE → QA`
- **EVENT**：`PLAN → GEN(batch1) → GEN(batch2) → CHOICE → RESULTS → BRANCH_AUDIT → SEMANTIC_VALIDATE → TRACE_SMOKE`
- **CODE**：`INTERFACE_STUB → IMPLEMENT → GUARD → INTEGRATE → SMOKE_HOOK`
- **TOOL**：`VALIDATOR(schema) → VALIDATOR(semantic) → CI_GATE`
- **TEXT**：`STYLE → SCENE_PACKS(batch) → TEXT_INDEX → TEXT_VALIDATE → UI_RENDER_CHECK`
- **VFX**：`SPEC → PLACEHOLDER → FRAMES(effect) → STANDARDIZE → INTEGRATE → QA`

> 你会发现：这正好就是你之前定义的“工序卡族”，现在让机器自动生成出来。

------

# 5) 默认门禁注入（Scope Guard & Validators Injection）

为了防止执行岗越权，Auto-Generator 必须自动把门禁写进 YAML：

## 5.1 默认冻结目录（所有任务通用）

```
scope_guard:
  forbid_write_paths:
    - /docs/00_charter/
    - /docs/01_bibles/
```

## 5.2 类型特定门禁（自动加）

- **CODE/UI**：禁止跨模块改动（粗粒度：改动路径必须在 `/src/<module>/`）
- **EVENT**：禁止新增 schema 字段（除非 type=CR 已批准）
- **TEXT**：必须先通过 `validate_text` / `build_text_index`
- **ASSET（UI/ENV/CHAR/VFX）**：必须通过命名/尺寸校验器 + manifest 必填字段

## 5.3 默认校验器（如果候选行没填 Validators）

- CODE/UI：`validate_repo_scope`, `validate_output_paths_exist`
- EVENT：`validate_events_schema`, `validate_events_semantic`
- TEXT：`validate_text`, `build_text_index`
- CHAR：`validate_char_frames`
- ENV：`validate_env_assets`
- VFX：`validate_vfx_manifest`（你可以先占位，后续实现）

------

# 6) Auto-Generator 的程序规格（伪代码到函数级）

下面这部分你直接让 Cursor 按规格实现即可。

## 6.1 CLI 设计

- `runner gen --sources /docs/01_bibles,/docs/02_specs --mode safe --json`
- `runner promote --task T-UI-0007 --to READY --json`
- `runner gen --only-type TEXT --mode auto --json`（可选：只生成某类）

> 我建议把 generator 集成到 runner 里（一个二进制/脚本搞定），n8n 只需要调用 runner。

## 6.2 核心伪代码

### 6.2.1 扫描 sources，提取 TASK_CANDIDATES 表

```
def extract_task_candidates(sources: list[str]) -> list[CandidateRow]:
    files = list_markdown_files(sources)
    rows = []
    for f in files:
        block = find_section_block(f, "## [TASK_CANDIDATES]")
        if not block:
            continue
        table = parse_markdown_table(block)
        for r in table.rows:
            rows.append(CandidateRow.from_dict(r, source_file=f))
    return rows
```

### 6.2.2 规范化行数据（分号分隔→数组）

```
def normalize_candidate(row: CandidateRow) -> Candidate:
    return Candidate(
        work_id=row.WorkID.strip(),
        type=row.Type.strip().upper(),
        owner=row.OwnerRole.strip(),
        executor=row.ExecutorRole.strip(),
        allowed_inputs=split_semicolon_paths(row.AllowedInputs),
        deliverables=split_semicolon_paths(row.Deliverables),
        acceptance=split_semicolon_list(row.Acceptance),
        constraints=split_semicolon_list(row.Constraints),
        deps=split_semicolon_list(row.DependsOn),
        risk=(row.Risk or "med").lower(),
        validators=split_semicolon_list(row.Validators),
        source=row.source_file
    )
```

### 6.2.3 粒度评估与拆分

```
def split_if_needed(c: Candidate) -> list[Candidate]:
    if not is_too_big(c):
        return [c]
    # 根据 type 走固定拆分模板
    return apply_split_template(c.type, c)
```

`is_too_big` 参考第 4 节触发条件。

### 6.2.4 分配任务 ID 与文件名（可重复执行不产生重复）

```
def allocate_task_id(type_: str, work_id: str, existing_index: dict) -> str:
    # existing_index: { (type, work_id) -> id } 从 repo 已有 taskpack 推断
    key = (type_, work_id)
    if key in existing_index:
        return existing_index[key]

    next_num = next_sequence_for_type(type_, existing_index)  # e.g. UI -> 0008
    return f"T-{type_}-{next_num:04d}"
```

### 6.2.5 生成 Task Pack Markdown（YAML + 正文骨架）

```
def render_taskpack_md(task_id: str, c: Candidate, mode: str) -> str:
    status = "DRAFT" if mode == "safe" else "READY"
    yaml = {
      "id": task_id,
      "type": c.type,
      "level": infer_level(c),
      "status": status,
      "risk": c.risk,
      "owner": c.owner,
      "executor": c.executor,
      "reviewer": infer_reviewer_list(c),
      "budget": infer_budget(c),
      "deps": c.deps,
      "allowed_inputs": clamp(c.allowed_inputs, 3),
      "deliverables": c.deliverables,
      "acceptance": clamp(c.acceptance, 10),
      "validators": default_validators_if_empty(c),
      "scope_guard": build_scope_guard(c),
      "context_policy": default_context_policy()
    }
    body = build_body_skeleton(c)  # Outcome/Steps/Checklist/REGEN PACK
    return frontmatter(yaml) + "\n" + body
```

### 6.2.6 写文件与输出清单（给 n8n/看板用）

```
def generate_taskpacks(sources, mode) -> dict:
    candidates = extract_task_candidates(sources)
    norm = [normalize_candidate(r) for r in candidates]
    expanded = flatten([split_if_needed(c) for c in norm])

    existing = index_existing_taskpacks("/docs/03_taskpacks")
    written = []
    for c in expanded:
        tid = allocate_task_id(c.type, c.work_id, existing)
        path = make_taskpack_path(tid, c.work_id)
        if file_exists(path) and is_same_source(path, c.source):
            continue  # 幂等：避免重复写
        write_file(path, render_taskpack_md(tid, c, mode))
        written.append({"id": tid, "path": path, "source": c.source, "status": ("DRAFT" if mode=="safe" else "READY")})

    return {"ok": True, "generated": written, "count": len(written)}
```

------

# 7) 把 Auto-Generator 接进 n8n（让流水线“自我补货”）

你现有主流程是：scan→pick→run→review→approve/reject。
现在加一个“补货”步骤在最前面：

## 7.1 n8n 主流程加两个节点

### Node 0：Generate Task Packs（Execute Command）

- 命令：`runner gen --sources /docs/01_bibles,/docs/02_specs --mode safe --json`
- 输出：`generated[]` 列表（用于通知你“新增了多少 DRAFT”）

### Node 0.5：Promote Drafts（可选人工闸门）

你可以做两种方式：

- **严格方式**：n8n 把 `generated` 发你，等你手动把关键任务 promote 到 READY
- **折中方式**：对 `risk=low & type in [TEXT, EVENT, TOOL]` 自动 promote，其它保留 DRAFT

对应命令：

- `runner promote --task T-TEXT-0012 --to READY`

> 这样流水线实现了“自动补货 + 人工把关”，不会断粮，也不会乱跑。

------

# 8) 你日常的操作变成什么样（几乎不动手）

你每天只干 4 件事：

1. 在 Spec/Bible 里补 `[TASK_CANDIDATES]` 表（或让 AI 总监补）
2. 看 n8n 提醒：新生成了多少 DRAFT
3. 点 2–3 个关键任务 promote 到 READY（或用规则自动 promote 低风险任务）
4. 在 REVIEW 阶段 approve/reject（写 Fail Tags + REGEN PACK）

其余都自动跑：生成→执行→校验→挂起等待审批→继续。

------

# 9) 你现在遇到的“上下文拉满”问题怎么被机制解决

- 不再有“无限 continue 的长对话”
- 每个执行任务都是一次短调用：Task Pack + 允许输入（<=3）
- 失败时不补上下文，只改 Task Pack（更硬约束）或 REGEN PACK
- 进度在 n8n/看板里，不在对话里

token 的价值会直接回升，因为你把模型从“理解整项目”变成“执行一张工序卡”。

------

如果你愿意把落地再推进一步，我建议下一轮我直接给你一份**“最小可运行 runner 工程脚手架清单”**：

- 需要哪些文件、每个文件有哪些类/函数、每个函数的输入输出、以及最小实现优先级（先跑通，再完善）。
  你再丢给 Cursor，基本一次就能把工程生成出来。



##### 你说：

继续



###### ChatGPT 说：

好，下面给你一份**“最小可运行 runner 工程脚手架（Scaffold Spec）”**：你把它丢给 Cursor，让它按这个规格直接生成项目代码即可。目标是 **P0 当天跑通端到端**（scan→run→REVIEW→approve/reject），然后再逐步补全 Cursor CLI 适配、自动拆单、n8n 接入。

我会按 **文件清单 → 每个文件做什么 → 关键函数签名 → P0/P1/P2/P3 里程碑** 来写。

------

# 0) 你要生成的工程放哪

建议直接放在 repo 里：

```
remark/
  runner/
    main.py
    config.yaml
    requirements.txt
    README.md
    lib/
      __init__.py
      taskpack.py
      md_table.py
      state_store.py
      deps.py
      context_builder.py
      executor_base.py
      executor_cursor.py
      validators.py
      git_ops.py
      logging_ops.py
      utils.py
```

语言默认 **Python**（因为校验器/脚本生态顺，接 n8n 也简单）。

------

# 1) P0 必须跑通的最小功能（当天可用）

**P0 目标：**

- 能解析 Task Pack（YAML frontmatter）
- 能维护状态（SQLite 或 JSON）
- 能执行任务（先用 dummy executor，修改/创建一个文件模拟交付）
- 能跑内置门禁（冻结目录/产物存在）
- 能写 runlog
- 能把任务送到 REVIEW 并支持 approve/reject

> P0 不要求真的调用 Cursor CLI。先把“状态机 + 工件闭环”跑通，避免你把排错成本放到 Cursor 或 n8n 上。

------

# 2) runner CLI 规格（必须实现）

`runner/main.py` 提供这些命令（参数保持稳定，方便 n8n 调用）：

- `python -m runner.main scan --json`
- `python -m runner.main run T-UI-0001 --json`
- `python -m runner.main approve T-UI-0001 --json`
- `python -m runner.main reject T-UI-0001 --tag SPEC_VIOLATION --note "xxx" --json`
- `python -m runner.main status --json`
- `python -m runner.main gen --sources docs/01_bibles docs/02_specs --mode safe --json`（P2 才需要）
- `python -m runner.main promote T-UI-0001 --to READY --json`（P2）

所有命令输出统一 JSON 结构：`{ ok: bool, ... }`

------

# 3) 文件级规格（你让 Cursor 按这个生成）

## 3.1 `runner/config.yaml`

用途：集中配置 repo 根目录、冻结目录、默认校验器、状态库路径、Cursor CLI 命令模板等。

```
repo_root: ".."
taskpacks_dir: "docs/03_taskpacks"
logs_dir: "docs/05_logs"
state_db: "runner/state.db"

frozen_write_paths:
  - "docs/00_charter"
  - "docs/01_bibles"

default_context_policy:
  max_input_files: 3
  max_input_bytes: 60000
  prefer_index_files: true

executors:
  default: "dummy"          # P0
  cursor:                   # P1
    cmd: "cursor"           # 具体命令你后面按实际改
    args: ["--apply", "{ctx_file}"]
```

------

## 3.2 `runner/lib/taskpack.py`

职责：读取 Task Pack markdown，解析 YAML frontmatter + 正文。

### 数据结构

```
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class TaskPack:
    id: str
    type: str
    level: str
    status: str
    risk: str
    owner: str
    executor: str
    reviewer: List[str]
    budget: str
    deps: List[str]
    allowed_inputs: List[str]
    deliverables: List[str]
    acceptance: List[str]
    validators: List[str]
    scope_guard: Dict[str, Any]
    context_policy: Dict[str, Any]
    source_path: str
    body_md: str
```

### 必须实现的函数

```
def load_taskpack(repo_root: str, path: str) -> TaskPack: ...
def save_taskpack_status(repo_root: str, path: str, new_status: str) -> None: ...
def list_taskpack_paths(repo_root: str, taskpacks_dir: str) -> List[str]: ...
def validate_taskpack_schema(tp: TaskPack) -> tuple[bool, str]: ...
```

> `save_taskpack_status` 需要只改 YAML 里的 `status:`，不要破坏正文。

------

## 3.3 `runner/lib/state_store.py`

职责：保存任务状态与运行记录（建议 SQLite）。

### 必须实现

```
class StateStore:
    def __init__(self, db_path: str): ...
    def init_db(self) -> None: ...
    def upsert_task(self, tp: TaskPack) -> None: ...
    def set_status(self, task_id: str, status: str, reason: str = "", run_id: str = "") -> None: ...
    def get_status_counts(self) -> dict: ...
    def record_run(self, run: dict) -> None: ...
    def get_block_reason(self, task_id: str) -> str: ...
```

SQLite 表你可以按我之前给的 `tasks/runs` 最小版来做。

------

## 3.4 `runner/lib/deps.py`

职责：检查依赖是否满足（任务 ID 依赖 or 文件路径依赖）。

### 规则（P0 简化版）

- dep 如果像 `T-XXX-0001` → 依赖该任务必须 `DONE`
- dep 如果是路径 → 该文件必须存在（相对 repo_root）

### 必须实现

```
def check_deps(repo_root: str, store: StateStore, tp: TaskPack) -> tuple[bool, str]: ...
```

------

## 3.5 `runner/lib/context_builder.py`

职责：把“最小上下文包”组装成一个临时 ctx 文件，供 executor 使用。

### P0 简化策略

- 读取 tp.body_md
- 读取 allowed_inputs（最多 3 个文件，超出截断并写 warning）
- 拼成 `tmp/ctx_<taskid>.md`
- 记录输入 fingerprint（sha256）

### 必须实现

```
def build_min_context(repo_root: str, tp: TaskPack) -> dict:
    """
    return {
      "ctx_file": "runner/tmp/ctx_T-xxx.md",
      "inputs_fp": {"path": "sha256...", ...},
      "warnings": [...]
    }
    """
```

------

## 3.6 `runner/lib/executor_base.py`

```
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class ExecResult:
    ok: bool
    summary: str
    changed_files: List[str]
    receipt: str
    error: str = ""

class ExecutorBase:
    def execute(self, repo_root: str, tp: TaskPack, ctx: dict) -> ExecResult:
        raise NotImplementedError
```

------

## 3.7 `runner/lib/executor_cursor.py`（P1 才真正用）

职责：调用 Cursor CLI。

### P1 先做“壳”，支持配置命令模板

```
class CursorExecutor(ExecutorBase):
    def __init__(self, cmd: str, args: list[str]): ...
    def execute(self, repo_root: str, tp: TaskPack, ctx: dict) -> ExecResult:
        # 1) 执行 cmd + args（用 ctx_file 替换占位符）
        # 2) 执行后用 git diff 收集 changed_files
```

> 你实际 Cursor CLI 参数怎么写，后面你在本机确定后改 config.yaml 即可。

------

## 3.8 `runner/lib/validators.py`

职责：跑门禁与校验器。

### P0 必跑内置 3 个门禁

1. `validate_repo_scope`：冻结目录不得被修改
2. `validate_output_paths_exist`：deliverables 必须存在/被更新
3. `validate_allowed_inputs_only`（P0 可不做细，只做冻结目录+deliverables就够）

### 必须实现

```
def run_validators(repo_root: str, tp: TaskPack) -> dict:
    """
    return {
      "ok": True/False,
      "items": [{"name": "...", "ok": bool, "detail": "..."}]
    }
    """
```

额外：如果 tp.validators 里包含 `validate_text` 这类，就调用 `/tools/validate_text.py`（用 subprocess）。

------

## 3.9 `runner/lib/git_ops.py`

职责：收集变更、可选回滚。

P0 只需两个函数：

```
def git_changed_files(repo_root: str) -> list[str]: ...
def git_has_changes(repo_root: str) -> bool: ...
```

> P0 不做自动 revert，避免误伤。失败时只标记 ROLLBACK，让你人工看 diff 决定。

------

## 3.10 `runner/lib/logging_ops.py`

职责：写 runlog / review_notes。

必须实现：

```
def write_runlog(repo_root: str, logs_dir: str, tp: TaskPack, run_result: dict) -> str: ...
def write_review_notes(repo_root: str, logs_dir: str, tp: TaskPack, tag: str, note: str) -> str: ...
```

runlog 建议包含：

- task_id/run_id
- ctx_file 路径
- 输入 fingerprint 列表
- 输出文件列表
- 校验器结果
- changed_files
- 建议下一步（如进入 REVIEW）

------

## 3.11 `runner/lib/md_table.py`（P2 用）

职责：解析 Markdown 表格（用于 `[TASK_CANDIDATES]`）。

P2 才实现也行，但最好先建壳：

```
def extract_section(md_text: str, header: str) -> str: ...
def parse_markdown_table(table_md: str) -> list[dict]: ...
```

------

## 3.12 `runner/main.py`（核心 orchestrator）

你让 Cursor 按下面逻辑写。

### scan 命令逻辑

- 遍历 taskpacks_dir
- load_taskpack
- store.upsert_task
- 如果 READY：
  - check_deps；不满足→BLOCKED
  - schema校验；不通过→BLOCKED
  - 满足→加入 ready 列表
- 输出 JSON：ready/blocked/stats

### run 命令逻辑

- 状态必须 READY
- deps 必须满足
- set IN_PROGRESS
- build_min_context
- executor.execute
- run_validators
- 如果 exec ok 且 validators ok → set REVIEW
- 否则 set ROLLBACK
- write_runlog
- 输出 JSON：status_after/runlog/changed_files/validator_report

### approve/reject

- approve：REVIEW→QA 或 DONE（你先简单：直接 DONE）
- reject：写 review_notes，REVIEW→READY

------

# 4) P0→P3 里程碑（按这个顺序做，最稳）

## P0（当天）

- TaskPack 解析 + SQLite 状态库
- scan/run/approve/reject
- dummy executor：简单写一个 deliverable 文件模拟交付（便于验证流水线）
- 内置门禁：冻结目录没改 + deliverables 存在
- runlog/review_notes 生成

> 你用 P0 先验证：**不靠对话也能推进，且可随时打断恢复。**

## P1（1–2天）

- executor_cursor：真正调用 Cursor CLI
- git_changed_files 用真实 git diff
- 增加 validators：调用 tools 校验器

## P2（2–4天）

- gen/promote：从 `[TASK_CANDIDATES]` 自动生成 Task Packs（safe 模式 DRAFT）
- promote：挑低风险自动 READY
- 自动拆分（Split templates）先做 UI/EVENT/TEXT 三类就够

## P3（接 n8n）

- n8n 主流程：cron→scan→pick→run→wait approval→approve/reject
- 通知：把 runlog 路径发给你
- 可选：同步 GitHub Project 看板（后面再做）

------

# 5) n8n 最小节点清单（你可以直接照这个搭）

先别搞复杂，**n8n 只负责调 runner + 审批闸门**。

### Workflow: Pipeline-Main

1. Cron Trigger（每 5 分钟）
2. Execute Command：`python -m runner.main scan --json`
3. Function：pick first task（或按 risk/type 策略）
4. Execute Command：`python -m runner.main run {{$json.picked.id}} --json`
5. IF：status_after == "REVIEW"
6. Webhook Wait（你点 approve/reject）
7. Execute Command：
   - approve：`python -m runner.main approve {{$json.task_id}} --json`
   - reject：`python -m runner.main reject {{$json.task_id}} --tag {{$json.tag}} --note "{{$json.note}}" --json`

------

# 6) 你现在最该让 Cursor 先生成哪三个文件（最小闭环）

如果你希望“一次生成就能跑”，让 Cursor 先做这三个（其余可以逐步补）：

1. `taskpack.py`（解析 YAML + 修改 status）
2. `state_store.py`（SQLite）
3. `main.py`（scan/run/approve/reject + runlog）

然后用 dummy executor 验证通路。通了再上 cursor executor。

------

# 7) 你下一条可以直接复制给 Cursor 的“生成指令”（建议）

你可以给 Cursor 一段非常硬的需求（示例）：

- 目标：按 `runner scaffold spec` 生成 Python 工程
- 必须实现命令：scan/run/approve/reject/status
- 输出 JSON 格式固定
- P0 用 dummy executor 写 deliverables 占位文件
- runlog/review_notes 写到指定目录
- 不要引入外部依赖（除非 pyyaml，最好也不用：可自己解析 frontmatter）

------

