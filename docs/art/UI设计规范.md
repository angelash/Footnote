# UI设计规范

## 整体风格
- **风格**: 科幻UI、暗色主题
- **交互**: 触屏优化
- **布局**: 竖屏 750×1334px

---

## 色彩规范

```css
/* 背景层 */
--ui-bg-primary: rgba(10, 10, 15, 0.95);
--ui-bg-secondary: rgba(20, 20, 25, 0.9);
--ui-bg-panel: rgba(30, 30, 36, 0.85);

/* 边框 */
--ui-border: rgba(100, 100, 120, 0.3);
--ui-border-active: rgba(0, 255, 170, 0.5);

/* 文字 */
--ui-text-primary: #E8E6E3;
--ui-text-secondary: #A8A6A3;
--ui-text-accent: #00FFAA;

/* 按钮 */
--ui-btn-normal: rgba(60, 60, 70, 0.8);
--ui-btn-hover: rgba(80, 80, 90, 0.9);
--ui-btn-active: rgba(0, 255, 170, 0.3);
```

---

## 核心UI组件

### 对话框
```
位置: 底部固定，距底20px
尺寸: 宽度90%，高度自适应（max 40%屏高）
样式:
  - 深色半透明背景
  - 1px细边框
  - 圆角8px
  - 角色名高亮（荧光色）
  - 文字逐字显示（打字机效果）
交互:
  - 点击/空白处：继续
  - 长按：查看详情
  - 快速点击：跳过动画
```

### 卡片弹窗
```
位置: 居中
尺寸: 300×450px
样式:
  - 正面：简洁信息
  - 背面：详细内容
  - 状态标签（左上角）
  - 特效文字（涂改/闪烁）
交互:
  - 点击：翻面
  - 滑动：切换卡片
  - 长按：查看详情
  - 点击外部：关闭
```

### 时间节点UI
```
位置: 右侧边栏（滑出）
形式: 竖版时间轴
样式:
  - 节点卡片垂直排列
  - 当前位置高亮
  - 可回溯节点点亮
  - 污染度红色指示
交互:
  - 点击节点：选择
  - 长按：预览详情
  - 确认按钮：执行回溯
```

### 物品栏
```
位置: 底部抽屉（上滑展开）
形式: 网格布局
样式:
  - 分类标签页
  - 物品图标网格
  - 新获得标记（光点）
  - 数量角标
交互:
  - 上滑：展开
  - 下滑：收起
  - 点击物品：查看详情
  - 长按：使用/装备
```

### 暂停菜单
```
位置: 全屏覆盖
样式:
  - 半透明黑色背景
  - 居中菜单面板
  - 按钮垂直排列
选项:
  - 继续游戏
  - 存档
  - 读档
  - 设置
  - 返回主菜单
```

### 设置面板
```
位置: 全屏覆盖
分组:
  - 音量设置（BGM/SFX/环境音）
  - 文字速度
  - 自动播放
  - 语言（预留）
交互:
  - 滑块：数值调节
  - 开关：启用/禁用
```

---

## 按钮规范

### 主按钮
```
尺寸: 280×56px
样式:
  - 圆角28px
  - 渐变背景（深灰→中灰）
  - 细边框
  - 文字居中
状态:
  - Normal: 基础样式
  - Hover: 边框高亮
  - Active: 背景荧光
  - Disabled: 50%透明度
```

### 图标按钮
```
尺寸: 48×48px
样式:
  - 圆形或圆角方形
  - 图标居中
  - 可选文字标签
```

---

## 图标规范

### 尺寸
```
小图标: 24×24px
中图标: 32×32px
大图标: 48×48px
```

### 类型列表
| 图标 | 用途 |
|------|------|
| icon_pause | 暂停 |
| icon_settings | 设置 |
| icon_inventory | 物品栏 |
| icon_timeline | 时间线 |
| icon_depth | 深度感知 |
| icon_intervene | 深度介入 |
| icon_rewind | 时间回溯 |
| icon_save | 存档 |
| icon_load | 读档 |
| icon_close | 关闭 |

---

## AI生图提示词模板

### UI元素通用模板
```
pixel art game UI element,
[组件描述],
dark sci-fi theme,
[色彩描述],
transparent background,
clean minimalist design,
no text (or minimal text),
no watermark
```

### 示例：对话框背景
```
pixel art game UI element,
dialogue box panel,
dark sci-fi theme with cyan accents,
rounded corners, semi-transparent,
900x300 pixels,
clean minimalist design,
no text, no watermark
```

