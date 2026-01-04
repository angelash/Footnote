# UI设计规范 v2.0

> **版本**: 2.0 | **更新日期**: 2025-12-25  
> **对齐文档**: 美术工作流总纲 v2、网格与尺寸语法规范

---

## 一、整体风格

- **风格**: 科幻极简、暗色主题、系统感
- **交互**: 触屏优化（竖版手机）
- **画布**: 750×1334px（游戏画面）
- **UI基准单位**: UU (UI Unit) = 8px

---

## 二、UI Unit (UU) 系统

### 2.1 基准定义

```
1 UU = 8px

所有UI元素尺寸必须是UU的整数倍：
- 最小触控区域: 6UU × 6UU = 48×48px
- 标准按钮高度: 7UU = 56px
- 大按钮高度: 8UU = 64px
- 面板圆角: 1UU = 8px
- 元素间距: 1-3UU
```

### 2.2 常用尺寸速查

| 元素 | UU值 | 像素值 |
|------|------|--------|
| 小图标 | 3×3 | 24×24 |
| 中图标 | 4×4 | 32×32 |
| 大图标 | 6×6 | 48×48 |
| 图标按钮 | 6×6 | 48×48 |
| 主按钮 | 35×7 | 280×56 |
| 选项按钮 | 80×10 | 640×80 |
| 头像框 | 25×25 | 200×200 |
| 卡片 | 38×56 | 300×450 |

---

## 三、色彩规范

### 3.1 CSS变量定义

```css
:root {
  /* ═══ 背景层 ═══ */
  --ui-bg-primary: rgba(10, 10, 15, 0.95);    /* 最深背景 */
  --ui-bg-secondary: rgba(20, 20, 25, 0.9);   /* 次级背景 */
  --ui-bg-panel: rgba(30, 30, 36, 0.85);      /* 面板背景 */
  --ui-bg-overlay: rgba(0, 0, 0, 0.7);        /* 遮罩层 */
  
  /* ═══ 边框 ═══ */
  --ui-border-default: rgba(100, 100, 120, 0.3);
  --ui-border-active: rgba(0, 255, 240, 0.5);  /* 激活态 */
  --ui-border-warning: rgba(255, 51, 102, 0.5);
  
  /* ═══ 文字 ═══ */
  --ui-text-primary: #E8E6E3;                 /* 主文字 */
  --ui-text-secondary: #A8A6A3;               /* 次级文字 */
  --ui-text-accent: #00FFF0;                  /* 强调文字(系统青) */
  --ui-text-warning: #FF3366;                 /* 警告文字 */
  --ui-text-gold: #FFD93D;                    /* 记忆金 */
  
  /* ═══ 按钮 ═══ */
  --ui-btn-normal: rgba(60, 60, 70, 0.8);
  --ui-btn-hover: rgba(80, 80, 90, 0.9);
  --ui-btn-active: rgba(0, 255, 240, 0.3);
  --ui-btn-disabled: rgba(60, 60, 70, 0.4);
  
  /* ═══ 状态色 ═══ */
  --ui-state-info: #00FFF0;                   /* 信息/可交互 */
  --ui-state-danger: #FF3366;                 /* 危险/消耗 */
  --ui-state-success: #4ADE80;                /* 成功 */
  --ui-state-special: #A855F7;                /* 高维紫 */
}
```

### 3.2 配色规则

| 场景 | 主色 | 强调色 |
|------|------|--------|
| 默认UI | 深灰蓝 | 系统青 |
| 警告/危险 | 深灰蓝 | 警告红 |
| 成就/收集 | 深灰蓝 | 记忆金 |
| 特殊能力 | 深灰蓝 | 高维紫 |

---

## 四、核心UI组件

### 4.1 对话框

```yaml
位置: 底部固定，距底 2.5UU (20px)
宽度: 90%屏宽 (675px)
高度: 自适应，最大 40%屏高 (534px)
内边距: 2UU (16px)
圆角: 1UU (8px)

样式:
  背景: var(--ui-bg-panel)
  边框: 1px solid var(--ui-border-default)
  阴影: 0 -2px 10px rgba(0,0,0,0.3)

子元素:
  角色名:
    字号: 2UU (16px)
    颜色: var(--ui-text-accent)
    位置: 左上角
  对话文字:
    字号: 2.25UU (18px)
    行高: 1.6
    颜色: var(--ui-text-primary)
  头像框:
    尺寸: 10UU × 10UU (80×80px)
    位置: 左侧或对话框上方
    边框: 2px solid var(--ui-border-active)

交互:
  - 点击任意处: 继续/跳过动画
  - 长按: 查看说话人详情
```

### 4.2 卡片组件

```yaml
尺寸: 38UU × 56UU (300×450px)
圆角: 1.5UU (12px)
边距: 2UU (16px)

状态:
  - 正面: 简洁信息+插图
  - 背面: 详细文字内容
  
特效支持:
  - 涂改痕: 文字被涂抹效果
  - 字段闪现: 底部极短显示
  - 错位文字: 1-2px偏移
  - 发光边框: 祈愿卡专用

交互:
  - 点击: 翻面
  - 滑动: 切换卡片
  - 点击外部: 关闭
```

### 4.3 时间节点UI

```yaml
位置: 右侧边栏（滑出）
宽度: 40%屏宽 (300px)
形式: 竖版时间轴

节点规格:
  尺寸: 32UU × 8UU (256×64px)
  间距: 1.5UU (12px)
  圆角: 1UU (8px)

状态:
  - 当前位置: 边框高亮 + 发光
  - 可回溯: 正常显示
  - 已污染: 红色指示 + 噪点纹理
  - 不可选: 灰化 + 锁定图标

交互:
  - 点击节点: 选中
  - 长按: 预览详情
  - 确认按钮: 执行回溯
```

### 4.4 物品栏

```yaml
位置: 底部抽屉（上滑展开）
高度: 收起 8UU (64px), 展开 60%屏高

布局:
  网格: 5列
  单元格: 12UU × 12UU (96×96px)
  间距: 1UU (8px)
  
分类标签:
  高度: 5UU (40px)
  数量: 4个（全部/物品/档案/关键）

物品格:
  图标区: 8UU × 8UU (64×64px)
  状态角标: 3UU × 3UU (24×24px)
  新物品: 发光动画
  数量: 右下角数字

交互:
  - 上滑: 展开
  - 下滑: 收起
  - 点击物品: 查看详情
  - 长按: 使用/装备
```

### 4.5 暂停菜单

```yaml
位置: 全屏覆盖
背景: var(--ui-bg-overlay)

菜单面板:
  宽度: 50UU (400px)
  内边距: 3UU (24px)
  圆角: 1.5UU (12px)
  背景: var(--ui-bg-panel)

按钮列表:
  - 继续游戏
  - 存档
  - 读档
  - 设置
  - 返回主菜单
  
按钮间距: 1.5UU (12px)
```

---

## 五、9-slice面板系统

### 5.1 切片规则

所有可缩放面板必须使用9-slice切片：

```
┌───┬───────────┬───┐
│ 1 │     2     │ 3 │  边角固定(不缩放)
├───┼───────────┼───┤
│ 4 │     5     │ 6 │  中间可缩放
├───┼───────────┼───┤
│ 7 │     8     │ 9 │  
└───┴───────────┴───┘
```

### 5.2 标准切片尺寸

```yaml
边角尺寸: 2UU × 2UU (16×16px)
边缘宽度: 1UU (8px)

文件命名: panel_{name}_9slice.webp
源文件尺寸: 至少 64×64px (包含完整9区域)
```

### 5.3 面板类型

| 类型 | 用途 | 边角样式 |
|------|------|----------|
| panel_default | 通用面板 | 直角+1px边框 |
| panel_dialogue | 对话框 | 圆角8px |
| panel_tooltip | 提示框 | 尖角+圆角 |
| panel_system | 系统消息 | 科技感边角 |
| panel_warning | 警告框 | 红色边角 |

---

## 六、按钮规范

### 6.1 主按钮

```yaml
尺寸: 35UU × 7UU (280×56px)
圆角: 3.5UU (28px) # 全圆角
内边距: 0 3UU

样式:
  背景: linear-gradient(180deg, #4A4A5A, #3A3A4A)
  边框: 1px solid var(--ui-border-default)
  文字: var(--ui-text-primary), 2.25UU (18px), 居中

状态:
  Normal: 基础样式
  Hover: 边框变为 var(--ui-border-active)
  Active: 背景变为 var(--ui-btn-active)
  Disabled: opacity 0.5, 无交互
```

### 6.2 选项按钮（对话选项）

```yaml
尺寸: 80UU × 10UU (640×80px)
圆角: 1UU (8px)
内边距: 0 2UU

样式:
  背景: var(--ui-bg-panel)
  边框: 1px solid var(--ui-border-default)
  文字: var(--ui-text-primary), 2UU (16px), 左对齐
  
选中态: 
  边框: var(--ui-border-active)
  背景: rgba(0, 255, 240, 0.1)
```

### 6.3 图标按钮

```yaml
尺寸: 6UU × 6UU (48×48px)
圆角: 1UU (8px) 或 圆形
图标尺寸: 4UU × 4UU (32×32px)

样式:
  背景: transparent 或 var(--ui-bg-panel)
  边框: 可选 1px solid var(--ui-border-default)
```

---

## 七、交互状态系统

所有可交互UI元素必须具备以下状态：

### 7.1 状态定义

| 状态 | 描述 | 视觉变化 |
|------|------|----------|
| Default | 默认状态 | 基础样式 |
| Hover | 悬停/触控接近 | 边框高亮 |
| Active | 按下/选中 | 背景变亮+缩放0.98 |
| Disabled | 禁用 | 灰化+opacity 0.5 |
| Focus | 键盘焦点 | 外发光轮廓 |

### 7.2 过渡动画

```css
.ui-interactive {
  transition: all 0.15s ease-out;
}

.ui-interactive:active {
  transform: scale(0.98);
}
```

---

## 八、图标规范

### 8.1 尺寸标准

```yaml
小图标: 3UU × 3UU (24×24px) # 状态角标
中图标: 4UU × 4UU (32×32px) # 菜单图标
大图标: 6UU × 6UU (48×48px) # 功能按钮
```

### 8.2 设计约束

```yaml
风格: 像素风线性图标
线宽: 2px (1像素单位)
颜色: 单色，使用 var(--ui-text-primary)
激活色: var(--ui-text-accent)
内边距: 10% (图标内容不能顶边)
```

### 8.3 图标清单

| 图标 | 用途 | 尺寸 |
|------|------|------|
| icon_pause | 暂停 | 大 |
| icon_settings | 设置 | 大 |
| icon_inventory | 物品栏 | 大 |
| icon_timeline | 时间线 | 大 |
| icon_depth | 深度感知 | 大 |
| icon_intervene | 深度介入 | 大 |
| icon_rewind | 时间回溯 | 大 |
| icon_save | 存档 | 中 |
| icon_load | 读档 | 中 |
| icon_close | 关闭 | 中 |
| icon_back | 返回 | 中 |
| icon_new | 新物品标记 | 小 |
| icon_scar | 伤痕标记 | 小 |

---

## 九、AI生成配置

### 9.1 UI元素提示词模板

```yaml
全局前缀: |
  pixel art game UI element,
  dark sci-fi theme, cyberpunk aesthetic,
  transparent background,
  clean minimalist design,
  consistent 2px pixel size,
  no text (unless specified), no watermark

面板类:
  prompt: |
    {全局前缀}
    [面板类型] panel frame,
    rounded corners [圆角值]px,
    dark semi-transparent background,
    subtle cyan border glow,
    [尺寸]

按钮类:
  prompt: |
    {全局前缀}
    game button sprite sheet, 4 states,
    (normal, hover, active, disabled),
    horizontal strip layout,
    [尺寸] each state,
    rounded [圆角值]px

图标类:
  prompt: |
    {全局前缀}
    game icon, [图标描述],
    [尺寸],
    single color (light gray #E8E6E3),
    2px line weight
```

### 9.2 锚定图要求

```yaml
UI锚定图:
  style: assets/anchors/style_ui_v1.webp
  palette: assets/anchors/palette_ui.webp
  
生成模式: generate (UI元素不需要序列帧)
参考权重: 0.8
```

---

## 十、QC验收清单

### 10.1 尺寸检查

- [ ] 所有尺寸为UU(8px)整数倍
- [ ] 触控区域 ≥ 48×48px
- [ ] 文字最小 14px (1.75UU)

### 10.2 视觉检查

- [ ] 风格与锚定图一致
- [ ] 配色符合CSS变量定义
- [ ] 9-slice切片正确
- [ ] 无文字/水印（除非特意设计）

### 10.3 状态检查

- [ ] 4种交互状态齐全
- [ ] 过渡动画流畅
- [ ] 禁用态视觉明确

---

*文档版本：v2.0 | 最后更新：2025-12-25*
