# 美术资产 QC 自动化脚本

## 概述

`asset-qc.mjs` 是美术资产质量检查（QC）自动化脚本，用于确保所有美术资源符合 Art Bible 规范。

## 功能

### 1. 图片尺寸检查
按照 Art Bible 规格表检查图片尺寸：

| 类型 | 尺寸 | 容差 |
|------|------|------|
| 背景 (bg_) | 750×1334 | 10% |
| 角色立绘 (char_) | 512×512 | 20% |
| 角色精灵 (sprite_) | 128×192 | 20% |
| 头像 (portrait_) | 128×128 | 20% |
| 物件 (obj_) | 64-256×64-256 | 范围 |
| UI图标 (icon_) | 32-64×32-64 | 范围 |
| 卡片 (card_) | 200×280 | 15% |
| 特效 (fx_) | 128-256×128-256 | 范围 |

### 2. 文件命名规范检查
检查文件名是否符合规范：
- 全小写 + 下划线
- 正确的前缀：`bg_`, `char_`, `sprite_`, `portrait_`, `obj_`, `icon_`, `card_`, `fx_`, `bgm_`, `sfx_`, `amb_`

### 3. 文件大小限制检查
防止资源过大影响加载：

| 类型 | 大小限制 |
|------|---------|
| 背景 | 500KB |
| 角色立绘 | 200KB |
| 角色精灵 | 50KB |
| 头像 | 50KB |
| 物件 | 100KB |
| UI图标 | 20KB |
| 卡片 | 100KB |
| 特效 | 100KB |
| BGM | 5MB |
| SFX | 500KB |
| 环境音 | 2MB |

### 4. 色值检查（纯 Node.js 实现）
检查主色 `#00F5D4` 是否在 PNG 图片中正确使用。自动检查特效和能力相关资源。

## 使用方式

### 基本使用

```bash
# 检查所有资产
node game/scripts/qa/asset-qc.mjs

# 只检查图片
node game/scripts/qa/asset-qc.mjs --type image

# 只检查音频
node game/scripts/qa/asset-qc.mjs --type audio

# 检查指定目录
node game/scripts/qa/asset-qc.mjs --path ./game/assets/images

# 输出 JSON 格式
node game/scripts/qa/asset-qc.mjs --json

# 显示详细信息
node game/scripts/qa/asset-qc.mjs --verbose
```

### 在 npm scripts 中使用

在 `package.json` 中添加：

```json
{
  "scripts": {
    "qc:assets": "node scripts/qa/asset-qc.mjs",
    "qc:images": "node scripts/qa/asset-qc.mjs --type image",
    "qc:audio": "node scripts/qa/asset-qc.mjs --type audio"
  }
}
```

### 作为模块导入

```javascript
import { 
  checkImageSize, 
  checkNamingConvention, 
  checkFileSize, 
  generateReport 
} from './qa/asset-qc.mjs';

// 检查图片尺寸
const sizeResult = await checkImageSize('./bg_residential_street.png', { width: 750, height: 1334 });
console.log(sizeResult);
// { passed: true, actual: { width: 750, height: 1334 }, expected: { width: 750, height: 1334 }, message: '尺寸符合要求' }

// 检查命名规范
const namingResult = checkNamingConvention('./bg_residential_street.png');
console.log(namingResult);
// { passed: true, prefix: 'bg', category: '背景', message: '命名规范符合要求' }

// 检查文件大小
const fileSizeResult = checkFileSize('./bg_residential_street.png', 500 * 1024);
console.log(fileSizeResult);
// { passed: true, actual: 256000, limit: 512000, message: '文件大小符合要求' }

// 生成报告
const report = generateReport([sizeResult, namingResult, fileSizeResult]);
console.log(report);
```

## 输出格式

### 控制台输出

```
🔍 开始美术资产 QC 检查...

📁 检查路径: f:\workspace\github\Footnote\game\assets
📋 检查类型: all

📊 找到 150 个文件

============================================================
📊 美术资产 QC 检查报告
============================================================
⏰ 时间: 2026-01-19T12:00:00.000Z
📁 路径: f:\workspace\github\Footnote\game\assets

📈 总体统计:
   总文件数: 150
   ✅ 通过: 140
   ⚠️  警告: 8
   ❌ 错误: 2

📋 检查项统计:
   图片尺寸:
      通过: 45, 失败: 3, 跳过: 5
   命名规范:
      通过: 140, 失败: 10, 跳过: 0
   文件大小:
      通过: 145, 失败: 5, 跳过: 0

⚠️  问题详情:

   【命名规范】
   ⚠️ images/ui/Button_Main.png
      文件名必须为小写字母、数字和下划线: Button_Main

============================================================

退出码: 1 (有错误)
```

### JSON 输出

```json
{
  "timestamp": "2026-01-19T12:00:00.000Z",
  "basePath": "f:\\workspace\\github\\Footnote\\game\\assets",
  "summary": {
    "total": 150,
    "passed": 140,
    "warnings": 8,
    "errors": 2
  },
  "checks": {
    "size": { "passed": 45, "failed": 3, "skipped": 5, "details": [] },
    "naming": { "passed": 140, "failed": 10, "skipped": 0, "details": [] },
    "fileSize": { "passed": 145, "failed": 5, "skipped": 0, "details": [] },
    "color": { "passed": 0, "failed": 0, "skipped": 150, "details": [] }
  },
  "files": [...]
}
```

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 检查通过（无错误） |
| 1 | 检查失败（有错误） |

## 色值检查说明

色值检查功能使用纯 Node.js 实现，无需额外依赖。支持检查：

- PNG 格式图片的主要颜色提取
- 特效资源（`fx_`）是否使用项目强调色 `#00F5D4`
- 深度感知相关资源的色值验证

检查范围：
- `fx_*` 开头的特效文件
- 包含 `ability`、`depth`、`highlight` 的文件名

## 集成到 CI/CD

```yaml
# GitHub Actions 示例
jobs:
  asset-qc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run Asset QC
        run: node game/scripts/qa/asset-qc.mjs
```

## 规格参考

详见：`design/ai-native/01_bibles/art_bible.md`

## 版本历史

- v1.1.0 - 功能增强
  - 启用色值检查（纯 Node.js 实现，无需 sharp 库）
  - 智能检测 assets 目录位置
  - 更新帮助文档

- v1.0.0 - 初始版本
  - 图片尺寸检查
  - 文件命名规范检查
  - 文件大小限制检查
  - JSON/控制台双模式输出
