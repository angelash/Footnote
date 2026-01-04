# 像素 PNG 资源生成方案（Footnote）

本项目默认美术主风格是 **扁平化 SVG + 线框深度视觉**；像素风属于**备选风格**，更适合用在：

- 小图标（能力/计数器/道具）
- 轻量特效（污染噪点、裂痕、系统更正标记）
- tiles（平台/墙体等可复用地形）
- 像素 UI（面板/按钮/角标等）

本方案的实现脚本：`scripts/generate_pixel_assets.py`  
输出目录默认：`assets/images/pixel/`

---

## 核心做法（“参考 svg_examples 生成 png 的方法”）

你在 `svg_examples/game_assets/generate_pixel_art.py` 里看到的关键技巧是：

1. **先在低分辨率画布上画**（例如 16×16、24×24、64×16）
2. 再用 **最近邻（NEAREST）放大**到可用分辨率（例如 ×4 → 64×64、96×96）

最近邻放大不会产生模糊插值，像素边缘会保持锐利，这是像素风成立的基础。

在 `scripts/generate_pixel_assets.py` 里，我在这个基础上额外加了：

- **1px 描边**：用 alpha 邻域做黑色描边，提高小尺寸可读性
- **少量噪点**：用随机种子（可复现）制造“漂移/污染”的颗粒感
- **限定调色板**：使用项目既有暗色背景 + 荧光强调色（A/R/B/Y）

---

## 现在已经生成了什么

运行：

- `python scripts/generate_pixel_assets.py`
- 或 `npm run generate:pixel-assets`
- 或 `npm run generate:pixel-assets:128`（一键生成：scale=8 → 图标 128×128，max-colors=24，并带序列帧）

会生成（默认 scale=4）：

- `assets/images/pixel/icons/abilities/*.png`（能力图标）
- `assets/images/pixel/icons/counters/*.png`（R/P/W 计数器）
- `assets/images/pixel/icons/items/*.png`（道具图标）
- `assets/images/pixel/icons/effects/*.png`（裂痕/污染/字段接受/系统更正）
- `assets/images/pixel/sprites/px_sprite_ghost_idle_strip.png`（4 帧幽灵 idle 条带示例）
- `assets/images/pixel/tiles/px_tiles_platform_basic.png`（4 个 16×16 tile 示例）
- `assets/images/pixel/ui/px_ui_panel_9slice.png`（简易 9-slice 面板示例）
- `assets/images/pixel/sequences/*`（序列帧：loader / glitch / field_accept，含逐帧 PNG + strip）

---

## 这种方案的“最复杂”能到哪

这里要分清两种“复杂”：

### 1) 画面信息复杂度（像素能承载多少细节）

取决于**低分辨率底图的尺寸**与**色数**：

- **16×16 / 24×24**：适合符号化图标（能力、状态、按钮标记）
- **32×32 / 48×48**：可做小道具、敌人小怪、简化人物
- **64×64**：能做“可读的人形 + 简单光照 + 2–4 帧动作”
- **96×96 / 128×128**：可以承载更完整的角色立绘/半身像，但“自动生成”容易变得花且不稳，需要更精细的规则/模板

色数建议控制在 **8–24 色**（含透明），再配合 1px 描边/局部抖动，整体会更“像素”而不是“缩小的插画”。

### 2) 生产复杂度（脚本能自动化到什么程度）

在**纯程序化**前提下（当前脚本就是这个路线）：

- ✅ **批量生成几十到几百个**小图标/tiles 完全没问题（规则明确、结构重复）
- ✅ **动画帧**也可以（比如 4–16 帧条带/图集），适合“漂浮/闪烁/脉冲”这类规则化运动
- ⚠️ 对“有机复杂形体”（复杂人物脸部、衣褶、手势、写实光照）：
  - 脚本能做，但需要非常多的模板/参数调优，且质量不稳定
  - 更推荐：人工像素画 / 或先矢量渲染再走“像素化+调色板+抖动”的半自动流程

---

## 扩展建议：SVG → 像素 PNG（另一条路线）

如果你希望“用现有 SVG 资产快速得到像素版”，流程通常是：

1. SVG 渲染到高分辨率 PNG（例如 512×512）
2. 下采样到目标像素分辨率（例如 32×32）
3. 调色板量化（限制色数）+ 可选抖动（Bayer/Floyd-Steinberg）
4. 最近邻放大回显示分辨率（例如 ×4）

这条路线需要一个 SVG 渲染器（常见：Inkscape、CairoSVG），当前脚本为了保持“零新增依赖”，没有默认集成；如果你确定要走这条，我可以把它作为 **可选模式**加进去（检测到依赖就启用）。

---

## 如何新增一个像素资源

在 `scripts/generate_pixel_assets.py`：

1. 写一个 `def _asset_xxx(img, rng): ...` 的绘制函数（在低分辨率画布上画）
2. 在 `_assets()` 里新增一条 `PixelAsset(path=..., base_size=(w,h), draw=_asset_xxx)`
3. 运行生成脚本即可


