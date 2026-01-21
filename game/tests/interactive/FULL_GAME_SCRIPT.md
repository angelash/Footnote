# 完整游戏操作流程剧本

本文档整理了《备注 / Footnote》游戏中所有场景的交互流程，按章节顺序排列。

---

## 符号说明

| 符号 | 含义 |
|------|------|
| **R+N** | R值（无收益残差）增加N |
| **P+N** | P值（观察者压力）增加N |
| **FLAG_XXX** | 游戏状态标志 |
| **CARD_XXX** | 获得的卡片 |
| **FXX** | 伏笔编号（F01-F26） |
| **gotoZone** | 场景跳转 |

---

## C0 序章

### C0-Z1 宿舍走廊
**场景描述**: 维修局新人宿舍的走廊，灯光昏暗。

**开场独白**:
- CENHUI_MONO_01 → CENHUI_MONO_02 → CENHUI_MONO_03
- 内容: "先按流程走。七点二十，出门前检查。身份卡、通讯器、维修工具包。"

**可交互对象**:

1. **身份卡** (identity_card)
   - 条件: 无
   - 动作: 获得卡片
   - 结果:
     - 获得卡片: `CARD_C0_IDENTITY`
     - 触发对话: IDENTITY_CARD_EXAMINE → IDENTITY_CARD_INFO

2. **公告板** (notice_board)
   - 条件: 无
   - 动作: 触发对话
   - 结果:
     - 对话内容: 公告板上贴满了通知，日期处有涂改痕迹
     - 选择分支:
       - 仔细查看: R+1, 触发伏笔 F02
       - 算了，不重要: 无效果

3. **储物柜** (storage_cabinet)
   - 条件: `FLAG_C0Z1_GOT_TOOLS = false`
   - 动作: 触发对话 C0Z1_STORAGE
   - 结果:
     - 对话摘要: "工具包已经准备好了。标准配置，和每天一样。早餐券也在这里……"
     - 获得卡片: `CARD_C0_MEAL_TICKET`
     - 设置FLAG: `FLAG_C0Z1_GOT_TOOLS = true`
   - 后续: 交互变为"已取过"状态

4. **储物柜（已取过）** (storage_cabinet_done)
   - 条件: `FLAG_C0Z1_GOT_TOOLS = true`
   - 动作: 触发对话 C0Z1_STORAGE_DONE
   - 结果:
     - 对话摘要: "工具包已经取过了。"

5. **邻居的门** (corridor_door)
   - 条件: 无
   - 动作: 触发对话
   - 结果:
     - 对话摘要: "邻居的门紧闭着，门上有一个褪色的号码牌。...103号？不对，我记得这里应该是102号。"

6. **出口** (exit_door)
   - 条件: 无
   - 动作: 跳转到 `C0-Z2`

---

### C0-Z2 早餐小店
**场景描述**: 早餐小店，无收益选择第一次出现。

**可交互对象**:

1. **菜单板** (menu_board)
   - 条件: 无
   - 动作: 触发对话 C0Z2_MENU
   - 结果:
     - 选择分支:
       - 固定套餐: 设置 `FLAG_C0Z2_ORDER_STANDARD = true`, 触发 C0Z2_ORDER_STANDARD
       - 今日特别: R+1, 设置 `FLAG_R_SOURCE_BREAKFAST = true`, 触发 C0Z2_ORDER_SPECIAL
     - 完成对话后: 设置 `FLAG_C0Z2_EATEN = true`

2. **靠窗座位** (seat_window)
   - 条件: 无
   - 动作: 触发对话 C0Z2_SEAT_WINDOW
   - 结果:
     - 对话摘要: "靠窗的位置，光线充足。适合快速用餐。"

3. **角落座位** (seat_corner)
   - 条件: 无
   - 动作: 触发对话 C0Z2_SEAT_CORNER
   - 结果:
     - 对话摘要: "角落的位置，旁边有一把空椅子。椅子很干净，有刚被擦拭的痕迹。但似乎没人会坐。"

4. **栖蓝路过** (qilan_trigger)
   - 条件: 无（触发区域）
   - 动作: 触发对话 C0Z2_QILAN_PASSBY
   - 结果:
     - 对话摘要: "没人坐的椅子，也得擦干净。"
     - 设置FLAG: `FLAG_MET_QILAN_C0 = true`

5. **出口** (exit_door)
   - 条件: 无
   - 动作: 跳转到 `C0-Z3`

---

### C0-Z3 薄墙巷口
**场景描述**: 两栋建筑之间的狭窄巷道。F01薄墙回声首次出现。

**可交互对象**:

1. **薄墙** (thin_wall)
   - 条件: 无
   - 动作: 触发对话 C0Z3_THIN_WALL
   - 结果:
     - 对话摘要: "一面薄墙。表面看起来正常。（可以长按仔细听听）"
   - 长按（1000ms）: 触发对话 C0Z3_WALL_ECHO
     - 结果:
       - 对话摘要: "低频回声在墙内回荡……里面是空的。不该是这样的。系统判定正常。"
       - 触发伏笔: F01 (plant)
       - 设置FLAG: `FLAG_HEARD_WALL_ECHO = true`
       - 获得卡片: `CARD_C0_ALLEY_RECORD`

2. **歪斜路标** (crooked_sign)
   - 条件: 无
   - 动作: 触发对话
   - 结果:
     - 对话摘要: "路标歪了。暂时不能修，不在任务范围内。"

3. **钉子** (wall_nail)
   - 条件: `FLAG_HAS_NAIL = false`
   - 动作: 触发对话 C0Z3_NAIL_PICKUP
   - 结果:
     - 选择分支:
       - 收起来: 设置 `FLAG_HAS_NAIL = true`, 获得卡片 `CARD_C0_NAIL`
       - 不需要: 无效果

4. **前往维修局** (exit_to_bureau)
   - 条件: 无
   - 动作: 跳转到 `C0-Z4`

5. **返回早餐店** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C0-Z2`

---

### C0-Z4 维修局前台
**场景描述**: 堆满旧文件的档案储存室。秩序语法第一次正面登场，顾临首次出场。

**可交互对象**:

1. **前台窗口** (reception_window)
   - 条件: 无
   - 动作: 触发对话 C0Z4_RECEPTION
   - 结果:
     - 对话摘要: "外勤报到？来领任务单。今天路线按既定走。任务单在任务板上。顾主管有话要说，去门口等一下。"
     - 设置FLAG: `FLAG_C0Z4_CHECKED_IN = true`

2. **任务板** (task_board)
   - 条件: 无
   - 动作: 触发对话 C0Z4_TASKBOARD
   - 结果:
     - 对话摘要: "巡检任务单。路线：既定路线A。要求：标注异常，无需处理。路线A下方有一行小字闪过：版本：A-1（更正）。"
     - 获得卡片: `CARD_C0_TASK_SHEET`
     - 触发伏笔: F03 (deepen)

3. **顾临办公室** (gulin_door)
   - 条件: 无
   - 动作: 触发对话 C0Z4_GULIN_TALK
   - 结果:
     - 对话摘要: "今天路线按既定走。能用流程解决的，就别用例外。城市不需要更多复杂度。"
     - 选择分支:
       - 明白: 触发 C0Z4_GULIN_OBEY
       - 昨晚公告板日期不对（需 `FLAG_SEEN_NOTICE`）: 触发 C0Z4_GULIN_DATE
       - 我听到墙里是空的（需 `FLAG_HEARD_WALL_ECHO`）: 触发 C0Z4_GULIN_WALL
     - 所有分支最终:
       - 设置FLAG: `FLAG_C0_TASK_RECEIVED = true`
       - 设置FLAG: `FLAG_C0_END = true`

4. **规章制度** (info_board)
   - 条件: 无
   - 动作: 触发对话
   - 结果:
     - 对话摘要: "维修局行为准则：1. 能用流程解决的，不用例外 2. 异常记录，等待指示 3. 复杂度是病，简洁是药"

5. **返回巷口** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C0-Z3`

6. **出发巡检** (exit_to_c1)
   - 条件: `FLAG_C0_TASK_RECEIVED = true`
   - 动作: 跳转到 `C1-Z1`

---

## C1 第一章

### C1-Z1 市政办事厅
**场景描述**: 维修局的行政办事大厅。格式与更正第一次更显眼。

**可交互对象**:

1. **取号机** (ticket_machine)
   - 条件: 无
   - 动作: 触发对话 C1Z1_TICKET_MACHINE
   - 结果:
     - 对话摘要: "请取号排队。您的号码是 A-047。预计等待时间：12分钟。"
     - 设置FLAG: `FLAG_C1Z1_GOT_TICKET = true`

2. **填表台** (form_desk)
   - 条件: 无
   - 动作: 触发对话 C1Z1_FORM_DESK
   - 结果:
     - 对话摘要: "通行证申请表……开始填写表格。"
     - 选择分支:
       - 填写"居住环": 触发 C1Z1_FORM_CORRECTED
       - 填写"外围区": 触发 C1Z1_FORM_CORRECTED
     - C1Z1_FORM_CORRECTED结果:
       - 对话摘要: "表格上的文字微微闪烁。等等，我刚才写的不是这个……居住区域：居住环（标准）。日期：（系统推荐日期）。它自己改了。"
       - 设置FLAG: `FLAG_C1Z1_FORM_FILLED = true`
       - 触发伏笔: F03 (deepen)

3. **服务窗口** (service_window)
   - 条件: 无
   - 动作: 触发对话 C1Z1_WINDOW
   - 结果:
     - 对话摘要: "下一位。表格和取号单。"
     - 选择分支:
       - 提交表格（需 `FLAG_C1Z1_FORM_FILLED`）: 触发 C1Z1_SUBMIT
       - 我还没填好: 触发 C1Z1_GO_FILL
     - C1Z1_SUBMIT结果:
       - 对话摘要: "格式正确。通行证将在3个工作周期内发放。"
       - 获得卡片: `CARD_C1_PERMIT`
       - 设置FLAG: `FLAG_C1Z1_PERMIT_OBTAINED = true`

4. **排队的老人** (elderly_person)
   - 条件: 无
   - 动作: 触发对话 C1Z1_ELDERLY
   - 结果:
     - 对话摘要: "年轻人……能帮我看看这表怎么填吗？我眼睛不好使了。"
     - 选择分支:
       - 帮他填表: R+1, 设置 `FLAG_HELPED_ELDER = true`, 触发 C1Z1_HELP_ELDER
       - 抱歉，我赶时间: 触发 C1Z1_REFUSE_ELDER

5. **离开** (exit_to_corridor)
   - 条件: `FLAG_C1Z1_PERMIT_OBTAINED = true`
   - 动作: 跳转到 `C1-Z2`

6. **返回** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C0-Z4`

---

### C1-Z2 错门走廊
**场景描述**: 结构异常（浅），门牌与空间逻辑不一致。

**可交互对象**:

1. **门牌17B** (door_17b)
   - 条件: 无
   - 动作: 触发对话 C1Z2_DOOR_17B
   - 结果:
     - 对话摘要: "17B……这应该是目标房间。（敲门）没有回应。"
     - 选择分支:
       - 试着推门: 触发 C1Z2_DOOR_17B_OPEN（发现是储物间，门牌错误）
       - 算了: 触发 C1Z2_DOOR_17B_LEAVE
     - 设置FLAG: `FLAG_C1Z2_CHECKED_17B = true`

2. **门牌19A** (door_19a)
   - 条件: 无
   - 动作: 触发对话 C1Z2_DOOR_19A
   - 结果:
     - 对话摘要: "19A……门牌编号和我要找的不一样。但是……地上的脚印，都指向这扇门。"
     - 选择分支:
       - 敲门（需 `FLAG_C1Z2_CHECKED_FOOTPRINTS`）: 触发 C1Z2_DOOR_19A_CORRECT
       - 先不敲: 触发 C1Z2_DOOR_19A_SKIP
     - C1Z2_DOOR_19A_CORRECT结果:
       - 对话摘要: "门开了。里面确实是你要找的地方。门牌是错的，但空间是对的。"
       - 获得卡片: `CARD_C1_CORRIDOR_NOTE`
       - 设置FLAG: `FLAG_C1Z2_SOLVED = true`
       - 触发伏笔: F02 (plant)

3. **脚印** (footprints)
   - 条件: 无
   - 动作: 触发对话 C1Z2_FOOTPRINTS
   - 结果:
     - 对话摘要: "地上有脚印……很多人走过的痕迹。它们都指向写着'19A'的那扇门。"
     - 设置FLAG: `FLAG_C1Z2_CHECKED_FOOTPRINTS = true`

4. **住户** (resident)
   - 条件: 无
   - 动作: 触发对话 C1Z2_RESIDENT
   - 结果:
     - 对话摘要: "你也在找门？门牌换过太多次了。谁都记不清了。"
     - 触发伏笔: F04 (plant)

5. **继续前进** (exit_forward)
   - 条件: `FLAG_C1Z2_SOLVED = true`
   - 动作: 跳转到 `C1-Z3`

6. **返回** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C1-Z1`

---

### C1-Z3 档案巷口旧地图摊
**场景描述**: 宋岚首次正式出场。

**可交互对象**:

1. **宋岚** (songlan)
   - 条件: 无
   - 动作: 触发对话 C1Z3_SONGLAN_TALK
   - 结果:
     - 对话摘要: "别信路标，信脚印。同一个地方，记两次。你看到的不是错，是版本差异。"
     - 选择分支:
       - 你在说什么？: 触发 C1Z3_SONGLAN_EXPLAIN（获得 `CARD_C1_VERSION_MAP_01`）
       - 我只是来买地图: 触发 C1Z3_SONGLAN_MAP（获得 `CARD_C1_VERSION_MAP_01`）
       - 我想知道哪里不对: 触发 C1Z3_SONGLAN_TRUTH
         - 选择分支:
           - 好，我记下来: R+1, 设置 `FLAG_C1Z3_RECORD_QUEST = true`, 触发 C1Z3_ACCEPT_QUEST（获得 `CARD_C1_VERSION_MAP_01`, 触发 F12）
           - 我没有时间做这个: 触发 C1Z3_REFUSE_QUEST（仍获得 `CARD_C1_VERSION_MAP_01`）

2. **旧地图** (old_maps)
   - 条件: 无
   - 动作: 触发对话 C1Z3_OLD_MAPS
   - 结果:
     - 对话摘要: "这些地图……同一个地方，为什么有这么多版本？街道的位置也会变？"

3. **记录本** (notebook)
   - 条件: 无
   - 动作: 触发对话 C1Z3_NOTEBOOK
   - 结果:
     - 对话摘要: "这是她的记录本……密密麻麻的字迹，记录着各种门牌、路标的变化。版本差异 ≠ 错误。差异 = 被改写的证据。"

4. **前往诊疗台** (exit_to_clinic)
   - 条件: 无
   - 动作: 跳转到 `C1-Z4`

5. **返回** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C1-Z2`

---

### C1-Z4 诊疗台候诊区
**场景描述**: 记忆一致性问卷 - 答案被抹平。

**可交互对象**:

1. **问卷台** (questionnaire_desk)
   - 条件: 无
   - 动作: 触发对话 C1Z4_QUESTIONNAIRE
   - 结果:
     - 对话摘要: "桌上放着一份问卷。「记忆一致性评估」"
     - 选择分支:
       - 开始填写: 触发问卷流程（Q1 → Q2 → Q3 → C1Z4_RESULT）
       - 先看看其他: 触发 C1Z4_SKIP
     - C1Z4_RESULT结果:
       - 对话摘要: "无论我怎么回答，结论都一样。状态稳定。无需干预。结论下方闪过一行小字：「已对齐」"
       - 获得卡片: `CARD_C1_QUESTIONNAIRE`
       - 设置FLAG: `FLAG_C1Z4_QUESTIONNAIRE_DONE = true`
       - 触发伏笔: F14 (plant)

2. **许澄** (xucheng)
   - 条件: 无
   - 动作: 触发对话 C1Z4_XUCHENG_TALK
   - 结果:
     - 对话摘要: "别强迫自己记住每一件事。我负责……帮助大家适应。不一致会让你很累。记忆和现实之间的不一致。别太在意。大多数人都会慢慢习惯的。"

3. **阿棠** (atang_distant)
   - 条件: 无
   - 动作: 触发对话 C1Z4_ATANG_BRIEF
   - 结果:
     - 对话摘要: "你刚刚是不是又走了一遍？"
     - 触发伏笔: F14 (deepen)

4. **离开诊所** (exit_forward)
   - 条件: `FLAG_C1Z4_QUESTIONNAIRE_DONE = true`
   - 动作: 跳转到 `C1-Z5`

5. **返回** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C1-Z3`

---

### C1-Z5 礼堂街夜谈
**场景描述**: 牧平首次出场 - 神话壳第一次成型。

**可交互对象**:

1. **牧平** (muping)
   - 条件: 无
   - 动作: 触发对话 C1Z5_MUPING_TALK
   - 结果:
     - 对话摘要: "纸页不恨你，它只会承受不住。别往一页纸上写太多。你以为你在找真相，其实你在加墨。"
     - 选择分支:
       - 你在暗示什么？: 触发 C1Z5_MUPING_HINT
         - 选择分支:
           - 留下听完: R+1, 设置 `FLAG_C1Z5_STAYED = true`, 触发 C1Z5_MUPING_FULL（获得 `CARD_C1_PRAYER_01`, 触发 F15）
           - 我该走了: 触发 C1Z5_MUPING_LEAVE
       - 我只是路过: 触发 C1Z5_MUPING_PASS
       - 我见过墙里是空的: 触发 C1Z5_MUPING_WALL（触发 F15）

2. **抄本** (prayer_note)
   - 条件: `FLAG_C1Z5_STAYED = true`
   - 动作: 获得卡片
   - 结果:
     - 获得卡片: `CARD_C1_PRAYER_01`

3. **前往边缘** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C1-Z6`

4. **返回** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C1-Z4`

---

### C1-Z6 边缘断口：小坍塌现场
**场景描述**: 结构异常引爆点 - 第1章高潮。

**可交互对象**:

1. **坍塌区域** (collapse_zone)
   - 条件: 无
   - 动作: 触发对话 C1Z6_COLLAPSE_INSPECT
   - 结果:
     - 对话摘要: "这里……发生了什么？地面出现了一个不规则的凹陷。不像是自然塌陷，更像是……被抽空了。边缘很整齐。太整齐了。"

2. **受灾住户** (affected_resident)
   - 条件: 无
   - 动作: 触发对话 C1Z6_RESIDENT
   - 结果:
     - 对话摘要: "我的房子……一部分不见了。就在昨晚。没有声音，没有震动。早上起来，墙就……没了。维修局怎么说？他们说会处理。但他们只是围起来，什么都没做。说是要等'更正'。"

3. **通讯点** (comms_point)
   - 条件: 无
   - 动作: 触发对话 C1Z6_GULIN_COMMS
   - 结果:
     - 对话摘要: "顾临：岑回，你到现场了？这种规模的坍塌，不需要人工干预。系统会处理。我们只需要标注和围挡。不要擅自行动。记住，你是来巡检的，不是来修复的。"

4. **碎片** (debris)
   - 条件: 无
   - 动作: 触发对话 C1Z6_DEBRIS
   - 结果:
     - 对话摘要: "这些是坍塌后留下的碎片……但仔细看，碎片的边缘也很整齐。不像是被震碎的，更像是被……切割的。"
     - 获得卡片: `CARD_C1_COLLAPSE_REPORT`

5. **继续前进** (exit_to_c2)
   - 条件: `FLAG_C1_COMPLETE = true`
   - 动作: 跳转到 `C2-Z1`

6. **返回礼堂街** (exit_back)
   - 条件: 无
   - 动作: 跳转到 `C1-Z5`

---

## C2 第二章：深度感知

### C2-Z1 维修局校准室
**场景描述**: 解锁深度感知（只读）。

**可交互对象**:

1. **校准台A - 结构样本** (calibration_a)
   - 条件: 无
   - 动作: 触发对话 C2Z1_CALIBRATION_A
   - 结果:
     - 对话摘要: "校准台A：结构样本。提示：长按屏幕进入深度视野（只读）。在深度视野下，样本显示完整线框。状态：稳定。"
     - 设置FLAG: `FLAG_C2Z1_CALIBRATION_A = true`

2. **校准台B - 空腔样本** (calibration_b)
   - 条件: 无
   - 动作: 触发对话 C2Z1_CALIBRATION_B
   - 结果:
     - 对话摘要: "校准台B：空腔样本。在深度视野下，样本内部出现扭曲的空腔轮廓。表面完好，但里面是空的……状态：扭曲。"
     - 设置FLAG: `FLAG_C2Z1_CALIBRATION_B = true`

3. **校准台C - 断裂样本** (calibration_c)
   - 条件: 无
   - 动作: 触发对话 C2Z1_CALIBRATION_C
   - 结果:
     - 对话摘要: "校准台C：断裂样本。在深度视野下，样本显示断裂/缺口线框。这个……已经断了。状态：断裂。"
     - 设置FLAG: `FLAG_C2Z1_CALIBRATION_C = true`
     - 设置FLAG: `FLAG_C2Z1_ALL_CALIBRATED = true`

4. **授权终端** (auth_terminal)
   - 条件: `FLAG_C2Z1_ALL_CALIBRATED = true`
   - 动作: 触发对话 C2Z1_AUTH_TERMINAL
   - 结果:
     - 获得卡片: `CARD_C2_DEPTH_AUTH`
     - 设置FLAG: `FLAG_DEPTH_SENSE_UNLOCKED = true`
     - **解锁能力: depthPerception**
     - 触发伏笔: F03 (deepen)

5. **顾临** (gulin)
   - 条件: 无
   - 动作: 触发对话 C2Z1_GULIN_TALK
   - 结果:
     - 对话摘要: "从今天开始，你会看到一些……不该被讨论的东西。看见就记录。别动。城市不需要你证明自己，只需要你别让事情更复杂。"

6. **离开校准室** (exit_forward)
   - 条件: `FLAG_DEPTH_SENSE_UNLOCKED = true`
   - 动作: 跳转到 `C2-Z2`

---

### C2-Z2 薄墙巷口（重访）
**场景描述**: 深度感知第一次实战。

**可交互对象**:

1. **薄墙** (thin_wall_depth)
   - 条件: 无
   - 动作: 触发对话 C2Z2_THIN_WALL
   - 结果:
     - 使用深度感知可看到空腔

2. **深度感知区域** (depth_sense_zone)
   - 条件: 无
   - 动作: 触发对话 C2Z2_DEPTH_VIEW
   - 结果:
     - 长按激活深度感知，看到空腔结构
     - 设置FLAG: `FLAG_C2Z2_SAW_CAVITY = true`
     - 触发伏笔: F01 (recover)

3. **提交记录点** (submit_point)
   - 条件: `FLAG_C2Z2_SAW_CAVITY = true` 且 `FLAG_REPORTED_CAVITY = false`
   - 动作: 触发对话 C2Z2_SUBMIT_RECORD
   - 结果:
     - 选择分支:
       - 提交记录: 设置 `FLAG_REPORTED_CAVITY = true`, 获得卡片 `CARD_C2_DEPTH_FRAGMENT_01`
       - 暂不提交: 无变化

4. **前往档案巷** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C2-Z3`

---

### C2-Z3 许澄诊疗室
**场景描述**: 第二段楼梯（虚构）的发现。

**可交互对象**:

1. **第二段楼梯（虚构）** (stair_segment_2_fake)
   - 条件: 无
   - 动作: 触发对话 C2Z3_FAKE_STAIR
   - 结果:
     - 设置FLAG: `FLAG_C2Z3_TRIGGERED_FAKE = true`

2. **宋岚** (songlan)
   - 条件: 无
   - 动作: 触发对话 C2Z3_SONGLAN_GUIDE
   - 结果:
     - 选择分支:
       - 你怎么知道这些？
       - 我只想过去
       - 差异有什么用？

3. **记录差异任务点** (record_diff_point)
   - 条件: `FLAG_C2Z3_TRIGGERED_FAKE = true` 且 `FLAG_RECORDED_STAIR_DIFF = false`
   - 动作: 触发对话 C2Z3_RECORD_DIFF
   - 结果:
     - 选择分支:
       - 记录差异: R+1, 设置 `FLAG_RECORDED_STAIR_DIFF = true`, 获得卡片 `CARD_C2_VERSION_MAP_02`, 触发 F12 (deepen)
       - 算了: 无变化

4. **继续前进** (exit_forward)
   - 条件: `FLAG_C2Z3_COMPLETED = true`
   - 动作: 跳转到 `C2-Z4`

---

### C2-Z4 栖蓝的修补摊
**场景描述**: 栖蓝修补路标的场景。

**可交互对象**:

1. **歪斜路标** (crooked_sign)
   - 条件: 无
   - 动作: 触发对话 C2Z4_CROOKED_SIGN

2. **钉子孔** (nail_hole)
   - 条件: `FLAG_C2Z4_HAS_NAIL = false`
   - 动作: 触发对话 C2Z4_NAIL_HOLE
   - 结果:
     - 选择分支:
       - 捡起钉子: 设置 `FLAG_C2Z4_HAS_NAIL = true`, 获得卡片 `CARD_C2_NAIL`
       - 忽略: 无变化

3. **栖蓝** (qilan)
   - 条件: 无
   - 动作: 触发对话 C2Z4_QILAN_TALK
   - 结果:
     - 选择分支:
       - 为什么要做这种事？
       - 我帮你: 设置 `FLAG_C2Z4_AGREED_HELP = true`
       - 我很忙

4. **完成修补** (complete_point)
   - 条件: `FLAG_C2Z4_HAS_NAIL = true`
   - 动作: 触发对话 C2Z4_COMPLETE_REPAIR
   - 结果:
     - 获得卡片: `CARD_C2_REPAIR_RECORD`
     - 设置FLAG: `FLAG_C2Z4_SIGN_FIXED = true`
     - 设置FLAG: `FLAG_HELPED_QILAN_SIGN = true`
     - 触发伏笔: F05 (plant)
     - R+2

5. **前往诊疗台** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C2-Z5`

---

### C2-Z5 诊疗台：阿棠的碎片日记1
**场景描述**: 阿棠的漂移者身份初现。

**可交互对象**:

1. **阿棠** (atang)
   - 条件: 无
   - 动作: 触发对话 C2Z5_ATANG_TALK
   - 结果:
     - 选择分支:
       - 你认识我？
       - 你说的"昨天"是哪一天？: R+1
       - 别乱说

2. **阿棠的纸条** (atang_note)
   - 条件: 无
   - 动作: 触发对话 C2Z5_ATANG_NOTE
   - 结果:
     - 获得卡片: `CARD_C2_FRAGMENT_DIARY_01`

3. **前往礼堂街** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C2-Z6`

---

### C2-Z6 礼堂街：祷文抄本2
**场景描述**: 牧平的神话壳继续加深。

**可交互对象**:

1. **牧平** (muping)
   - 条件: 无
   - 动作: 触发对话 C2Z6_MUPING_TALK
   - 结果:
     - 选择分支:
       - 我看见墙里是空的: 可选择"那我该怎么办？" → R+1
       - 我看见楼梯是假的: 可选择"那我该怎么办？" → R+1
       - 只是路过: 设置 `FLAG_C2Z6_TALKED_MUPING = true`

2. **祷文抄本位置** (prayer_scroll)
   - 条件: `FLAG_C2Z6_TALKED_MUPING = true`
   - 动作: 获得卡片 `CARD_C2_PRAYER_02`
   - 结果:
     - 触发伏笔: F15 (deepen)

3. **前往边缘断口** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C2-Z7`

---

### C2-Z7 边缘断口：不存在的房间
**场景描述**: 深度感知发现隐藏空间。

**可交互对象**:

1. **门影轮廓点** (door_outline)
   - 条件: `abilityActive: depthPerception`
   - 动作: 触发对话 C2Z7_DOOR_OUTLINE
   - 结果:
     - 选择分支:
       - 尝试进入: 设置 `FLAG_C2Z7_SAW_SPACE = true`
       - 先记录下来: 设置 `FLAG_C2Z7_SAW_SPACE = true`

2. **提交记录点** (submit_record)
   - 条件: `FLAG_C2Z7_SAW_SPACE = true`
   - 动作: 触发对话 C2Z7_SUBMIT
   - 结果:
     - 选择分支:
       - 提交记录: 获得卡片 `CARD_C2_DEPTH_FRAGMENT_02`, 设置 `FLAG_SAW_NONEXISTENT_HALL = true`, 设置 `FLAG_C2_COMPLETE = true`
       - 暂不提交: 无变化

3. **继续深入** (exit_to_c3)
   - 条件: `FLAG_C2_COMPLETE = true`
   - 动作: 跳转到 `C3-Z1`

---

## C3 第三章：深度介入

### C3-Z1 维修局：例外许可签发
**场景描述**: 解锁深度介入能力。

**可交互对象**:

1. **顾临** (gulin)
   - 条件: `FLAG_C3Z1_ENTERED = true`
   - 动作: 触发对话 C3Z1_GULIN_TALK
   - 结果:
     - 选择分支:
       - 为什么要给我这个？
       - 如果有人需要救呢？
       - 我不想碰
     - 设置FLAG: `FLAG_C3Z1_GULIN_SPOKE = true`

2. **许可文件夹** (permit_folder)
   - 条件: `FLAG_C3Z1_GULIN_SPOKE = true`
   - 动作: 触发对话 C3Z1_PERMIT_FOLDER
   - 结果:
     - 选择分支:
       - 签署: 获得卡片 `CARD_C3_DEPTH_INTERVENTION`, 设置 `FLAG_DEPTH_INTERVENTION_UNLOCKED = true`, **解锁能力 depthIntervention**
       - 暂不签署: 同样解锁能力

3. **前往边缘断口** (exit_forward)
   - 条件: `FLAG_DEPTH_INTERVENTION_UNLOCKED = true`
   - 动作: 跳转到 `C3-Z2`

---

### C3-Z2 不存在的房间（可进入）
**场景描述**: 使用深度介入进入隐藏空间，救出陈匠。

**可交互对象**:

1. **介入热点** (intervention_point)
   - 条件: `abilityActive: depthPerception`
   - 动作: 触发对话 C3Z2_INTERVENTION_CHOICE
   - 结果:
     - 选择分支:
       - 按住确认（1秒）: P+3, R+1, 设置 `FLAG_HALL_SCAR = 1`, 设置 `FLAG_C3Z2_ENTERED_ROOM = true`
       - 取消: 无变化

2. **陈匠** (chenjiang_position)
   - 条件: `FLAG_C3Z2_ENTERED_ROOM = true`
   - 动作: 触发对话 C3Z2_CHENJIANG_TALK
   - 结果:
     - 选择分支:
       - 跟我走: 获得卡片 `CARD_C3_OLD_WICK`, 设置 `FLAG_C3Z2_RESCUED = true`
       - 你为什么要来？: 设置 `FLAG_C3Z2_RESCUED = true`
       - 你叫什么？: 设置 `FLAG_C3Z2_RESCUED = true`

3. **撤离点** (evacuation_point)
   - 条件: `FLAG_C3Z2_RESCUED = true`
   - 动作: 触发对话 C3Z2_EVACUATION
   - 结果:
     - 设置FLAG: `FLAG_C3Z2_COMPLETE = true`
     - 获得卡片: `CARD_C3_RESCUE_RECORD`

4. **前往版本库** (exit_forward)
   - 条件: `FLAG_C3Z2_COMPLETE = true`
   - 动作: 跳转到 `C3-Z3`

---

### C3-Z3 档案巷：宋岚的版本库
**场景描述**: 宋岚展示版本差异的证据。

**可交互对象**:

1. **地图墙** (map_wall)
   - 条件: 无
   - 动作: 触发对话 C3Z3_MAP_WALL
   - 结果:
     - 设置FLAG: `FLAG_C3Z3_SAW_MAPS = true`
     - 获得卡片: `CARD_C3_VERSION_MAP_03`

2. **差异标注台** (annotation_desk)
   - 条件: `FLAG_C3Z3_SAW_MAPS = true`
   - 动作: 触发对话 C3Z3_ANNOTATION_DESK
   - 结果:
     - 选择分支:
       - 标注V1的空白
       - 标注V2的涂抹
       - 标注V3的"墙"
     - 获得卡片: `CARD_C3_DIFF_RECEIPT`
     - 设置FLAG: `FLAG_VERSION_DIFF_SUBMITTED = true`
     - 触发伏笔: F12 (deepen)
     - R+1

3. **前往修补摊** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C3-Z4`

---

### C3-Z4 栖蓝：空椅子
**场景描述**: F23伏笔首次投放。

**可交互对象**:

1. **空椅子** (empty_chair)
   - 条件: 无
   - 动作: 触发对话 C3Z4_EMPTY_CHAIR

2. **完成修复**
   - 结果:
     - 获得卡片: `CARD_C3_EMPTY_CHAIR`
     - 设置FLAG: `FLAG_EMPTY_CHAIR_SET = true`
     - 触发伏笔: F23 (plant)
     - R+2

3. **小灯座** (lamp_stand)
   - 条件: 无
   - 动作: 触发对话 C3Z4_LAMP_STAND
   - 结果:
     - 选择分支:
       - 使用旧灯芯（需要卡片：旧灯芯）: 设置 `FLAG_LAMP_LIT = true`
       - 没有灯芯: 无变化

4. **前往诊疗台** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C3-Z5`

---

### C3-Z5 诊疗台：病例卡1
**场景描述**: 症状清单填写。

**可交互对象**:

1. **症状清单** (symptom_list)
   - 条件: `FLAG_C3Z5_STARTED = true`
   - 动作: 触发对话 C3Z5_SYMPTOM_LIST
   - 结果:
     - 选择分支:
       - 勾选"重复感"
       - 勾选"日期不确定"
       - 勾选"空白记忆"
       - 都不勾选
     - 设置FLAG: `FLAG_C3Z5_SYMPTOMS_DONE = true`

2. **病例卡领取点** (med_card_point)
   - 条件: `FLAG_C3Z5_SYMPTOMS_DONE = true`
   - 动作: 触发对话 C3Z5_MED_CARD
   - 结果:
     - 获得卡片: `CARD_C3_MED_CARD_01`
     - 设置FLAG: `FLAG_MED_CARD_01 = true`
     - 触发伏笔: F14 (deepen)

3. **前往礼堂街** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C3-Z6`

---

### C3-Z6 礼堂街：牧平的警告
**场景描述**: 牧平关于"写太多"的警告。

**可交互对象**:

1. **牧平** (muping)
   - 条件: 无
   - 动作: 触发对话 C3Z6_MUPING_TALK
   - 结果:
     - 选择分支:
       - 那我就什么都不做？
       - 如果不写，人会被抹掉: 触发伏笔 F23 (deepen)
       - 你到底知道多少？
     - 设置FLAG: `FLAG_C3Z6_MUPING_SPOKE = true`

2. **抄本领取处** (prayer_scroll_point)
   - 条件: `FLAG_C3Z6_MUPING_SPOKE = true`
   - 动作: 获得卡片 `CARD_C3_PRAYER_03`

3. **歪椅子** (extra_chair)
   - 条件: 无
   - 动作: 触发对话 C3Z6_EXTRA_CHAIR
   - 结果:
     - 选择分支:
       - 扶正它: R+1
       - 不管它: 无变化

4. **前往断裂走廊** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C3-Z7`

---

### C3-Z7 边缘断口：断裂走廊
**场景描述**: 第3章高潮 - 断裂走廊通过。

**可交互对象**:

1. **介入选择** (intervention_point)
   - 条件: `abilityActive: depthPerception`
   - 动作: 触发对话 C3Z7_INTERVENTION_CHOICE
   - 结果:
     - 选择分支:
       - 加固（深度介入）: P+2, 设置 `FLAG_EDGE_SCAR = 2`, 获得卡片 `CARD_C3_FRACTURE_SAMPLE`, 设置 `FLAG_C3Z7_PASSED = true`
       - 找别的路: 获得卡片 `CARD_C3_FRACTURE_SAMPLE`, 设置 `FLAG_C3Z7_PASSED = true`

2. **终点门** (end_door)
   - 条件: `FLAG_C3Z7_PASSED = true`
   - 动作: 触发对话 C3Z7_EXIT_DOOR
   - 结果:
     - 设置FLAG: `FLAG_C3_COMPLETE = true`

3. **继续前进** (exit_to_c4)
   - 条件: `FLAG_C3_COMPLETE = true`
   - 动作: 跳转到 `C4-Z1`

---

## C4 第四章：时间干预

### C4-Z1 坍塌后的生活区（重访）
**场景描述**: 灾后漂移与住户纷争。

**可交互对象**:

1. **住户A** (resident_a)
   - 条件: 无
   - 动作: 触发对话 C4Z1_RESIDENT_DISPUTE

2. **散落的物品** (scattered_items)
   - 条件: `FLAG_HELPED_RESIDENT = false`
   - 动作: 触发对话 C4Z1_HELP_RESIDENT
   - 结果:
     - 选择分支:
       - 帮忙归整: R+1, 设置 `FLAG_HELPED_RESIDENT = true`
       - 我还有任务: 无变化

3. **临时公告板** (notice_board)
   - 条件: 无
   - 动作: 获得卡片 `CARD_C4_TEMP_NOTICE`

4. **前往校准室** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C4-Z2`

---

### C4-Z2 维修局：时间节点界面上线
**场景描述**: 解锁时间干预能力。

**可交互对象**:

1. **顾临** (gulin)
   - 条件: 无
   - 动作: 触发对话 C4Z2_GULIN_TALK
   - 结果:
     - 选择分支:
       - 那给我它有什么意义？: 设置 `FLAG_C4Z2_TUTORIAL_START = true`
       - 如果我救得了人呢？: 设置 `FLAG_C4Z2_TUTORIAL_START = true`
       - 我只会在必要时用: 设置 `FLAG_C4Z2_TUTORIAL_START = true`

2. **螺丝（演示用）** (demo_screw)
   - 条件: `FLAG_C4Z2_SCREW_FALLEN = false`
   - 动作: 触发对话 C4Z2_SCREW_DEMO
   - 结果:
     - 设置FLAG: `FLAG_C4Z2_SCREW_FALLEN = true`
     - 选择分支:
       - 打开时间堆栈: 回溯演示

3. **回溯完成**
   - 结果:
     - 设置FLAG: `FLAG_C4Z2_ROLLBACK_DONE = true`
     - 获得卡片: `CARD_C4_DEMO_RECEIPT`

4. **授权终端** (auth_terminal)
   - 条件: `FLAG_C4Z2_ROLLBACK_DONE = true`
   - 动作: 触发对话 C4Z2_AUTH_COMPLETE
   - 结果:
     - 获得卡片: `CARD_C4_TIME_AUTH`
     - 设置FLAG: `FLAG_TIME_INTERVENTION_UNLOCKED = true`
     - **解锁能力: timeIntervention**

5. **前往边缘断口** (exit_forward)
   - 条件: `FLAG_TIME_INTERVENTION_UNLOCKED = true`
   - 动作: 跳转到 `C4-Z3`

---

### C4-Z3 边缘断口：第一次必须回溯的事件
**场景描述**: 强制使用时间回溯。

**可交互对象**:

1. **警报线圈** (alarm_coil)
   - 条件: 无
   - 动作: 触发对话 C4Z3_ALARM_COIL
   - 结果:
     - 设置FLAG: `FLAG_C4Z3_ALARM_TRIGGERED = true`

2. **坍塌点** (collapse_point)
   - 条件: `FLAG_C4Z3_ALARM_TRIGGERED = true`
   - 动作: 触发对话 C4Z3_COLLAPSE_BLOCKED
   - 结果:
     - 设置FLAG: `FLAG_C4Z3_MUST_ROLLBACK = true`

3. **回溯节点提示** (rollback_hint)
   - 条件: `FLAG_C4Z3_MUST_ROLLBACK = true`
   - 动作: 触发对话 C4Z3_ROLLBACK_GUIDE
   - 结果:
     - 选择分支:
       - 回溯到警报前: P+3, 设置 `FLAG_C4Z3_ROLLBACK_DONE = true`, 设置 `FLAG_TIME_PATCH_MARK_SEEN = true`
       - 再试试别的: 无变化

4. **安全开关** (safety_switch)
   - 条件: `FLAG_C4Z3_ROLLBACK_DONE = true`
   - 动作: 触发对话 C4Z3_SAFETY_SWITCH
   - 结果:
     - 设置FLAG: `FLAG_C4Z3_PASSED = true`
     - 获得卡片: `CARD_C4_NODE_RECEIPT_01`, `CARD_C4_EDGE_RECORD_02`

5. **通过确认点** (pass_point)
   - 条件: `FLAG_C4Z3_PASSED = true`
   - 动作: 跳转到 `C4-Z4`

---

### C4-Z4 诊疗台：病例卡2
**场景描述**: 回溯后的症状评估。

**可交互对象**:

1. **许澄** (xucheng)
   - 条件: 无
   - 动作: 触发对话 C4Z4_XUCHENG_TALK
   - 结果:
     - 设置FLAG: `FLAG_C4Z4_STARTED = true`

2. **回溯后症状清单** (symptom_list_new)
   - 条件: `FLAG_C4Z4_STARTED = true`
   - 动作: 触发对话 C4Z4_SYMPTOM_LIST
   - 结果:
     - 选择分支:
       - 勾选"事件重复感"
       - 勾选"解释费力"
       - 勾选"补丁敏感"
     - 设置FLAG: `FLAG_C4Z4_SYMPTOMS_DONE = true`

3. **病例卡领取点** (med_card_point)
   - 条件: `FLAG_C4Z4_SYMPTOMS_DONE = true`
   - 动作: 触发对话 C4Z4_MED_CARD
   - 结果:
     - 获得卡片: `CARD_C4_MED_CARD_02`
     - 设置FLAG: `FLAG_MED_CARD_02 = true`
     - 触发伏笔: F14 (deepen)

4. **前往走廊** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C4-Z5`

---

### C4-Z5 阿棠碎片日记2
**场景描述**: 阿棠的纸条与墙缝。

**可交互对象**:

1. **阿棠** (atang)
   - 条件: 无
   - 动作: 触发对话 C4Z5_ATANG_TALK
   - 结果:
     - 选择分支:
       - 你怎么知道我回去了？
       - 你到底记得多少？
       - 你害怕吗？
     - 设置FLAG: `FLAG_C4Z5_TALKED = true`

2. **阿棠的纸条** (atang_note)
   - 条件: `FLAG_C4Z5_TALKED = true`
   - 动作: 触发对话 C4Z5_ATANG_NOTE
   - 结果:
     - 设置FLAG: `FLAG_C4Z5_HAS_NOTE = true`

3. **墙缝** (wall_crack)
   - 条件: `FLAG_C4Z5_HAS_NOTE = true` 且 `FLAG_HELPED_ATANG_PAPER = false`
   - 动作: 触发对话 C4Z5_WALL_CRACK
   - 结果:
     - 选择分支:
       - 把纸条塞进去: R+2, 设置 `FLAG_HELPED_ATANG_PAPER = true`, 获得卡片 `CARD_C4_FRAGMENT_DIARY_02`
       - 留着纸条: 无变化

4. **前往街角** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C4-Z6`

---

### C4-Z6 栖蓝：无人需要的地图
**场景描述**: 贴地图到墙上。

**可交互对象**:

1. **地图卷** (map_scroll)
   - 条件: 无
   - 动作: 触发对话 C4Z6_MAP_SCROLL
   - 结果:
     - 设置FLAG: `FLAG_C4Z6_SAW_MAP = true`

2. **糨糊/胶水** (glue_pot)
   - 条件: `FLAG_C4Z6_SAW_MAP = true`
   - 动作: 触发对话 C4Z6_APPLY_GLUE
   - 结果:
     - 设置FLAG: `FLAG_C4Z6_GLUE_APPLIED = true`

3. **压平工具** (flatten_tool)
   - 条件: `FLAG_C4Z6_GLUE_APPLIED = true`
   - 动作: 触发对话 C4Z6_FLATTEN
   - 结果:
     - 设置FLAG: `FLAG_C4Z6_FLATTENED = true`

4. **完成确认点** (complete_point)
   - 条件: `FLAG_C4Z6_FLATTENED = true`
   - 动作: 触发对话 C4Z6_COMPLETE
   - 结果:
     - 获得卡片: `CARD_C4_USELESS_MAP`
     - 设置FLAG: `FLAG_MAP_PASTED = true`
     - 触发伏笔: F21 (plant)
     - R+2

5. **前往礼堂街** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C4-Z7`

---

### C4-Z7 礼堂街：祷文抄本3
**场景描述**: 牧平的祷文继续。

**可交互对象**:

1. **牧平** (muping)
   - 条件: 无
   - 动作: 触发对话 C4Z7_MUPING_TALK
   - 结果:
     - 设置FLAG: `FLAG_C4Z7_MUPING_SPOKE = true`

2. **抄本领取处** (prayer_scroll)
   - 条件: `FLAG_C4Z7_MUPING_SPOKE = true`
   - 动作: 获得卡片 `CARD_C4_PRAYER_03`

3. **前往市政环** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C4-Z8`

---

### C4-Z8 市政环：顾临的限制
**场景描述**: 顾临限制介入权限。

**可交互对象**:

1. **顾临** (gulin)
   - 条件: 无
   - 动作: 触发对话 C4Z8_GULIN_RESTRICTION
   - 结果:
     - 选择分支:
       - 你怕什么？
       - 我救了人
       - 你是在替谁说话？
     - 设置FLAG: `FLAG_C4Z8_GULIN_SPOKE = true`

2. **权限面板** (permission_panel)
   - 条件: `FLAG_C4Z8_GULIN_SPOKE = true`
   - 动作: 触发对话 C4Z8_PERMISSION_PANEL
   - 结果:
     - 设置FLAG: `FLAG_C4Z8_SHOW_RESTRICTED = true`
     - 获得卡片: `CARD_C4_PERMISSION_CHANGE`

3. **离开点** (exit_point)
   - 条件: `FLAG_INTERVENTION_RESTRICTED = true`
   - 动作: 触发对话 C4Z8_EXIT
   - 结果:
     - 设置FLAG: `FLAG_C4_COMPLETE = true`

4. **继续前进** (exit_to_c5)
   - 条件: `FLAG_C4_COMPLETE = true`
   - 动作: 跳转到 `C5-Z1`

---

## C5 第五章：版本冲突

### C5-Z1 档案巷：版本冲突现场
**场景描述**: 互斥版本选择。

**可交互对象**:

1. **版本切换点** (version_switch)
   - 条件: 无
   - 动作: 触发对话 C5Z1_VERSION_SWITCH
   - 结果:
     - 选择分支:
       - 切换到版本V-A: 设置 `FLAG_C5Z1_VERSION_A = true`
       - 切换到版本V-B: 设置 `FLAG_C5Z1_VERSION_B = true`
     - 设置FLAG: `FLAG_C5Z1_VERSION_SEEN = true`

2. **纪念墙（V-B版本）** (memorial_wall)
   - 条件: `FLAG_C5Z1_VERSION_B = true`
   - 动作: 触发对话 C5Z1_MEMORIAL_WALL
   - 结果:
     - 选择分支:
       - 抄下来: R+2, 获得卡片 `CARD_C5_MEMORIAL_COPY`
       - 不抄: 无变化

3. **差异标注点** (diff_submit)
   - 条件: `FLAG_C5Z1_VERSION_SEEN = true`
   - 动作: 触发对话 C5Z1_SUBMIT_VERSION
   - 结果:
     - 选择分支:
       - 提交V-A（可归档）: 获得卡片 `CARD_C5_VERSION_CONFLICT`, 设置 `FLAG_C5Z1_VERSION_LOCKED = true`
       - 提交V-B（解释成本↑）: R+1, 获得卡片 `CARD_C5_VERSION_CONFLICT`, 设置 `FLAG_C5Z1_VERSION_LOCKED = true`

4. **前往纠偏中心** (exit_forward)
   - 条件: `FLAG_C5Z1_VERSION_LOCKED = true`
   - 动作: 跳转到 `C5-Z2`

---

### C5-Z2 市政环：纠偏中心外围
**场景描述**: 提交记录。

**可交互对象**:

1. **提交窗口** (submit_window)
   - 条件: `FLAG_C5Z2_ENTERED = true`
   - 动作: 触发对话 C5Z2_SUBMIT_RECORD
   - 结果:
     - 获得卡片: `CARD_C5_CORRECTION_RECEIPT`
     - 设置FLAG: `FLAG_C5Z2_SUBMITTED = true`

2. **顾临** (gulin)
   - 条件: `FLAG_C5Z2_SUBMITTED = true`
   - 动作: 触发对话 C5Z2_GULIN_TALK
   - 结果:
     - 选择分支:
       - 那就别结算: R+1
       - 我只是记录
       - 你在怕系统，还是怕人？
     - 设置FLAG: `FLAG_C5Z2_COMPLETE = true`

3. **前往诊疗台** (exit_forward)
   - 条件: `FLAG_C5Z2_COMPLETE = true`
   - 动作: 跳转到 `C5-Z3`

---

### C5-Z3 诊疗台：许澄的抉择
**场景描述**: 疗程选择。

**可交互对象**:

1. **疗程说明卡** (treatment_card)
   - 条件: `FLAG_C5Z3_STARTED = true`
   - 动作: 触发对话 C5Z3_TREATMENT_CARD
   - 结果:
     - 设置FLAG: `FLAG_C5Z3_READ_TREATMENT = true`

2. **选择界面** (choice_panel)
   - 条件: `FLAG_C5Z3_READ_TREATMENT = true`
   - 动作: 触发对话 C5Z3_MAKE_CHOICE
   - 结果:
     - 选择分支:
       - 我接受: 获得卡片 `CARD_C5_TREATMENT_RECEIPT`, 设置 `FLAG_TREATMENT_ACCEPT = true`, 设置 `FLAG_C5Z3_COMPLETE = true`
       - 我拒绝: R+2, 获得卡片 `CARD_C5_XUCHENG_NOTE`, 设置 `FLAG_TREATMENT_REFUSE = true`, 设置 `FLAG_C5Z3_COMPLETE = true`

3. **前往礼堂街** (exit_forward)
   - 条件: `FLAG_C5Z3_COMPLETE = true`
   - 动作: 跳转到 `C5-Z4`

---

### C5-Z4 礼堂街：牧平的"页背风暴"
**场景描述**: 牧平的警告。

**可交互对象**:

1. **牧平** (muping)
   - 条件: 无
   - 动作: 触发对话 C5Z4_MUPING_TALK
   - 结果:
     - 设置FLAG: `FLAG_C5Z4_MUPING_SPOKE = true`

2. **抄本领取处** (prayer_scroll)
   - 条件: `FLAG_C5Z4_MUPING_SPOKE = true`
   - 动作: 获得卡片 `CARD_C5_PRAYER_04`

3. **前往街角** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C5-Z5`

---

### C5-Z5 栖蓝：空椅子的消失与归来
**场景描述**: 椅子被删除后用替代品标记。

**可交互对象**:

1. **空位置** (chair_position)
   - 条件: 无
   - 动作: 触发对话 C5Z5_EMPTY_POSITION
   - 结果:
     - 获得卡片: `CARD_C5_CHAIR_CORRECTED`

2. **栖蓝** (qilan)
   - 条件: 无
   - 动作: 触发对话 C5Z5_QILAN_TALK
   - 结果:
     - 选择分支:
       - 我留下: 设置 `FLAG_C5Z5_STAY = true`
       - 这没用
       - 他们是谁？

3. **工具箱** (qilan_toolbox)
   - 条件: `FLAG_C5Z5_STAY = true`
   - 动作: 触发对话 C5Z5_TOOLBOX
   - 结果:
     - 设置FLAG: `FLAG_C5Z5_TOOLBOX_OPEN = true`

4. **粉笔** (chalk)
   - 条件: `FLAG_C5Z5_TOOLBOX_OPEN = true`
   - 动作: 触发对话 C5Z5_CHALK
   - 结果:
     - 设置FLAG: `FLAG_C5Z5_OUTLINED = true`

5. **木板** (wood_plank)
   - 条件: `FLAG_C5Z5_OUTLINED = true`
   - 动作: 触发对话 C5Z5_WOOD_PLANK
   - 结果:
     - 选择分支:
       - 摆放替代椅: R+2, 获得卡片 `CARD_C5_CHAIR_PLACEHOLDER`, 设置 `FLAG_CHAIR_PLACEHOLDER = true`, 触发伏笔 F23 (deepen)
       - 算了: 无变化

6. **前往断口** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `C5-Z6`

---

### C5-Z6 边缘断口：审计样式的界面覆盖
**场景描述**: 审计覆盖区。

**可交互对象**:

1. **覆盖区入口** (audit_entrance)
   - 条件: 无
   - 动作: 触发对话 C5Z6_ENTER_AUDIT
   - 结果:
     - 设置FLAG: `FLAG_C5Z6_IN_AUDIT = true`

2. **异常点1-3** (anomaly_1/2/3)
   - 条件: 依次解锁
   - 动作: 触发对话 C5Z6_ANOMALY_1/2/3
   - 结果:
     - 依次设置FLAG
     - 最终获得卡片: `CARD_C5_AUDIT_SNAPSHOT`
     - 设置FLAG: `FLAG_C5Z6_ALL_MARKED = true`

3. **时间堆栈异化提示** (time_stack_hint)
   - 条件: `FLAG_C5Z6_IN_AUDIT = true`
   - 动作: 触发对话 C5Z6_TIME_STACK_ANOMALY
   - 结果:
     - R+1, P+1

4. **退出门** (exit_door)
   - 条件: `FLAG_C5Z6_ALL_MARKED = true`
   - 动作: 触发对话 C5Z6_EXIT
   - 结果:
     - 设置FLAG: `FLAG_C5Z6_COMPLETE = true`
     - P+2

5. **继续前进** (exit_forward)
   - 条件: `FLAG_C5Z6_COMPLETE = true`
   - 动作: 跳转到 `C5-Z7`

---

### C5-Z7 "此行为在当前模型中无意义"
**场景描述**: F21判词触发。

**可交互对象**:

1. **空白标签** (blank_label)
   - 条件: 无
   - 动作: 触发对话 C5Z7_TASK_A
   - 结果:
     - 选择分支:
       - 贴回墙上: 设置 `FLAG_C5Z7_TASK_A_DONE = true`
       - 不管它: 无变化

2. **椅脚印描边** (chair_outline)
   - 条件: 无
   - 动作: 触发对话 C5Z7_TASK_B
   - 结果:
     - 选择分支:
       - 重新描一遍: 设置 `FLAG_C5Z7_TASK_B_DONE = true`
       - 不管它: 无变化

3. **版本卡** (version_card_slot)
   - 条件: 无
   - 动作: 触发对话 C5Z7_TASK_C
   - 结果:
     - 选择分支:
       - 放入版本卡: 设置 `FLAG_C5Z7_TASK_C_DONE = true`, 设置 `FLAG_C5Z7_TASKS_DONE = true`, 触发 F21
       - 不放: 无变化

4. **F21判词触发点** (f21_trigger)
   - 条件: `FLAG_C5Z7_TASKS_DONE = true`
   - 结果:
     - 获得卡片: `CARD_C5_F21_JUDGMENT`
     - 设置FLAG: `FLAG_F21_TRIGGERED = true`
     - 触发伏笔: F21 (collect)
     - R+1

5. **前往终章** (exit_forward)
   - 条件: `FLAG_F21_TRIGGERED = true`
   - 动作: 跳转到 `CF-Z1`

---

## CF 终章：字段定义

### CF-Z1 模型边界：冗余字段区
**场景描述**: F22正式落地 - 冗余字段条不可关闭。

**可交互对象**:

1. **覆盖区入口** (audit_entrance)
   - 条件: 无
   - 动作: 触发对话 CFZ1_ENTER
   - 结果:
     - 对话摘要: "你进入冗余字段区——屏幕上方闪现半透明字段表……遮罩消失，但底部出现一条冗余字段条「字段：＿」——它不可关闭。"
     - 设置FLAG: `FLAG_CFZ1_ENTERED = true`
     - 设置FLAG: `FLAG_F22_ACTIVE = true`

2. **异常点A-C** (anomaly_a/b/c)
   - 条件: 依次解锁
   - 动作: 触发对话 CFZ1_ANOMALY_A/B/C
   - 结果:
     - 依次设置FLAG
     - 最终获得卡片: `CARD_CF_REDUNDANT_SNAPSHOT`
     - 设置FLAG: `FLAG_CFZ1_ALL_DONE = true`

3. **出口门** (exit_door)
   - 条件: `FLAG_CFZ1_ALL_DONE = true`
   - 动作: 跳转到 `CF-Z2`

---

### CF-Z2 最后的无收益选择
**场景描述**: 三种仪式选择。

**可交互对象**:

1. **仪式①：空椅占位** (ritual_chair)
   - 条件: 无
   - 动作: 触发对话 CFZ2_RITUAL_CHAIR
   - 结果:
     - 选择分支:
       - 执行仪式: R+3, 获得卡片 `CARD_CF_CHAIR_FINAL`, 设置 `FLAG_RITE_CHAIR = true`, 设置 `FLAG_FINAL_RITE_DONE = true`
       - 选择其他仪式: 无变化

2. **仪式②：版本库封存** (ritual_archive)
   - 条件: 无
   - 动作: 触发对话 CFZ2_RITUAL_ARCHIVE
   - 结果:
     - 选择分支:
       - 执行仪式: R+3, 获得卡片 `CARD_CF_ARCHIVE_FINAL`, 设置 `FLAG_RITE_ARCHIVE = true`, 设置 `FLAG_FINAL_RITE_DONE = true`
       - 选择其他仪式: 无变化

3. **仪式③：点灯** (ritual_lamp)
   - 条件: 无
   - 动作: 触发对话 CFZ2_RITUAL_LAMP
   - 结果:
     - 选择分支:
       - 执行仪式: R+3, 获得卡片 `CARD_CF_LAMP_FINAL`, 设置 `FLAG_RITE_LAMP = true`, 设置 `FLAG_FINAL_RITE_DONE = true`
       - 选择其他仪式: 无变化

4. **前往对视** (exit_forward)
   - 条件: `FLAG_FINAL_RITE_DONE = true`
   - 动作: 跳转到 `CF-Z3`

---

### CF-Z3 尺度失配：对视
**场景描述**: 格式坠落与字段定义。

**可交互对象**:

1. **格式坠落区域1-3** (format_zone_1/2/3)
   - 条件: 依次解锁
   - 动作: 触发对话 CFZ3_FORMAT_1/2/3
   - 结果:
     - 依次设置FLAG
     - 最终设置 `FLAG_CFZ3_ALL_FORMAT_DONE = true`

2. **冗余字段条交互点** (field_bar)
   - 条件: `FLAG_CFZ3_ALL_FORMAT_DONE = true`
   - 动作: 触发对话 CFZ3_FIELD_DEFINE
   - 结果:
     - 选择分支:
       - 点击添加刻度点: 添加刻度点1 → 添加刻度点2 → 添加刻度点3
     - 获得卡片: `CARD_CF_FIELD_ACCEPTED`
     - 设置FLAG: `FLAG_FIELD_ACCEPTED = true`
     - 触发伏笔: F22 (collect)
     - P+1

3. **继续** (exit_door)
   - 条件: `FLAG_FIELD_ACCEPTED = true`
   - 动作: 跳转到 `CF-Z4`

---

### CF-Z4 世界首次保存非最优解
**场景描述**: 保留之地 - 验证仪式结果。

**可交互对象**:

1. **空椅（保留）** (preserved_chair)
   - 条件: `FLAG_RITE_CHAIR = true`
   - 动作: 触发对话 CFZ4_CHAIR_PRESERVED
   - 结果:
     - 获得卡片: `CARD_CF_PRESERVE_PROOF`
     - 设置FLAG: `FLAG_F23_REALIZED = true`

2. **封存抄录（保留）** (preserved_archive)
   - 条件: `FLAG_RITE_ARCHIVE = true`
   - 动作: 触发对话 CFZ4_ARCHIVE_PRESERVED
   - 结果:
     - 获得卡片: `CARD_CF_PRESERVE_PROOF`
     - 设置FLAG: `FLAG_F23_REALIZED = true`

3. **弱灯（保留）** (preserved_lamp)
   - 条件: `FLAG_RITE_LAMP = true`
   - 动作: 触发对话 CFZ4_LAMP_PRESERVED
   - 结果:
     - 获得卡片: `CARD_CF_PRESERVE_PROOF`
     - 设置FLAG: `FLAG_F23_REALIZED = true`

4. **前往终局选择** (exit_forward)
   - 条件: 无
   - 动作: 跳转到 `CF-Z5`

---

### CF-Z5 三结局选择
**场景描述**: 平面尽头 - 最终选择。

**可交互对象**:

1. **结局A按钮：继续收敛** (ending_a)
   - 条件: R < 6 且 W > 60
   - 动作: 触发对话 CFZ5_CONFIRM_ENDING_A
   - 结果:
     - 选择分支:
       - 确认: 对话 CFZ5_ENDING_A → 按住确认（1秒）→ 设置 `FLAG_ENDING_A = true`, 设置 `FLAG_GAME_CLEAR = true`
       - 返回: 无变化

2. **结局B按钮：释放表示** (ending_b)
   - 条件: R >= 6 且 40 < W <= 60
   - 动作: 触发对话 CFZ5_CONFIRM_ENDING_B
   - 结果:
     - 选择分支:
       - 确认: 对话 CFZ5_ENDING_B → 按住确认（1秒）→ 设置 `FLAG_ENDING_B = true`, 设置 `FLAG_GAME_CLEAR = true`
       - 返回: 无变化

3. **结局C按钮：承载字段** (ending_c)
   - 条件: R >= 10 且 W <= 40
   - 动作: 触发对话 CFZ5_CONFIRM_ENDING_C
   - 结果:
     - 选择分支:
       - 确认: 对话 CFZ5_ENDING_C → 按住确认（1秒）→ 设置 `FLAG_ENDING_C = true`, 设置 `FLAG_GAME_CLEAR = true`
       - 返回: 无变化

---

### CF-Z6 尾声重访
**场景描述**: 尾声 - 与所有角色告别。

**可交互对象**:

1. **顾临入口** (gulin_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_GULIN
   - 结果:
     - 获得卡片: `CARD_CF_GULIN_CLAUSE`
     - 设置FLAG: `FLAG_GULIN_SEEN = true`

2. **宋岚入口** (songlan_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_SONGLAN
   - 结果:
     - 获得卡片: `CARD_CF_SONGLAN_LABEL`
     - 设置FLAG: `FLAG_SONGLAN_SEEN = true`

3. **许澄入口** (xucheng_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_XUCHENG
   - 结果:
     - 获得卡片: `CARD_CF_XUCHENG_NOTE`
     - 设置FLAG: `FLAG_XUCHENG_SEEN = true`

4. **牧平入口** (muping_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_MUPING
   - 结果:
     - 获得卡片: `CARD_CF_PRAYER_RESULT`
     - 设置FLAG: `FLAG_MUPING_SEEN = true`

5. **阿棠入口** (atang_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_ATANG
   - 结果:
     - 获得卡片: `CARD_CF_ATANG_DIARY`
     - 设置FLAG: `FLAG_ATANG_SEEN = true`

6. **栖蓝入口** (qilan_entry)
   - 条件: 无
   - 动作: 触发对话 CFZ6_QILAN
   - 结果:
     - 获得卡片: `CARD_CF_QILAN_NOTE`
     - 设置FLAG: `FLAG_QILAN_SEEN = true`

7. **通关提示** (clear_hint)
   - 条件: 所有角色都已访问
   - 动作: 触发对话 CFZ6_GAME_CLEAR
   - 结果:
     - 设置FLAG: `FLAG_ALL_EPILOGUE_SEEN = true`

---

## 附录

### 能力解锁时间线

| 章节 | 能力 | 解锁场景 |
|------|------|----------|
| C2-Z1 | 深度感知 (depthPerception) | 维修局校准室 |
| C3-Z1 | 深度介入 (depthIntervention) | 例外许可签发 |
| C4-Z2 | 时间干预 (timeIntervention) | 时间节点界面上线 |

### 结局条件

| 结局 | R值要求 | W值要求 | 描述 |
|------|---------|---------|------|
| A: 平面稳定 | R < 6 | W > 60 | 继续收敛，保住可读性 |
| B: 真实释放 | R >= 6 | 40 < W <= 60 | 表示松动，涌现回归 |
| C: 成为系统 | R >= 10 | W <= 40 | 玩家成为新字段承载者 |

### 核心伏笔列表

| 编号 | 名称 | 首次投放 | 加深 | 回收 |
|------|------|----------|------|------|
| F01 | 薄墙回声 | C0-Z3 | C2-Z2 | CF |
| F02 | 门牌异常 | C1-Z2 | - | CF |
| F03 | 版本更正 | C0-Z4 | C1-Z1, C2-Z1 | CF |
| F04 | 漂移者 | C1-Z2 | - | CF |
| F05 | 无收益行为 | C2-Z4 | - | CF |
| F12 | 版本差异记录 | C1-Z3 | C2-Z3, C3-Z3 | CF |
| F14 | 记忆一致性 | C1-Z4 | C3-Z5, C4-Z4 | CF |
| F15 | 神话壳 | C1-Z5 | C2-Z6 | CF |
| F21 | 无意义判词 | C4-Z6 | C5-Z7 | CF |
| F22 | 冗余字段 | CF-Z1 | CF-Z3 | CF-Z3 |
| F23 | 非最优解保留 | C3-Z4 | C5-Z5 | CF-Z4 |

---

*文档生成时间: 2026-01-21*  
*基于游戏数据版本: v1.0*
