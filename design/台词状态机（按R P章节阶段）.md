1. ## 0) 系统补丁键包（建议加入 SYS_ 前缀）

   这些键主要用于“授权/领取/章节结算”等高频短句，你前一版词库里偏抽象字段语法，少了这类“流程落地句”。

   ```
   SYS_AUTH_01 授权已下发。
   SYS_AUTH_02 能力：深度感知（只读）。
   SYS_AUTH_03 能力：深度介入（写入）。
   SYS_AUTH_04 能力：时间干预 已上线。
   SYS_AUTH_05 权限收紧。
   SYS_AUTH_06 写入权限：待审。
   SYS_AUTH_07 任务已领取。
   SYS_AUTH_08 手续完成。
   SYS_AUTH_09 通行证已生效。
   SYS_AUTH_10 版本已锁定。
   SYS_AUTH_11 异常已确认。
   SYS_AUTH_12 异常已记录。
   SYS_AUTH_13 进入封锁区。
   SYS_AUTH_14 离开封锁区。
   SYS_AUTH_15 节点卡：已生成。
   SYS_AUTH_16 节点卡：已更新。
   SYS_AUTH_17 回执：已生成。
   SYS_AUTH_18 备注：已附。
   ```

   ------

   # 1) 台词状态机（按 R/P/阶段）v1

   ## 1.1 全局变量与阶段定义

   你已经在脚本里隐含了这些旗标，我这里只把它们规范化成“状态机输入”。

   - `R`：无收益残差（玩家“多余行为”的积累）
   - `P`：观察者压力（介入/回溯/审计覆盖造成的承载负担）
   - `TONE_SYS`：系统语气等级（决定系统提示从自然语言→字段表）

   ### 章节阶段（推荐直接用章节做默认值）

   - `STAGE_0`：C0–C1（生活+小异常）
   - `STAGE_1`：C2（只读深度）
   - `STAGE_2`：C3（写入介入）
   - `STAGE_3`：C4（时间回溯）
   - `STAGE_4`：C5（审计覆盖/F21）
   - `STAGE_5`：CF（字段定义/对视）

   ### 系统语气等级（TONE_SYS）切换规则

   - `TONE_SYS=0`：默认（SYS_BASE 为主）
   - `TONE_SYS=1`：出现“已更正/已对齐”（SYS_ALIGN 为主）
     - 条件：`FLAG_DEPTH_SENSE_UNLOCKED=true` 或首次出现 “已更正”
   - `TONE_SYS=2`：出现“归档/结算/不可归因”（SYS_ARCHIVE + SYS_INTERVENT + SYS_TIME）
     - 条件：`FLAG_DEPTH_INTERVENTION_UNLOCKED=true` 或 `FLAG_TIME_INTERVENTION_UNLOCKED=true`
   - `TONE_SYS=3`：出现“审计遮罩/字段空白/降阶/模型判词”（SYS_AUDIT + SYS_VERDICT）
     - 条件：进入 C5-Z6 或触发 `FLAG_F21_TRIGGERED` 或进入 CF

   > 实现上：你可以用“章节默认 + 关键Zone强制覆盖”，避免玩家乱序导致语气跳变。

   ------

   ## 1.2 R/P 分段（用于替换台词池频率）

   ### R 分段（建议）

   - `R0`：0–2（玩家还在“按流程活”）
   - `R1`：3–7（开始会做少量无收益行为）
   - `R2`：8–12（无收益成为一种习惯）
   - `R3`：13+（“多余者”稳定成型，可触发终局阈值）

   ### P 分段（建议）

   - `P0`：0–2（稳定）
   - `P1`：3–6（压力可感）
   - `P2`：7+（出现卡顿、错位、更多自我纠偏语句）

   ------

   ## 1.3 角色台词池选择规则

   ### 岑回（玩家）

   - Zone类型=生活：优先 `CENHUI_MONO`，少量 `CENHUI_NOTE`
   - Zone类型=异常（只读深度）：优先 `CENHUI_NOTE` + 少量 `CENHUI_MONO`
   - Zone类型=介入/回溯：优先 `CENHUI_INTERV`；若 `P>=P1` 加入压力句（“别回…”“墙没恢复”）
   - Zone类型=无收益仪式：当 `R>=R1` 才开始频繁用 `CENHUI_RICH`
   - 终局：强制 `CENHUI_FINAL`

   ### 顾临

   - 默认 `GULIN_FLOW / GULIN_GUIDE`
   - 当 `P>=P1` 或进入 C4-Z8 / C5：用 `GULIN_CONFLICT`
   - 当 `P>=P2` 或 `FLAG_F21_TRIGGERED`：插入 `GULIN_STRESS`（带“……”卡顿）
   - 终局尾声：`GULIN_FINAL / GULIN_END_*`

   ### 宋岚

   - 默认 `SONGLAN_BASE / SONGLAN_TASK`
   - 版本冲突区（C5-Z1）强制 `SONGLAN_CONFLICT`
   - 终局：`SONGLAN_FINAL`

   ### 许澄

   - 默认 `XUCHENG_SOFT / XUCHENG_MED`
   - 出现编号/节点呼应时：`XUCHENG_FORMAT`
   - 疗程抉择：`XUCHENG_TREAT`
   - 终局：`XUCHENG_FINAL`

   ### 阿棠

   - 默认 `ATANG_BASE`（短、跳）
   - 补丁/对账场景：`ATANG_PATCH`
   - 无收益小请求：`ATANG_RICH`
   - 终局：`ATANG_FINAL`

   ### 牧平

   - 默认 `MUPING_BASE`
   - 回溯章节（C4）多用 `MUPING_WARN`
   - C5 预言链用 `MUPING_PROPHECY`
   - 终局用 `MUPING_FINAL`

   ### 栖蓝

   - 默认 `QILAN_BASE / QILAN_TASK`
   - 椅子消失与对抗更正：`QILAN_CONFLICT`
   - 终局：`QILAN_FINAL`

   ### 系统

   - 按 `TONE_SYS` 选择集合：
     - 0：SYS_BASE + SYS_AUTH
     - 1：SYS_ALIGN + SYS_BASE
     - 2：SYS_ARCHIVE + SYS_INTERVENT + SYS_TIME
     - 3：SYS_AUDIT + SYS_VERDICT（并允许少量 SYS_ARCHIVE）

   ------

   ## 1.4 防重复与冷却（强烈建议）

   - 每个角色维护一个 `last_keys[actor]` 队列（长度 6–10）
   - 抽取台词时：
     - 优先避开最近出现过的 key
     - 同一交互事件不要连续两句同一语气组（例如系统别连刷 3 条字段句）
   - 同一Zone里：
     - 玩家内心 ≤ 4句（除终章）
     - 系统提示 ≤ 6句（除审计覆盖/终章）
     - NPC对话每次交互 ≤ 2句

   ------

   # 2) 对白分配表（按 Zone）v1

   说明：我用统一模板写，便于你直接拆到配置里。

   模板字段：

   - **进入**：触发（OnEnter）
   - **交互**：点击/长按/选择
   - **系统**：提示/结算
   - **条件替换**：R/P/旗标影响
   - **备注**：实现注意点（避免过密）

   ------

   ## C0 序章

   ### C0-Z1 宿舍走廊

   - 进入（OnEnter）
     - `CENHUI_MONO_01`（默认）
     - 若玩家首次游玩也可随机：`CENHUI_MONO_03 / CENHUI_MONO_05`
   - 身份卡长按（OnInspect）
     - 玩家：`CENHUI_MONO_09`（“我来过这里吗？”）或 `CENHUI_MONO_03`
   - 公告板闪“已更正”（OnNoticeFlash）
     - 系统：`SYS_ALIGN_02`（更正已应用）或 `SYS_BASE_07`（状态：正常（已更正））
   - 出门结算（OnExit）
     - 系统：`SYS_AUTH_07`（任务已领取）可留到Z4；这里用
     - `SYS_BASE_10`（目标：完成） + `SYS_BASE_05`（路线：既定）

   ------

   ### C0-Z2 早餐小店

   - 进入
     - NPC店主：`NPC_SHOP_01`
     - 玩家内心（可选）：`CENHUI_MONO_05`
   - 选择“固定套餐”
     - 店主：`NPC_SHOP_02`
     - 系统结算：`SYS_BASE_11`（任务：继续）
   - 选择“今日特别”（等待）
     - 店主：`NPC_SHOP_03` + `NPC_SHOP_04`
     - 栖蓝路过一句（路过触发）：`QILAN_BASE_05`
     - 系统结算：`SYS_VERDICT_01`（结算：无可用收益）
   - 条件替换
     - 若玩家选择今日特别：后续“无收益行为”提示频率 +10%（你内部不必明示）

   ------

   ### C0-Z3 薄墙巷口

   - 进入
     - 玩家：`CENHUI_MONO_08`
   - 长按薄墙（首次）
     - 玩家：`CENHUI_MONO_10`
     - 系统：`SYS_BASE_06` → 0.2秒后闪 `SYS_BASE_07`
   - 拾取钉子（收起）
     - 玩家：`CENHUI_NOTE_06`
   - 结算
     - 若调查薄墙：`SYS_AUTH_12`（异常已记录）
     - 否则：`SYS_BASE_11`

   ------

   ### C0-Z4 维修局前台

   - 进入
     - 前台：`NPC_TECH_01`（也可做成“请出示证件”）
   - 顾临对话（固定开场）
     - `GULIN_FLOW_01`
     - `GULIN_FLOW_04`
     - `GULIN_FLOW_12`
   - 玩家回应三选一（口头）
     - 顺从：`CENHUI_SAY_01`
     - 指日期不对：`CENHUI_SAY_03`
     - 指薄墙空：`CENHUI_SAY_02`
   - 顾临回应（按选项）
     - 对2/3：`GULIN_FLOW_02` + `GULIN_FLOW_05` + `GULIN_FLOW_06`
   - 领取任务单结算
     - 系统：`SYS_AUTH_07`

   ------

   ## C1 第1章

   ### C1-Z1 市政办事厅

   - 进入
     - 市政职员：`NPC_CITY_01`
     - 系统（取号后）：`SYS_AUTH_08`（手续完成）可放窗口通过后
   - 填表自动更正（OnAutoCorrect）
     - 市政：`NPC_CITY_04`
     - 系统：`SYS_ALIGN_02`（更正已应用）
   - 帮助老人（可选无收益）
     - 老人（建议新增一句，不用单独建NPC库也行）：
       - 可直接用 `NPC_RESIDENT_05`（“他们说从来没有”）
     - 系统结算：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_AUTH_09`（通行证已生效）

   ------

   ### C1-Z2 错门走廊

   - 进入
     - 玩家：`CENHUI_NOTE_01`
   - 观察脚印/通风口
     - 玩家：`CENHUI_NOTE_02 / CENHUI_NOTE_03`
   - 走错送回（轻惩罚）
     - 系统：`SYS_BASE_09`（建议：撤离）或更轻：`SYS_BASE_08`
   - 结算
     - 系统：`SYS_AUTH_12`

   ------

   ### C1-Z3 旧地图摊（宋岚初登）

   - 进入
     - 宋岚：`SONGLAN_BASE_04`（地图不卖，记录才卖）
     - 接着：`SONGLAN_BASE_03`
   - 玩家选项：想知道哪里不对
     - 玩家：`CENHUI_SAY_02`
     - 宋岚：`SONGLAN_BASE_06` + `SONGLAN_TASK_01`
   - 接“记录差异”任务完成回执
     - 宋岚：`SONGLAN_TASK_09`（奖励没有）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C1-Z4 诊疗台候诊区（问卷）

   - 进入
     - 许澄：`XUCHENG_SOFT_01` + `XUCHENG_SOFT_02`
   - 问卷结论（固定“稳定”）
     - 系统：`SYS_BASE_06`
     - 随后闪：`SYS_ALIGN_01`
   - 阿棠远处一句
     - `ATANG_BASE_02`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C1-Z5 礼堂街夜谈（牧平）

   - 进入
     - 牧平：`MUPING_BASE_01` + `MUPING_BASE_06`
   - 玩家提薄墙空
     - 玩家：`CENHUI_SAY_03`
     - 牧平：`MUPING_BASE_09` + `MUPING_BASE_10`
   - 留下听完（无收益）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C1-Z6 边缘断口小坍塌

   - 进入封锁区
     - 系统：`SYS_AUTH_13`
     - 顾临远程：`GULIN_FLOW_03` + `GULIN_FLOW_02`
   - 标注三点
     - 每次：`SYS_BASE_01`
     - 第三次后：`SYS_BASE_04`
   - 额外备注门影（无收益偏硬）
     - 系统回执：`SYS_AUTH_18` + 轻闪 `SYS_ARCHIVE_08`
   - 结算
     - 系统：`SYS_AUTH_12` + `SYS_AUTH_14`

   ------

   ## C2 第2章（只读深度）

   ### C2-Z1 校准室解锁深度感知

   - 进入
     - 顾临：`GULIN_GUIDE_01` + `GULIN_GUIDE_02`
   - 教学浮层（UI提示）
     - 系统：`SYS_AUTH_01` + `SYS_AUTH_02`
   - A/B/C样本标注
     - 系统：`SYS_BASE_01`
   - 授权结算
     - 系统：`SYS_AUTH_01` + `SYS_AUTH_02`

   ------

   ### C2-Z2 薄墙巷口重访

   - 进入
     - 玩家：`CENHUI_MONO_10`
   - 深度视野确认空腔
     - 玩家：`CENHUI_NOTE_11`（“不存在也有边界”）
   - 系统否认+更正闪
     - `SYS_BASE_06` → `SYS_BASE_07`
   - 结算
     - 系统：`SYS_AUTH_11`

   ------

   ### C2-Z3 折叠楼梯间（深度解谜）

   - 进入
     - 宋岚：`SONGLAN_BASE_02`
   - 关键引导
     - 宋岚：`SONGLAN_BASE_01`（别信路标，信脚印）
     - 玩家：`CENHUI_NOTE_13`
   - 踩空送回
     - 系统：`SYS_BASE_08`
     - 玩家（可选）：`CENHUI_MONO_04`
   - 提交差异（无奖励）
     - 宋岚：`SONGLAN_TASK_10`（但抹掉会更难）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C2-Z4 栖蓝修补摊（路标）

   - 进入
     - 栖蓝：`QILAN_BASE_01` + `QILAN_BASE_02`
   - 玩家选项“为什么要做这种事”
     - 栖蓝：`QILAN_BASE_03` + `QILAN_BASE_04`
   - 完成修补结算（必须无收益）
     - 系统：`SYS_VERDICT_01`
     - 玩家（若R>=R1）：`CENHUI_RICH_10`
   - 结算
     - 系统：`SYS_VERDICT_01`

   ------

   ### C2-Z5 诊疗台：阿棠碎片日记1

   - 进入
     - 阿棠：`ATANG_BASE_01`
   - 她抛出“别去断口”
     - `ATANG_BASE_04` + `ATANG_BASE_05`
   - 许澄安抚
     - `XUCHENG_SOFT_03` + `XUCHENG_SOFT_04`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C2-Z6 礼堂街：祷文抄本2

   - 进入
     - 牧平：`MUPING_BASE_03` + `MUPING_BASE_04`
   - 玩家追问（无收益）
     - 牧平：`MUPING_WARN_10`
     - 系统：`SYS_VERDICT_01`（不必每次都弹，可在结算卡上体现）
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C2-Z7 不存在的房间（只可看见）

   - 进入
     - 玩家：`CENHUI_MONO_15`
   - 系统否认
     - `SYS_ARCHIVE_??` 这里用：`SYS_BASE_08` + `SYS_BASE_06`（对象不存在建议忽略）
     - 更硬一点可用：`SYS_BASE_08` + `SYS_VERDICT_03`（该行为无法纳入当前模型）但建议留到C4-Z6以后再强
   - 玩家尝试“进入”被拦
     - 系统：`SYS_BASE_08` + `SYS_BASE_12`
   - 结算
     - 系统：`SYS_AUTH_12`

   ------

   ## C3 第3章（写入介入）

   > 下面开始系统语气默认进入 `TONE_SYS=2`（归档/结算/不可回滚）。

   ### C3-Z1 例外许可签发（解锁介入）

   - 顾临开场
     - `GULIN_GUIDE_03`（写入是债）
     - `GULIN_GUIDE_04`
   - 玩家三选回应（口头）
     - `CENHUI_SAY_04 / CENHUI_SAY_06 / CENHUI_SAY_08`
   - 顾临回应（按“救援优先”选项）
     - `GULIN_GUIDE_13`（我不想看到删选项）可留后；这里用
     - `GULIN_GUIDE_10`（代价会累积）
   - 授权结算
     - 系统：`SYS_AUTH_03`

   ------

   ### C3-Z2 不存在的房间（可进入）救援

   - 进入门影
     - 系统：`SYS_BASE_08`（建议忽略）
     - 玩家：`CENHUI_INTERV_01`
   - 选择解法A（绕行）完成后
     - 系统：`SYS_ARCHIVE_03`（救援已登记）
   - 选择解法B（介入）完成后
     - 系统：`SYS_ARCHIVE_04`（救援无法归档）
     - 并追加：`SYS_ARCHIVE_08`（字段补全失败）轻闪
     - 玩家（可选）：`CENHUI_INTERV_07`
   - 陈匠对话（进入内部）
     - `CHENJIANG_BASE_02` + `CHENJIANG_BASE_03`
     - `CHENJIANG_BASE_04`
   - 撤离
     - 若介入：系统：`SYS_INTERVENT_06`（不可回滚）
   - 结算
     - 系统：`SYS_ARCHIVE_03` 或 `SYS_ARCHIVE_04`（分支）

   ------

   ### C3-Z3 宋岚版本库

   - 宋岚开场（若玩家救人）
     - `SONGLAN_CONFLICT_11` + `SONGLAN_CONFLICT_12`
   - 提交差异
     - 系统：`SYS_ARCHIVE_05`（条目：不可归档）
     - 宋岚：`SONGLAN_TASK_10`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C3-Z4 栖蓝空椅

   - 栖蓝开场
     - `QILAN_BASE_06` + `QILAN_BASE_07`
   - 玩家问“有用吗”
     - 栖蓝：`QILAN_CONFLICT_11`（没用不是事实）可放后；这里用
     - `QILAN_BASE_03` + `QILAN_BASE_04`
   - 完成结算（必须）
     - 系统：`SYS_VERDICT_01`
   - 若玩家有旧灯芯点灯
     - 玩家：`CENHUI_RICH_04`
     - 系统仍：`SYS_VERDICT_01`（不要给奖励）
   - 结算
     - 系统：`SYS_VERDICT_01`

   ------

   ### C3-Z5 许澄病例卡1

   - 许澄问诊
     - `XUCHENG_MED_01` + `XUCHENG_MED_04`
   - 她提“写进来就难擦掉”
     - `XUCHENG_SOFT_15` 或 `XUCHENG_MED_06`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C3-Z6 礼堂街：写入与墨

   - 牧平
     - `MUPING_BASE_03` + `MUPING_BASE_04`
     - `MUPING_WARN_01`（救人/改路都在写）
   - 可选摆椅（无收益）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C3-Z7 断裂走廊（后果展示）

   - 进入
     - 玩家：`CENHUI_INTERV_10`（我回来了，但世界没回）
   - 若玩家选择再介入加固
     - 系统：`SYS_INTERVENT_08`（结构负担上升）
     - 玩家：`CENHUI_INTERV_08`
   - 若选择只读通过
     - 系统：`SYS_BASE_11`
   - 结算
     - 系统：`SYS_AUTH_12`

   ------

   ## C4 第4章（时间回溯）

   > 默认 `TONE_SYS=2` 且系统大量使用 `SYS_TIME` / `SYS_INTERVENT` / `SYS_ARCHIVE`。

   ### C4-Z1 灾后生活区重访

   - 住户互斥
     - `NPC_RESIDENT_01` + `NPC_RESIDENT_02`
   - 玩家内心
     - `CENHUI_MONO_12` 或 `CENHUI_MONO_09`
   - 帮忙归整（无收益）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C4-Z2 时间节点界面上线（演示回溯）

   - 顾临
     - `GULIN_GUIDE_06` + `GULIN_GUIDE_07`
   - 教学浮层
     - 系统：`SYS_AUTH_04` + `SYS_TIME_01`
   - 螺丝掉落→回溯确认
     - 系统：`SYS_TIME_06` + `SYS_TIME_07`
   - 回溯完成
     - 系统：`SYS_TIME_09` + `SYS_INTERVENT_11`
   - 结算
     - 系统：`SYS_AUTH_04`

   ------

   ### C4-Z3 必须回溯事件（阈值门）

   - 首次失败
     - 系统：`SYS_TIME_10` + `SYS_TIME_11`
   - 回溯后成功
     - 系统：`SYS_TIME_09` + `SYS_INTERVENT_11`
   - 玩家压力句（P>=P1）
     - `CENHUI_INTERV_09` 或 `CENHUI_MONO_14`
   - 结算
     - 系统：`SYS_ARCHIVE_12`（解释成本上升）

   ------

   ### C4-Z4 病例卡2（格式恐惧）

   - 许澄
     - `XUCHENG_MED_05` + `XUCHENG_FORMAT_01`
   - 若玩家展示节点回执
     - `XUCHENG_FORMAT_02`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C4-Z5 阿棠碎片日记2（对账）

   - 阿棠
     - `ATANG_PATCH_04` + `ATANG_PATCH_05`
   - 她提“你回去过”
     - `ATANG_PATCH_07`
   - 塞回纸条（无收益）
     - 阿棠：`ATANG_RICH_01` + `ATANG_RICH_02`
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C4-Z6 栖蓝：无人需要的地图（模型词前奏）

   - 栖蓝
     - `QILAN_BASE_08` + `QILAN_BASE_09` + `QILAN_BASE_10`
   - 完成贴图结算（关键）
     - 系统：`SYS_VERDICT_01`
     - 0.5秒后淡出：`SYS_VERDICT_03`（该行为无法纳入当前模型）
   - 结算
     - 系统：`SYS_VERDICT_01`

   ------

   ### C4-Z7 礼堂街：折痕与更正

   - 牧平
     - `MUPING_BASE_11` + `MUPING_BASE_12`
     - `MUPING_BASE_14` + `MUPING_BASE_15`
   - 可选摆椅（无收益）
     - 系统：`SYS_VERDICT_01`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C4-Z8 市政环：权限收紧

   - 顾临开场
     - `GULIN_CONFLICT_05` + `GULIN_CONFLICT_06` + `GULIN_CONFLICT_08`
   - 玩家质问
     - `CENHUI_SAY_07`（我不接受这次更正）或 `CENHUI_SAY_03`
   - 顾临回应（P高时插卡顿）
     - 常态：`GULIN_CONFLICT_18`
     - 若 `P>=P2`：插 `GULIN_STRESS_01` 再接 `GULIN_STRESS_07`
   - 系统提示写入变灰
     - `SYS_AUTH_06`（写入权限：待审）
   - 结算
     - 系统：`SYS_AUTH_05`

   ------

   ## C5 第5章（审计覆盖 + F21）

   > 默认 `TONE_SYS=3` 在关键区启用，其他Zone可在 2↔3 之间切换。

   ### C5-Z1 版本冲突现场

   - 宋岚开场
     - `SONGLAN_CONFLICT_01` + `SONGLAN_CONFLICT_02` + `SONGLAN_CONFLICT_03`
   - 玩家问“能否都留下”
     - 玩家：`CENHUI_SAY_02`
     - 宋岚：`SONGLAN_CONFLICT_03`后接 `SONGLAN_CONFLICT_16`
   - 抄纪念墙（无收益）
     - 系统：`SYS_VERDICT_01`
     - 玩家（R>=R1）：`CENHUI_RICH_04` 或 `CENHUI_RICH_09`
   - 版本锁定
     - 系统：`SYS_AUTH_10`
     - 若选V-A：追加 `SYS_ALIGN_12`（条目可归档）
     - 若选V-B：追加 `SYS_ARCHIVE_12`（解释成本上升）

   ------

   ### C5-Z2 纠偏中心外围

   - 公告墙（队列）
     - 系统循环：`SYS_ALIGN_09` / `SYS_ALIGN_10` / `SYS_ALIGN_11`
   - 提交回执（半字段表）
     - 系统：`SYS_ALIGN_10` + `SYS_ARCHIVE_08`
   - 顾临对话
     - `GULIN_CONFLICT_01` + `GULIN_CONFLICT_02` + `GULIN_CONFLICT_04`
   - 结算
     - 系统：`SYS_ALIGN_10`

   ------

   ### C5-Z3 许澄疗程抉择

   - 许澄开场
     - `XUCHENG_TREAT_01` + `XUCHENG_TREAT_02`
   - 若玩家质问“帮谁”
     - `XUCHENG_TREAT_08`（你要承担后果）
   - 接受疗程
     - 系统：`SYS_ALIGN_01`（已对齐） + `SYS_ARCHIVE_12`（解释成本↓可用“上升”的反向文案；你也可以新增 `SYS_ARCHIVE_13 解释成本：下降`）
   - 拒绝疗程
     - 许澄：`XUCHENG_TREAT_03` + `XUCHENG_FINAL_01`
   - 结算
     - 系统：`SYS_AUTH_17`

   ------

   ### C5-Z4 牧平“页背风暴/删选项”

   - 牧平
     - `MUPING_PROPHECY_01` + `MUPING_PROPHECY_02`
     - 接 `MUPING_PROPHECY_04`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C5-Z5 栖蓝：空椅消失与占位

   - 发现椅子不见
     - 栖蓝：`QILAN_CONFLICT_01` + `QILAN_CONFLICT_02` + `QILAN_CONFLICT_03`
   - 系统否认
     - `SYS_BASE_08` + `SYS_VERDICT_03`（建议忽略 + 无法纳入模型）
   - 玩家坚持占位（无收益）
     - 栖蓝：`QILAN_CONFLICT_08` + `QILAN_CONFLICT_09`
     - 系统：`SYS_VERDICT_01`
   - 若 `R>=R2` 椅子短暂显影
     - 系统出现停顿：`SYS_AUDIT_04`（字段：＿）闪一下再 `SYS_ARCHIVE_07`（残差保留）
   - 结算
     - 系统：`SYS_VERDICT_01`

   ------

   ### C5-Z6 审计样式覆盖区（第三层显影）

   - 进入覆盖区闪遮罩
     - 系统（快速连播，0.8秒内）：
       - `SYS_AUDIT_01` / `SYS_AUDIT_02` / `SYS_AUDIT_03` / `SYS_AUDIT_04`
   - 三处字段异常点标注
     - 分别：`SYS_ARCHIVE_08` / `SYS_ARCHIVE_10` / `SYS_ARCHIVE_07`
   - 点击陌生节点卡
     - 系统：`SYS_TIME_12`
   - 离开时冗余提示条残留（2秒不可关）
     - 系统：`SYS_AUDIT_10`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### C5-Z7 F21 判词落地（无收益微任务）

   - 完成微任务A/B/C（任意达阈值）后
     - 系统（结算卡）：`SYS_VERDICT_02`
     - 下方小字淡出：`SYS_VERDICT_04`
   - 栖蓝一句（可选）
     - `QILAN_FINAL_01`
   - 玩家内心（强建议只给一句）
     - `CENHUI_FINAL_01` 或 `CENHUI_FINAL_02`
   - 结算
     - 系统：`SYS_VERDICT_02`

   ------

   ## CF 终章（字段定义/对视）

   ### CF-Z1 冗余字段区（F22正式）

   - 进入遮罩
     - 系统快速：`SYS_AUDIT_02` + `SYS_AUDIT_04` + `SYS_ARCHIVE_07`
   - 底部冗余字段条出现（不可关）
     - 系统：`SYS_AUDIT_04` + `SYS_AUDIT_10`
   - 三点标注
     - `SYS_ARCHIVE_08` / `SYS_ARCHIVE_10` / `SYS_ARCHIVE_06`
   - 结算
     - 系统：`SYS_BASE_11`

   ------

   ### CF-Z2 最后的无收益仪式（任选）

   - 栖蓝引导（若走仪式①）
     - `QILAN_FINAL_02` + `QILAN_FINAL_03`
   - 宋岚引导（若走仪式②）
     - `SONGLAN_FINAL_03` + `SONGLAN_FINAL_04`
   - 陈匠残响（若走仪式③，可做成道具触发语音）
     - `CHENJIANG_FINAL_01` + `CHENJIANG_FINAL_02`
   - 完成后系统
     - `SYS_VERDICT_05`（条目不可结算已保留）
     - 字段条更新提示可用：`SYS_AUDIT_05`
   - 玩家内心（R>=R2更适配）
     - `CENHUI_RICH_04` 或 `CENHUI_RICH_07`
   - 结算
     - 系统：`SYS_VERDICT_05`

   ------

   ### CF-Z3 尺度失配：字段定义与接受

   - 进入判定
     - 系统：`SYS_AUDIT_02` + `SYS_ARCHIVE_11` + `SYS_AUDIT_05`
   - 玩家点击字段条（交互提示）
     - 系统：`SYS_VERDICT_04`
   - 点刻度点回弹（演出）
     - 不用句子，建议只用轻音效+轻闪 `SYS_ALIGN_02`（更正已应用）来表现“回弹”
   - 第三次不回弹（字段接受）
     - 系统：`SYS_VERDICT_07`
     - 上方短闪：`SYS_VERDICT_08`（观测：反向）+ `SYS_AUDIT_03`（建议：降阶）可极短露一下
   - 玩家内心（只一句，避免过嗨）
     - `CENHUI_FINAL_10`（好。它接受了。）
   - 结算
     - 系统：`SYS_AUDIT_06`（字段：◦◦◦）

   ------

   ### CF-Z4 世界首次保存非最优解（F23回收）

   - 到达对应地点
     - 栖蓝：`QILAN_END_A_01`（或按结局分支）
   - 系统首次说“保留”（关键爽点）
     - `SYS_VERDICT_06`
   - 玩家内心
     - `CENHUI_MONO_12`（承认一次）或 `CENHUI_RICH_09`
   - 结算
     - 系统：`SYS_VERDICT_06`

   ------

   ### CF-Z5 三结局选择（A/B/C）

   - 面板提示（系统）
     - A按钮：`SYS_END_A_01`
     - B按钮：`SYS_END_B_01`
     - C按钮：`SYS_END_C_01`
   - 确认后
     - A：`SYS_END_04`
     - B：`SYS_END_05`
     - C：`SYS_END_06`
   - 玩家内心（按选择）
     - A：`CENHUI_FINAL_04`
     - B：`CENHUI_FINAL_05`
     - C：`CENHUI_FINAL_03`

   ------

   ### CF-Z6 尾声重访（六角色各一句）

   - 顾临
     - A/B/C：`GULIN_END_A_01 / GULIN_END_B_01 / GULIN_END_C_01`
   - 宋岚
     - `SONGLAN_END_A_01 / SONGLAN_END_B_01 / SONGLAN_END_C_01`
   - 许澄
     - `XUCHENG_END_A_01 / XUCHENG_END_B_01 / XUCHENG_END_C_01`
   - 牧平
     - `MUPING_END_A_01 / MUPING_END_B_01 / MUPING_END_C_01`
   - 阿棠
     - 这里你前面词库是“终局态”更多，我建议尾声固定用：
       - `ATANG_FINAL_03`（仍漂但不全是错）或按结局差异再补键也行
   - 栖蓝
     - `QILAN_END_A_01 / QILAN_END_B_01 / QILAN_END_C_01`

   ------

   # 3) 你接下来最省力的落地方式

   如果你准备把这套东西直接“喂给实现”，我建议下一步输出其中一个（我可以继续做）：

   1. **台词配置 JSON 模板**（含：actor、event、keys、conditions、cooldown、weight）
   2. **全量 CSV**（每行一条：zone,event,actor,key,cond,weight,notes），直接导入表格/脚本
