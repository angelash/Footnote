# Document-Code Synchronization Checker

文档-代码同步检查工具，确保设计文档和代码实现保持一致。

## 功能

1. **接口检查**：比较 Spec 文档中定义的 TypeScript 接口与代码中的实际实现
2. **颜色常量检查**：比较 Art Bible 中定义的色值与 `ui.config.ts` 中的实现
3. **数据结构一致性**：检测 enum、type、interface 的成员差异

## 使用方式

### 基本用法

```bash
# 从项目根目录运行
node workflows/project/tools/doc-code-sync/sync-checker.mjs

# 或使用 npm script
npm run sync:check
```

### 命令行选项

```bash
# 运行所有检查（默认）
node sync-checker.mjs

# 仅检查接口定义
node sync-checker.mjs --interfaces

# 仅检查常量值（颜色等）
node sync-checker.mjs --constants

# 详细输出模式
node sync-checker.mjs --verbose
node sync-checker.mjs -v

# JSON 格式输出（便于 CI 集成）
node sync-checker.mjs --json

# 显示帮助
node sync-checker.mjs --help
```

### 输出示例

```
📋 Document-Code Synchronization Checker

============================================================

🔍 Checking interfaces...
  📄 design\ai-native\02_specs\systems\ability_system_spec.md: 8 interfaces
  📦 game\src\types\index.ts: 29 interfaces

🎨 Checking color constants...
  📄 design/ai-native/01_bibles/art_bible.md: 16 colors
  📦 game/src/config/ui.config.ts: 7 colors

============================================================
📊 SYNC CHECK REPORT
============================================================

📋 Summary:
   Total checks: 9
   Matches:      2 ✅
   Mismatches:   7 ❌
   Warnings:     35 ⚠️
```

## 配置

在 `sync-checker.mjs` 中可以修改 `CONFIG` 对象：

```javascript
const CONFIG = {
  // Spec 文档路径
  specDirs: [
    'design/ai-native/02_specs/systems',
  ],
  
  // 代码路径
  codeDirs: [
    'game/src/types',
    'game/src/systems',
    'game/src/config',
  ],
  
  // 文档色彩定义路径
  colorDocPath: 'design/ai-native/01_bibles/art_bible.md',
  
  // 代码色彩定义路径
  colorCodePath: 'game/src/config/ui.config.ts',
  
  // 接口映射（Spec 名称 -> 代码名称）
  interfaceMappings: {
    // 'ISpecInterface': 'ICodeInterface'
  },
  
  // 忽略的接口（正则表达式）
  ignoredInterfaces: [
    /^I.*Internal$/,  // 内部接口
    /^I.*Config$/,    // 配置接口
  ],
};
```

## 文件结构

```
doc-code-sync/
├── sync-checker.mjs        # 主入口脚本
├── compare.mjs             # 比较和报告生成模块
├── extractors/
│   ├── spec-extractor.mjs  # 从 Markdown 提取接口
│   ├── code-extractor.mjs  # 从 TypeScript 提取接口
│   └── color-extractor.mjs # 提取颜色常量
└── README.md               # 本说明文档
```

## 检查规则

### 接口检查

- 比较 interface 成员名称和类型
- 检测可选性（`?`）差异
- 比较 type 别名定义
- 比较 enum 成员和值

### 颜色检查

- 从 Markdown 表格提取颜色定义
- 从代码中提取颜色常量
- 比较颜色值是否在文档中定义

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 所有检查通过 |
| 1 | 发现不一致或执行错误 |

## CI 集成

在 CI 流水线中使用 JSON 输出：

```yaml
- name: Check doc-code sync
  run: |
    node workflows/project/tools/doc-code-sync/sync-checker.mjs --json > sync-report.json
    if [ $? -ne 0 ]; then
      echo "Documentation and code are out of sync!"
      cat sync-report.json
      exit 1
    fi
```

## 常见问题

### Q: 为什么某些接口被标记为"only in code"？

A: 这些接口存在于代码中但未在 Spec 文档中定义。这可能是：
- 内部实现接口（不需要文档）
- 遗漏的文档（需要补充）

### Q: 如何忽略某些接口？

A: 在 `CONFIG.ignoredInterfaces` 中添加正则表达式：

```javascript
ignoredInterfaces: [
  /^I.*Internal$/,
  /^IMySpecialInterface$/,
]
```

### Q: 颜色检查总是显示不匹配？

A: 检查：
1. Art Bible 中的颜色是否使用了标准格式（`#RRGGBB`）
2. 代码中的颜色常量是否在正确的文件中

## 版本历史

- **v1.0** (2026-01-19)
  - 初始版本
  - 支持 interface/type/enum 提取
  - 支持颜色常量比较
  - 支持 JSON 输出
