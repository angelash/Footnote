# ChromeMCP 交互测试框架

基于 Chrome DevTools MCP 服务器的真实浏览器交互测试，用于验证 Footnote 游戏的所有功能。

## 测试结构

```
interactive/
├── helpers/              # 测试辅助工具
│   ├── mcp-client.ts     # MCP 客户端封装
│   ├── game-helpers.ts   # 游戏相关辅助函数
│   └── assertions.ts     # 自定义断言
├── specs/                # 测试用例
│   ├── 01-boot.spec.ts   # 启动和加载测试
│   ├── 02-menu.spec.ts   # 主菜单测试
│   ├── 03-movement.spec.ts   # 移动控制测试
│   ├── 04-ui.spec.ts     # UI 系统测试
│   ├── 05-dialogue.spec.ts   # 对话系统测试
│   ├── 06-narrative.spec.ts  # 叙事系统测试
│   ├── 07-save.spec.ts   # 存档系统测试
│   ├── 08-ability.spec.ts    # 深度能力测试
│   └── 09-preview.spec.ts    # 预览场景测试
├── runner.ts             # 测试运行器
└── config.ts             # 测试配置
```

## 使用方法

### 前置条件

1. 启动游戏开发服务器：`npm run dev`
2. 打开 Chrome 浏览器访问游戏
3. 启用 Chrome DevTools MCP 服务器

### 运行测试

```bash
# 运行所有交互测试
npm run test:interactive

# 运行单个测试文件
npm run test:interactive -- --file=boot

# 运行带截图模式
npm run test:interactive -- --screenshot
```

## MCP 工具说明

测试使用 `user-chrome-devtools` MCP 服务器提供的工具：

| 工具 | 用途 |
|---|---|
| `take_snapshot` | 获取页面 a11y 树快照 |
| `take_screenshot` | 截图验证 |
| `click` | 点击元素 |
| `press_key` | 键盘输入 |
| `evaluate_script` | 执行 JS 获取游戏状态 |
| `navigate_page` | 页面导航 |
| `drag` | 拖拽操作 |

## 测试覆盖功能

- [x] 游戏启动和加载
- [x] 主菜单交互
- [x] WASD/方向键移动
- [x] 对话系统
- [x] 卡片系统
- [x] 物品栏
- [x] 暂停菜单
- [x] 叙事引擎
- [x] 存档系统
- [x] 深度能力系统
- [x] 预览场景

## 注意事项

1. 由于 Phaser 使用 Canvas 渲染，大部分 UI 元素无法通过 a11y 树获取
2. 需要通过 `evaluate_script` 获取游戏内部状态
3. Canvas 交互需要计算坐标点击
