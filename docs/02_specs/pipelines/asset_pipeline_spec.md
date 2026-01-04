# Asset Pipeline Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: art_bible.md
> **下游交付**: L3 美术执行岗、L2 工具组长

---

## 1. 概述

定义美术资产从创作/生成到入库的标准流程。

### 1.1 与 AI-Native 固定流程（n8n）的对齐说明（现状）

- **自动化执行入口（推荐）**：`POST http://localhost:5680/webhook/fixed-flow`（见 `docs/02_specs/pipelines/n8n_fixed_flow_standard.md`）
- **默认门禁命令（当前实现）**：工作流运行 `npm run validate --if-present`
  - 如果你希望“命名/尺寸/格式/质量”校验成为强门禁，需要把资产校验器**接入到** `npm run validate`（或在工作流里扩展 Run Validate 命令）
- **提交策略（v1 PoC）**：fixed-flow 默认会 `commit/push main`；大批量资产建议拆分并走分支/PR（后续演进项）

---

## 2. 资产类型

| 类型 | 格式 | 路径 | 校验器 |
|------|------|------|--------|
| UI图素 | PNG/SVG | `assets/ui/` | ui_asset_validator |
| 角色帧 | PNG | `assets/characters/` | char_asset_validator |
| 场景图块 | PNG | `assets/tiles/` | tile_asset_validator |
| 场景道具 | PNG | `assets/props/` | prop_asset_validator |
| VFX序列帧 | PNG | `assets/vfx/` | vfx_asset_validator |
| 音频 | OGG | `assets/audio/` | audio_asset_validator |

---

## 3. 命名规范（强制）

### 3.1 通用格式
```
{CATEGORY}_{SUBCATEGORY}_{NAME}_{STATE/INDEX}.{ext}
```

### 3.2 各类型示例

| 类型 | 示例 |
|------|------|
| UI按钮 | `UI_Button_Primary_normal.png` |
| UI图标 | `UI_Icon_Ability_Depth.png` |
| 角色帧 | `CHAR_Player_Idle_0001.png` |
| 场景地块 | `ENV_Tile_Grass_A.png` |
| 场景道具 | `ENV_Prop_Crate_01.png` |
| VFX | `VFX_ClickConfirm_0001.png` |
| BGM | `BGM_C0_Z1_Main.ogg` |
| SFX | `SFX_UI_Click.ogg` |

### 3.3 命名校验正则
```typescript
const namingPatterns = {
  ui: /^UI_[A-Z][a-zA-Z]+_[A-Z][a-zA-Z0-9]+_(normal|hover|pressed|disabled|active)?\.(png|svg)$/,
  char: /^CHAR_[A-Z][a-zA-Z]+_[A-Z][a-zA-Z]+_\d{4}\.(png)$/,
  env: /^ENV_(Tile|Prop|BG)_[A-Z][a-zA-Z0-9]+_[A-Z0-9]+\.(png)$/,
  vfx: /^VFX_[A-Z][a-zA-Z0-9]+_\d{4}\.(png)$/,
  audio: /^(BGM|SFX|AMB)_[A-Z][a-zA-Z0-9_]+\.(ogg)$/,
};
```

---

## 4. 尺寸规范（强制）

| 类型 | 尺寸 | 格式 | 备注 |
|------|------|------|------|
| UI按钮 | 128×48 | PNG/SVG | 可九宫格 |
| UI图标 | 32×32 | PNG/SVG | 1:1比例 |
| 角色帧 | 256×256 | PNG | 底边居中锚点 |
| 场景地块 | 64×64 | PNG | 无缝拼接 |
| 场景道具 | 128×128 | PNG | 底边居中锚点 |
| VFX帧 | 256×256 | PNG | 中心锚点 |

### 4.1 尺寸校验
```typescript
const sizeRules = {
  'UI_Button': { width: 128, height: 48, tolerance: 0 },
  'UI_Icon': { width: 32, height: 32, tolerance: 0 },
  'CHAR': { width: 256, height: 256, tolerance: 0 },
  'ENV_Tile': { width: 64, height: 64, tolerance: 0 },
  'ENV_Prop': { width: 128, height: 128, tolerance: 32 },
  'VFX': { width: 256, height: 256, tolerance: 0 },
};
```

---

## 5. 质量规范

### 5.1 图像质量
- **透明度**: 边缘干净，无毛边
- **色彩**: 符合 Art Bible 色板
- **分辨率**: 像素艺术无模糊

### 5.2 音频质量
- **采样率**: 44100Hz
- **比特率**: 128kbps+
- **响度**: BGM -12dBFS, SFX -6dBFS

---

## 6. 入库流程

```
┌──────────────┐
│  生成/创作   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  本地预览    │ ← 确认效果
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  命名规范化   │ ← 脚本辅助
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  尺寸/格式调整│ ← 脚本辅助
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  本地校验    │ ← npm run validate:assets
└──────┬───────┘
       │ 通过
       ▼
┌──────────────┐
│  提交 PR     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  CI 校验     │ ← GitHub Actions
└──────┬───────┘
       │ 通过
       ▼
┌──────────────┐
│  Review      │ ← 美术总监/组长
└──────┬───────┘
       │ 批准
       ▼
┌──────────────┐
│  合并入库    │
└──────────────┘
```

---

## 7. AI生图流程

### 7.1 生成步骤
1. **需求定义**: 明确类型、尺寸、风格参考
2. **Prompt编写**: 按 AI Art Generation 规范
3. **批量生成**: 4-8张候选
4. **人工筛选**: 选取最佳
5. **后处理**: 裁剪、调色、去背景
6. **入库流程**: 同上

### 7.2 Prompt模板
```
Style: 2D pixel art, low saturation, cyberpunk-wasteland fusion
Subject: [具体描述]
Colors: [参考Art Bible色板]
Size: [目标尺寸]
Background: transparent
```

---

## 8. 版本控制

### 8.1 变更规则
- 新增资产：新文件，不覆盖
- 替换资产：新版本后缀 `_v2`，保留旧版
- 删除资产：移动到 `_deprecated/`

### 8.2 大文件处理
- 单文件 > 1MB：考虑 Git LFS
- 批量资产：分 PR 提交

---

## 9. 校验器设计

```typescript
interface IAssetValidator {
  validateNaming(filename: string): ValidationResult;
  validateSize(filepath: string): Promise<ValidationResult>;
  validateFormat(filepath: string): Promise<ValidationResult>;
  validateQuality(filepath: string): Promise<ValidationResult>;
}

// 校验命令
// npm run validate:assets -- --path assets/ui/
// npm run validate:assets -- --type char
```

---

## 10. 边界约束

### 10.1 粒度限制
- 单 PR 资产文件: ≤ 20 个
- 单文件大小: ≤ 2MB
- 单批次生成: ≤ 50 张

### 10.2 禁区
- 禁止合并未校验的资产
- 禁止非规范命名
- 禁止未压缩的大文件

---

## 11. 验收标准

- [ ] 命名符合规范
- [ ] 尺寸符合要求
- [ ] 格式正确
- [ ] 质量达标
- [ ] CI 校验绿色

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

