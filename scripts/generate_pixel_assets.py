#!/usr/bin/env python3
"""
像素 PNG 资源生成器（项目级）

设计目标：
- 以“低分辨率像素画布 + NEAREST 最近邻放大”的方式生成像素风 PNG
- 不依赖除 Pillow(PIL) 以外的第三方库（你的环境已安装 Pillow）
- 面向 Footnote 的暗色 + 荧光强调色体系，适合做：小图标 / 计数器 / 道具 / 轻量特效

运行：
  python scripts/generate_pixel_assets.py

可选参数：
  --out-dir assets/images/pixel
  --scale 4
  --seed 1234
"""

from __future__ import annotations

import argparse
import os
import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence, Tuple

from PIL import Image

Rgba = Tuple[int, int, int, int]


@dataclass(frozen=True)
class PixelAsset:
    path: str
    base_size: Tuple[int, int]
    draw: "Callable[[Image.Image, random.Random], None]"
    scale_override: Optional[int] = None


def _clamp_u8(x: int) -> int:
    return 0 if x < 0 else 255 if x > 255 else x


def _mix(a: Rgba, b: Rgba, t: float) -> Rgba:
    return (
        _clamp_u8(int(a[0] + (b[0] - a[0]) * t)),
        _clamp_u8(int(a[1] + (b[1] - a[1]) * t)),
        _clamp_u8(int(a[2] + (b[2] - a[2]) * t)),
        _clamp_u8(int(a[3] + (b[3] - a[3]) * t)),
    )


def _put(img: Image.Image, x: int, y: int, c: Rgba) -> None:
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), c)


def _rect(img: Image.Image, x0: int, y0: int, x1: int, y1: int, c: Rgba) -> None:
    # inclusive rectangle
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            _put(img, x, y, c)


def _line(img: Image.Image, x0: int, y0: int, x1: int, y1: int, c: Rgba) -> None:
    # Bresenham
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        _put(img, x, y, c)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def _circle(img: Image.Image, cx: int, cy: int, r: int, c: Rgba, fill: bool = True) -> None:
    # midpoint-like; small r only, ok for icons
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            dx = x - cx
            dy = y - cy
            d2 = dx * dx + dy * dy
            if fill:
                if d2 <= r * r:
                    _put(img, x, y, c)
            else:
                if r * r - 2 * r <= d2 <= r * r + 2 * r:
                    _put(img, x, y, c)


def _outline_from_alpha(img: Image.Image, outline: Rgba) -> None:
    """给任何非透明像素做 4 邻域描边（1px）。"""
    src = img.copy()
    for y in range(img.height):
        for x in range(img.width):
            if src.getpixel((x, y))[3] != 0:
                continue
            # 若四邻域存在非透明，则描边
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < img.width and 0 <= ny < img.height and src.getpixel((nx, ny))[3] != 0:
                    img.putpixel((x, y), outline)
                    break


def _noise_speckle(img: Image.Image, rng: random.Random, amount: int, color: Rgba, alpha_only: bool = True) -> None:
    """撒少量噪点，用来做“漂移/污染”的像素质感。"""
    attempts = 0
    placed = 0
    while placed < amount and attempts < amount * 20:
        attempts += 1
        x = rng.randrange(0, img.width)
        y = rng.randrange(0, img.height)
        px = img.getpixel((x, y))
        if alpha_only and px[3] != 0:
            continue
        img.putpixel((x, y), color)
        placed += 1


def _scale_nearest(img: Image.Image, scale: int) -> Image.Image:
    if scale <= 1:
        return img
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def _quantize_rgba(img: Image.Image, max_colors: int, dither: bool) -> Image.Image:
    """
    将 RGBA 图像量化为“最多 max_colors 色”（不含透明语义，透明度沿用原 alpha）。
    注意：这是一种“上限色数”控制，适合像素风的色盘收敛；若本身颜色已很少，结果几乎不变。
    """
    if max_colors <= 0:
        return img

    if img.mode != "RGBA":
        img = img.convert("RGBA")

    alpha = img.getchannel("A")
    rgb = img.convert("RGB")

    dither_mode = Image.Dither.FLOYDSTEINBERG if dither else Image.Dither.NONE
    q = rgb.quantize(colors=max_colors, method=Image.Quantize.MEDIANCUT, dither=dither_mode)
    rgb2 = q.convert("RGB")
    out = rgb2.convert("RGBA")
    out.putalpha(alpha)
    return out


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _save(img: Image.Image, out_path: str) -> None:
    _ensure_dir(os.path.dirname(out_path))
    img.save(out_path)


def _palette_footnote() -> Dict[str, Rgba]:
    # 来自 .cursor/rules/05-assets.mdc 的色彩系统（做了少量取舍以适配像素风）
    return {
        "T": (0, 0, 0, 0),  # transparent
        "K": (10, 10, 15, 255),  # bg-primary
        "D": (20, 20, 25, 255),  # bg-secondary
        "G": (30, 30, 36, 255),  # bg-tertiary-ish
        "W": (232, 230, 227, 255),  # text-primary
        "S": (168, 166, 163, 255),  # text-secondary
        "M": (104, 104, 104, 255),  # text-muted
        "A": (0, 255, 170, 255),  # accent-depth
        "R": (255, 68, 68, 255),  # accent-time
        "B": (74, 158, 255, 255),  # accent-system
        "Y": (255, 215, 0, 255),  # accent-field
    }


def _draw_from_pattern(
    img: Image.Image,
    pattern: Sequence[str],
    palette: Dict[str, Rgba],
    offset: Tuple[int, int] = (0, 0),
) -> None:
    ox, oy = offset
    for y, row in enumerate(pattern):
        for x, ch in enumerate(row):
            if ch == " ":
                continue
            c = palette.get(ch)
            if c is None:
                raise ValueError(f"Unknown palette key: {ch!r}")
            if c[3] == 0:
                continue
            _put(img, ox + x, oy + y, c)


# ============================
# 资产绘制：能力图标
# ============================


def _asset_ability_depth_perception(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：眼睛 + 线框，荧光绿
    _circle(img, 8, 8, 6, _mix(pal["A"], pal["W"], 0.15), fill=False)
    _circle(img, 8, 8, 3, pal["A"], fill=False)
    _circle(img, 8, 8, 1, pal["W"], fill=True)
    _line(img, 3, 8, 13, 8, _mix(pal["A"], pal["W"], 0.25))
    _noise_speckle(img, rng, amount=8, color=_mix(pal["A"], pal["W"], 0.35), alpha_only=True)
    _outline_from_alpha(img, pal["K"])


def _asset_ability_depth_intervention(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：手掌/写入 + 裂痕，荧光绿 + 深色结构
    _rect(img, 5, 4, 10, 10, _mix(pal["A"], pal["W"], 0.15))
    _rect(img, 6, 5, 9, 9, pal["A"])
    # 裂痕
    for i in range(3):
        x0 = 4 + i
        y0 = 11
        x1 = 11 + rng.randint(-1, 1)
        y1 = 13 + rng.randint(-1, 1)
        _line(img, x0, y0, x1, y1, _mix(pal["A"], pal["K"], 0.35))
    _outline_from_alpha(img, pal["K"])


def _asset_ability_time_intervention(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：回溯箭头 + 红色污染噪点
    _circle(img, 8, 8, 6, _mix(pal["R"], pal["W"], 0.15), fill=False)
    _line(img, 8, 8, 8, 4, pal["W"])
    _line(img, 8, 8, 12, 8, pal["W"])
    # 逆时针箭头
    _line(img, 12, 8, 10, 6, pal["R"])
    _line(img, 12, 8, 10, 10, pal["R"])
    _noise_speckle(img, rng, amount=10, color=_mix(pal["R"], pal["W"], 0.2), alpha_only=True)
    _outline_from_alpha(img, pal["K"])


# ============================
# 资产绘制：计数器
# ============================


def _asset_counter_r(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：R = 残差：红色断裂点
    _circle(img, 8, 8, 6, pal["D"], fill=True)
    _circle(img, 8, 8, 6, pal["K"], fill=False)
    _line(img, 4, 12, 12, 4, _mix(pal["R"], pal["W"], 0.1))
    _line(img, 5, 12, 12, 5, pal["R"])
    _noise_speckle(img, rng, amount=6, color=_mix(pal["R"], pal["K"], 0.25), alpha_only=True)
    _outline_from_alpha(img, pal["K"])


def _asset_counter_p(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：P = 压力：蓝色脉冲环
    _circle(img, 8, 8, 6, pal["D"], fill=True)
    _circle(img, 8, 8, 6, _mix(pal["B"], pal["W"], 0.2), fill=False)
    _circle(img, 8, 8, 3, pal["B"], fill=False)
    _circle(img, 8, 8, 1, pal["W"], fill=True)
    _outline_from_alpha(img, pal["K"])


def _asset_counter_w(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：W = 可读性：金色方格（像素网格）
    _rect(img, 2, 2, 13, 13, pal["D"])
    for y in range(3, 13, 2):
        for x in range(3, 13, 2):
            _put(img, x, y, _mix(pal["Y"], pal["W"], 0.2))
    _rect(img, 2, 2, 13, 13, pal["K"])  # 边框
    _outline_from_alpha(img, pal["K"])


# ============================
# 资产绘制：道具
# ============================


def _asset_item_keycard(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    _rect(img, 3, 5, 12, 11, _mix(pal["B"], pal["W"], 0.1))
    _rect(img, 4, 6, 11, 10, pal["B"])
    _rect(img, 5, 7, 10, 7, pal["W"])  # 亮条
    _rect(img, 5, 9, 7, 9, pal["W"])  # 小码
    _outline_from_alpha(img, pal["K"])


def _asset_item_tape(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    _circle(img, 8, 8, 6, _mix(pal["S"], pal["W"], 0.1), fill=True)
    _circle(img, 8, 8, 3, pal["K"], fill=True)
    _line(img, 3, 8, 13, 8, pal["M"])
    _line(img, 8, 3, 8, 13, pal["M"])
    _outline_from_alpha(img, pal["K"])


def _asset_item_wrench(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    metal = _mix(pal["S"], pal["W"], 0.25)
    _line(img, 4, 12, 11, 5, metal)
    _line(img, 5, 12, 12, 5, _mix(metal, pal["W"], 0.15))
    _circle(img, 12, 4, 2, metal, fill=False)
    _circle(img, 4, 12, 2, metal, fill=False)
    _outline_from_alpha(img, pal["K"])


def _asset_item_archive(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 简化“档案夹”像素版（呼应 svg_examples/01_simple_icon.svg）
    _rect(img, 2, 5, 13, 13, _mix(pal["Y"], pal["K"], 0.2))
    _rect(img, 2, 4, 7, 6, _mix(pal["Y"], pal["W"], 0.15))
    _rect(img, 4, 8, 11, 9, pal["W"])
    _outline_from_alpha(img, pal["K"])


# ============================
# 资产绘制：特效/状态
# ============================


def _asset_fx_scar(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：深度伤痕（裂纹 + 荧光边缘）
    core = _mix(pal["K"], pal["M"], 0.6)
    glow = _mix(pal["A"], pal["W"], 0.2)
    _line(img, 3, 3, 12, 12, core)
    _line(img, 4, 3, 12, 11, glow)
    _line(img, 6, 7, 10, 5, core)
    _line(img, 6, 8, 10, 6, glow)
    _noise_speckle(img, rng, amount=8, color=_mix(pal["A"], pal["K"], 0.35), alpha_only=True)
    _outline_from_alpha(img, pal["K"])


def _asset_fx_glitch(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：时间污染/错位：红色块 + 蓝色块 + 缺口
    for _ in range(10):
        x = rng.randint(2, 12)
        y = rng.randint(2, 12)
        c = pal["R"] if rng.random() < 0.6 else pal["B"]
        _put(img, x, y, _mix(c, pal["W"], 0.1))
        if rng.random() < 0.35:
            _put(img, x + 1, y, c)
    _outline_from_alpha(img, pal["K"])


def _asset_fx_field_accept(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：字段接受（金色光点扩散）
    _circle(img, 8, 8, 1, pal["Y"], fill=True)
    for r in (3, 5, 6):
        _circle(img, 8, 8, r, _mix(pal["Y"], pal["W"], 0.35), fill=False)
    _noise_speckle(img, rng, amount=6, color=_mix(pal["Y"], pal["W"], 0.15), alpha_only=True)
    _outline_from_alpha(img, pal["K"])


def _asset_fx_system_correct(img: Image.Image, rng: random.Random) -> None:
    pal = _palette_footnote()
    # 16x16：系统更正（蓝色对勾 + 方框）
    _rect(img, 3, 3, 12, 12, pal["D"])
    _rect(img, 3, 3, 12, 12, pal["K"])  # 边框
    _line(img, 5, 8, 7, 10, pal["B"])
    _line(img, 7, 10, 11, 6, pal["B"])
    _outline_from_alpha(img, pal["K"])


# ============================
# 资产绘制：精灵/瓦片/UI（展示“更复杂”上限）
# ============================


def _asset_sprite_ghost_idle_strip(img: Image.Image, rng: random.Random) -> None:
    """
    64x16：4 帧 * 16x16 的幽灵 idle 条带（frame0..3）
    用于展示：同一脚本也能生成简单动画帧序列（PNG 条带/图集）。
    """
    pal = _palette_footnote()
    body = _mix(pal["W"], pal["B"], 0.15)
    eye = pal["K"]
    glow = _mix(pal["A"], pal["W"], 0.25)

    def draw_frame(ox: int, wobble: int) -> None:
        # 身体轮廓
        _circle(img, ox + 8, 8 + wobble, 6, body, fill=True)
        # 底部波浪（2D 世界的“漂移感”）
        for x in range(4, 13):
            y = 12 + wobble + (0 if x % 2 == 0 else 1)
            _put(img, ox + x, y, body)
        # 眼睛
        _put(img, ox + 6, 8 + wobble, eye)
        _put(img, ox + 10, 8 + wobble, eye)
        # 轻微边缘辉光
        _circle(img, ox + 8, 8 + wobble, 7, glow, fill=False)

    wobbles = [0, 1, 0, -1]
    for i, wob in enumerate(wobbles):
        draw_frame(i * 16, wob)

    _outline_from_alpha(img, pal["K"])


def _draw_humanoid_frame_32(
    img: Image.Image,
    *,
    ox: int,
    wobble: int,
    arm: int,
    pal: Dict[str, Rgba],
    suit: Rgba,
    suit_shadow: Rgba,
    accent: Rgba,
    skin: Rgba,
    hair: Rgba,
    outline: Rgba,
    add_noise: bool,
    rng: random.Random,
) -> None:
    """
    32x32 人形模板（五官可读）。
    - ox: 帧偏移（每帧 32px 宽）
    - wobble: 上下轻微漂浮（像素级）
    - arm: 手臂摆动偏移（-1/0/1）
    """
    # ---- Head (bigger) ----
    head_cx = ox + 16
    head_cy = 9 + wobble
    _circle(img, head_cx, head_cy, 6, skin, fill=True)
    # hair cap / outline
    _circle(img, head_cx, head_cy - 1, 6, hair, fill=False)
    _rect(img, head_cx - 6, head_cy - 6, head_cx + 6, head_cy - 3, hair)  # fringe

    # ---- Facial features (restrained, readable) ----
    # keep eye whites subtle to avoid "chibi cute" 느낌
    eye_white = _mix(pal["W"], skin, 0.45)
    pupil = outline
    brow = _mix(hair, outline, 0.55)
    mouth = _mix(pal["M"], outline, 0.55)
    # eyes (white + pupil)
    _rect(img, head_cx - 4, head_cy - 1, head_cx - 3, head_cy - 1, eye_white)
    _rect(img, head_cx + 3, head_cy - 1, head_cx + 4, head_cy - 1, eye_white)
    _put(img, head_cx - 4, head_cy, pupil)
    _put(img, head_cx + 4, head_cy, pupil)
    # eyebrows
    _line(img, head_cx - 5, head_cy - 3, head_cx - 3, head_cy - 3, brow)
    _line(img, head_cx + 3, head_cy - 3, head_cx + 5, head_cy - 3, brow)
    # mouth (tiny, neutral)
    _line(img, head_cx - 1, head_cy + 4, head_cx + 1, head_cy + 4, mouth)

    # ---- Neck ----
    _rect(img, head_cx - 1, head_cy + 6, head_cx + 1, head_cy + 7, skin)

    # ---- Body / suit ----
    body_top = 17 + wobble
    body_bottom = 27 + wobble
    _rect(img, head_cx - 7, body_top, head_cx + 7, body_bottom, suit)
    # inner shadow band
    _rect(img, head_cx - 7, body_bottom - 3, head_cx + 7, body_bottom, suit_shadow)

    # collar / lapel
    collar = _mix(suit_shadow, pal["W"], 0.1)
    _line(img, head_cx - 2, body_top, head_cx - 5, body_top + 3, collar)
    _line(img, head_cx + 2, body_top, head_cx + 5, body_top + 3, collar)

    # accent badge / keycard slot
    _rect(img, head_cx + 4, body_top + 2, head_cx + 6, body_top + 5, accent)

    # ---- Arms (swing, restrained) ----
    arm_y0 = body_top + 2 + arm
    arm_y1 = body_top + 8 + arm
    _rect(img, head_cx - 10, arm_y0, head_cx - 8, arm_y1, suit_shadow)
    _rect(img, head_cx + 8, arm_y0 - (2 * arm), head_cx + 10, arm_y1 - (2 * arm), suit_shadow)
    # hands (skin)
    _rect(img, head_cx - 10, arm_y1 + 1, head_cx - 9, arm_y1 + 2, skin)
    _rect(img, head_cx + 9, arm_y1 - (2 * arm) + 1, head_cx + 10, arm_y1 - (2 * arm) + 2, skin)

    # ---- Legs ----
    leg_y0 = body_bottom + 1
    _rect(img, head_cx - 5, leg_y0, head_cx - 2, leg_y0 + 4, suit_shadow)
    _rect(img, head_cx + 2, leg_y0, head_cx + 5, leg_y0 + 4, suit_shadow)
    # feet
    _rect(img, head_cx - 5, leg_y0 + 4, head_cx - 2, leg_y0 + 4, outline)
    _rect(img, head_cx + 2, leg_y0 + 4, head_cx + 5, leg_y0 + 4, outline)

    # Optional: slight drift speckles for unstable characters
    if add_noise:
        _noise_speckle(img, rng, amount=6, color=_mix(accent, pal["W"], 0.18), alpha_only=True)


def _accessory_cenhui(
    img: Image.Image,
    *,
    ox: int,
    wobble: int,
    pal: Dict[str, Rgba],
    accent: Rgba,
) -> None:
    """岑回：例外权限线（荧光绿），低信息量但一眼可辨。"""
    cx = ox + 16
    body_top = 17 + wobble
    # diagonal permission line across chest
    _line(img, cx - 6, body_top + 1, cx + 2, body_top + 9, _mix(accent, pal["W"], 0.1))
    _put(img, cx - 1, body_top + 6, accent)


def _accessory_gulin(
    img: Image.Image,
    *,
    ox: int,
    wobble: int,
    arm: int,
    pal: Dict[str, Rgba],
    accent: Rgba,
) -> None:
    """顾临：平板/档案夹块（科技蓝），强调“流程化安全感”。"""
    cx = ox + 16
    body_top = 17 + wobble
    # attach to right hand
    px0 = cx + 10
    py0 = body_top + 7 - (2 * arm)
    _rect(img, px0, py0, px0 + 3, py0 + 5, _mix(accent, pal["W"], 0.12))
    _rect(img, px0 + 1, py0 + 1, px0 + 2, py0 + 1, pal["W"])  # tiny highlight


def _accessory_atang(
    img: Image.Image,
    *,
    ox: int,
    wobble: int,
    pal: Dict[str, Rgba],
    accent: Rgba,
) -> None:
    """阿棠：碎页/跳号页码（暖色点），配合轻微漂移。"""
    cx = ox + 16
    body_top = 17 + wobble
    # small page fragment on left chest
    _rect(img, cx - 7, body_top + 2, cx - 5, body_top + 4, _mix(pal["W"], pal["Y"], 0.25))
    _put(img, cx - 6, body_top + 3, _mix(accent, pal["W"], 0.25))


def _asset_sprite_cenhui_idle_strip(img: Image.Image, rng: random.Random) -> None:
    """
    64x16：4 帧 * 16x16 的岑回 idle 条带（frame0..3）
    配色：灰色系制服 + 荧光绿（例外权限）
    """
    pal = _palette_footnote()
    suit = _mix(pal["S"], pal["K"], 0.25)
    suit_shadow = _mix(pal["M"], pal["K"], 0.35)
    accent = pal["A"]
    skin = _mix(pal["W"], pal["Y"], 0.15)
    hair = _mix(pal["K"], pal["D"], 0.35)

    wobbles = [0, 1, 0, -1]
    arms = [0, 1, 0, -1]
    for i in range(4):
        _draw_humanoid_frame_32(
            img,
            ox=i * 32,
            wobble=wobbles[i],
            arm=arms[i],
            pal=pal,
            suit=suit,
            suit_shadow=suit_shadow,
            accent=accent,
            skin=skin,
            hair=hair,
            outline=pal["K"],
            add_noise=False,
            rng=rng,
        )
        _accessory_cenhui(img, ox=i * 32, wobble=wobbles[i], pal=pal, accent=accent)

    _outline_from_alpha(img, pal["K"])


def _asset_sprite_gulin_idle_strip(img: Image.Image, rng: random.Random) -> None:
    """
    64x16：4 帧 * 16x16 的顾临 idle 条带（frame0..3）
    配色：深蓝色系 + 科技蓝（系统气质）
    """
    pal = _palette_footnote()
    suit = _mix(pal["B"], pal["K"], 0.55)
    suit_shadow = _mix(pal["B"], pal["K"], 0.75)
    accent = _mix(pal["B"], pal["W"], 0.15)
    skin = _mix(pal["W"], pal["Y"], 0.1)
    hair = _mix(pal["K"], pal["D"], 0.45)

    wobbles = [0, 1, 0, -1]
    arms = [0, -1, 0, 1]
    for i in range(4):
        _draw_humanoid_frame_32(
            img,
            ox=i * 32,
            wobble=wobbles[i],
            arm=arms[i],
            pal=pal,
            suit=suit,
            suit_shadow=suit_shadow,
            accent=accent,
            skin=skin,
            hair=hair,
            outline=pal["K"],
            add_noise=False,
            rng=rng,
        )
        _accessory_gulin(img, ox=i * 32, wobble=wobbles[i], arm=arms[i], pal=pal, accent=pal["B"])

    _outline_from_alpha(img, pal["K"])


def _asset_sprite_atang_idle_strip(img: Image.Image, rng: random.Random) -> None:
    """
    64x16：4 帧 * 16x16 的阿棠 idle 条带（frame0..3）
    配色：偏暖但不稳定（轻微色差/抖动） -> 用噪点模拟漂移
    """
    pal = _palette_footnote()
    warm = (255, 170, 90, 255)
    suit = _mix(warm, pal["K"], 0.6)
    suit_shadow = _mix(warm, pal["K"], 0.78)
    accent = _mix(pal["R"], pal["Y"], 0.35)
    skin = _mix(pal["W"], warm, 0.2)
    hair = _mix(pal["K"], warm, 0.85)

    wobbles = [0, 1, 0, -1]
    arms = [0, 1, 0, -1]
    for i in range(4):
        # frame-specific tiny hue jitter via mix
        t = (i % 2) * 0.08
        _draw_humanoid_frame_32(
            img,
            ox=i * 32,
            wobble=wobbles[i],
            arm=arms[i],
            pal=pal,
            suit=_mix(suit, pal["W"], t),
            suit_shadow=_mix(suit_shadow, pal["W"], t),
            accent=_mix(accent, pal["W"], t),
            skin=_mix(skin, pal["W"], t * 0.5),
            hair=hair,
            outline=pal["K"],
            add_noise=True,
            rng=rng,
        )
        _accessory_atang(img, ox=i * 32, wobble=wobbles[i], pal=pal, accent=accent)

    _outline_from_alpha(img, pal["K"])


def _draw_walk_humanoid_frame_32(
    img: Image.Image,
    *,
    ox: int,
    leg_phase: int,  # 0-3: left forward, center, right forward, center
    arm_swing: int,  # correlates with leg_phase
    pal: Dict[str, Rgba],
    suit: Rgba,
    suit_shadow: Rgba,
    accent: Rgba,
    skin: Rgba,
    hair: Rgba,
    outline: Rgba,
    rng: random.Random,
) -> None:
    """
    32x32 人形行走帧。
    """
    # ---- Head ----
    head_cx = ox + 16
    head_cy = 8
    _circle(img, head_cx, head_cy, 6, skin, fill=True)
    _circle(img, head_cx, head_cy - 1, 6, hair, fill=False)
    _rect(img, head_cx - 6, head_cy - 6, head_cx + 6, head_cy - 3, hair)

    # ---- Facial features ----
    eye_white = _mix(pal["W"], skin, 0.45)
    pupil = outline
    _rect(img, head_cx - 4, head_cy - 1, head_cx - 3, head_cy - 1, eye_white)
    _rect(img, head_cx + 3, head_cy - 1, head_cx + 4, head_cy - 1, eye_white)
    _put(img, head_cx - 4, head_cy, pupil)
    _put(img, head_cx + 4, head_cy, pupil)
    mouth = _mix(pal["M"], outline, 0.55)
    _line(img, head_cx - 1, head_cy + 4, head_cx + 1, head_cy + 4, mouth)

    # ---- Neck ----
    _rect(img, head_cx - 1, head_cy + 6, head_cx + 1, head_cy + 7, skin)

    # ---- Body / suit ----
    body_top = 16
    body_bottom = 25
    _rect(img, head_cx - 7, body_top, head_cx + 7, body_bottom, suit)
    _rect(img, head_cx - 7, body_bottom - 3, head_cx + 7, body_bottom, suit_shadow)

    # collar
    collar = _mix(suit_shadow, pal["W"], 0.1)
    _line(img, head_cx - 2, body_top, head_cx - 5, body_top + 3, collar)
    _line(img, head_cx + 2, body_top, head_cx + 5, body_top + 3, collar)

    # badge
    _rect(img, head_cx + 4, body_top + 2, head_cx + 6, body_top + 5, accent)

    # ---- Arms (swing opposite to legs) ----
    arm_offsets = [2, 0, -2, 0]
    arm_y = arm_offsets[arm_swing % 4]
    _rect(img, head_cx - 10, body_top + 2 + arm_y, head_cx - 8, body_top + 8 + arm_y, suit_shadow)
    _rect(img, head_cx + 8, body_top + 2 - arm_y, head_cx + 10, body_top + 8 - arm_y, suit_shadow)
    _rect(img, head_cx - 10, body_top + 9 + arm_y, head_cx - 9, body_top + 10 + arm_y, skin)
    _rect(img, head_cx + 9, body_top + 9 - arm_y, head_cx + 10, body_top + 10 - arm_y, skin)

    # ---- Legs (walk cycle) ----
    leg_y0 = body_bottom + 1
    leg_positions = [
        ((-4, 0), (2, 2)),   # phase 0: left forward
        ((-3, 1), (1, 1)),   # phase 1: transition
        ((0, 2), (-2, 0)),   # phase 2: right forward
        ((-1, 1), (-1, 1)),  # phase 3: transition
    ]
    left_leg, right_leg = leg_positions[leg_phase % 4]
    # left leg
    _rect(img, head_cx - 5 + left_leg[0], leg_y0, head_cx - 2 + left_leg[0], leg_y0 + 4 + left_leg[1], suit_shadow)
    # right leg
    _rect(img, head_cx + 2 + right_leg[0], leg_y0, head_cx + 5 + right_leg[0], leg_y0 + 4 + right_leg[1], suit_shadow)
    # feet
    _rect(img, head_cx - 5 + left_leg[0], leg_y0 + 4 + left_leg[1], head_cx - 2 + left_leg[0], leg_y0 + 5 + left_leg[1], outline)
    _rect(img, head_cx + 2 + right_leg[0], leg_y0 + 4 + right_leg[1], head_cx + 5 + right_leg[0], leg_y0 + 5 + right_leg[1], outline)


def _asset_sprite_cenhui_walk_strip(img: Image.Image, rng: random.Random) -> None:
    """
    256x32：8 帧 * 32x32 的岑回行走条带
    配色与 idle 一致：灰色系制服 + 荧光绿（例外权限）
    """
    pal = _palette_footnote()
    suit = _mix(pal["S"], pal["K"], 0.25)
    suit_shadow = _mix(pal["M"], pal["K"], 0.35)
    accent = pal["A"]
    skin = _mix(pal["W"], pal["Y"], 0.15)
    hair = _mix(pal["K"], pal["D"], 0.35)

    for i in range(8):
        _draw_walk_humanoid_frame_32(
            img,
            ox=i * 32,
            leg_phase=i % 4,
            arm_swing=(i + 2) % 4,  # arms swing opposite to legs
            pal=pal,
            suit=suit,
            suit_shadow=suit_shadow,
            accent=accent,
            skin=skin,
            hair=hair,
            outline=pal["K"],
            rng=rng,
        )
        # accessory
        _accessory_cenhui(img, ox=i * 32, wobble=0, pal=pal, accent=accent)

    _outline_from_alpha(img, pal["K"])


# ============================
# 资产绘制：背景/场景占位
# ============================


def _asset_bg_placeholder(img: Image.Image, rng: random.Random) -> None:
    """
    简易占位背景（94x167 base -> 750x1334 @ scale 8）
    深色调 + 网格暗示 + 边缘渐变
    """
    pal = _palette_footnote()
    base = pal["K"]
    grid = _mix(pal["D"], pal["K"], 0.5)
    accent_dim = _mix(pal["A"], pal["K"], 0.85)

    # fill base
    for y in range(img.height):
        for x in range(img.width):
            _put(img, x, y, base)

    # subtle grid every 8px
    for y in range(0, img.height, 8):
        for x in range(img.width):
            _put(img, x, y, grid)
    for x in range(0, img.width, 8):
        for y in range(img.height):
            _put(img, x, y, grid)

    # edge vignette (darker corners)
    for y in range(img.height):
        for x in range(img.width):
            dx = min(x, img.width - 1 - x)
            dy = min(y, img.height - 1 - y)
            edge = min(dx, dy)
            if edge < 4:
                px = img.getpixel((x, y))
                t = (4 - edge) / 4 * 0.3
                img.putpixel((x, y), _mix(px, (0, 0, 0, 255), t))

    # some random accent speckles
    for _ in range(20):
        x = rng.randint(10, img.width - 10)
        y = rng.randint(10, img.height - 10)
        _put(img, x, y, accent_dim)


def _asset_hud_counter_bar(img: Image.Image, rng: random.Random) -> None:
    """
    HUD 计数器显示条占位（50x15 base）
    用于显示 R/P/W 值
    """
    pal = _palette_footnote()
    bg = _mix(pal["D"], pal["K"], 0.3)
    border = _mix(pal["M"], pal["K"], 0.5)

    # background
    _rect(img, 0, 0, img.width - 1, img.height - 1, bg)
    # border
    for x in range(img.width):
        _put(img, x, 0, border)
        _put(img, x, img.height - 1, border)
    for y in range(img.height):
        _put(img, 0, y, border)
        _put(img, img.width - 1, y, border)

    # three slots for R/P/W (dividers)
    slot_width = img.width // 3
    for i in range(1, 3):
        x = i * slot_width
        for y in range(img.height):
            _put(img, x, y, border)


def _asset_hud_ability_slot(img: Image.Image, rng: random.Random) -> None:
    """
    能力槽占位（20x20 base）
    可放置能力图标的容器
    """
    pal = _palette_footnote()
    bg = _mix(pal["D"], pal["K"], 0.4)
    border = _mix(pal["A"], pal["K"], 0.6)
    inner = _mix(pal["A"], pal["K"], 0.85)

    # rounded square
    _rect(img, 2, 0, img.width - 3, img.height - 1, bg)
    _rect(img, 0, 2, img.width - 1, img.height - 3, bg)
    _rect(img, 1, 1, img.width - 2, img.height - 2, bg)

    # border
    for x in range(2, img.width - 2):
        _put(img, x, 0, border)
        _put(img, x, img.height - 1, border)
    for y in range(2, img.height - 2):
        _put(img, 0, y, border)
        _put(img, img.width - 1, y, border)
    # corners
    _put(img, 1, 1, border)
    _put(img, img.width - 2, 1, border)
    _put(img, 1, img.height - 2, border)
    _put(img, img.width - 2, img.height - 2, border)

    # inner glow hint
    _circle(img, img.width // 2, img.height // 2, 5, inner, fill=False)


def _asset_dialogue_frame(img: Image.Image, rng: random.Random) -> None:
    """
    对话框头像框占位（28x28 base）
    """
    pal = _palette_footnote()
    bg = _mix(pal["D"], pal["K"], 0.2)
    border = _mix(pal["B"], pal["K"], 0.4)
    inner_border = _mix(pal["B"], pal["W"], 0.2)

    # outer rect
    _rect(img, 0, 0, img.width - 1, img.height - 1, bg)

    # double border
    for x in range(img.width):
        _put(img, x, 0, border)
        _put(img, x, img.height - 1, border)
        _put(img, x, 1, inner_border)
        _put(img, x, img.height - 2, inner_border)
    for y in range(img.height):
        _put(img, 0, y, border)
        _put(img, img.width - 1, y, border)
        _put(img, 1, y, inner_border)
        _put(img, img.width - 2, y, inner_border)

    # corner accents
    _put(img, 2, 2, _mix(pal["B"], pal["W"], 0.3))
    _put(img, img.width - 3, 2, _mix(pal["B"], pal["W"], 0.3))
    _put(img, 2, img.height - 3, _mix(pal["B"], pal["W"], 0.3))
    _put(img, img.width - 3, img.height - 3, _mix(pal["B"], pal["W"], 0.3))

def _asset_tiles_platform_basic(img: Image.Image, rng: random.Random) -> None:
    """
    64x16：4 个 16x16 tile（平台/墙体），可用于简单地编排 tilemap。
    """
    pal = _palette_footnote()
    stone = _mix(pal["G"], pal["S"], 0.1)
    edge = _mix(pal["M"], pal["K"], 0.3)
    moss = _mix(pal["A"], pal["K"], 0.25)

    for t in range(4):
        ox = t * 16
        # base fill
        _rect(img, ox + 0, 0, ox + 15, 15, stone)
        # top edge
        _rect(img, ox + 0, 0, ox + 15, 1, edge)
        # cracks / blocks
        for _ in range(6):
            x0 = ox + rng.randint(1, 14)
            y0 = rng.randint(2, 14)
            x1 = ox + _clamp_u8(x0 + rng.randint(-5, 5))
            y1 = _clamp_u8(y0 + rng.randint(-2, 2))
            _line(img, x0, y0, max(ox + 1, min(ox + 14, x1)), max(2, min(14, y1)), edge)
        # moss speckles on tile 2/3
        if t in (2, 3):
            for _ in range(10):
                _put(img, ox + rng.randint(1, 14), rng.randint(2, 8), moss)

        # 1px outline inside each tile for readability
        _rect(img, ox + 0, 0, ox + 15, 15, pal["K"])


def _asset_ui_panel_9slice(img: Image.Image, rng: random.Random) -> None:
    """
    24x24：简易 9-slice 面板（中心可拉伸），用于像素风 UI。
    约定：边框 2px，角点高亮，中心半透明。
    """
    pal = _palette_footnote()
    border = _mix(pal["B"], pal["K"], 0.35)
    fill = _mix(pal["D"], pal["K"], 0.2)
    hi = _mix(pal["B"], pal["W"], 0.25)

    _rect(img, 0, 0, 23, 23, fill)
    # border 2px
    _rect(img, 0, 0, 23, 1, border)
    _rect(img, 0, 22, 23, 23, border)
    _rect(img, 0, 0, 1, 23, border)
    _rect(img, 22, 0, 23, 23, border)
    # corner highlights
    for (x, y) in ((2, 2), (21, 2), (2, 21), (21, 21)):
        _put(img, x, y, hi)
        _put(img, x - 1 if x > 2 else x + 1, y, hi)
        _put(img, x, y - 1 if y > 2 else y + 1, hi)
    _outline_from_alpha(img, pal["K"])


# ============================
# 序列帧（逐帧 PNG + 条带）
# ============================


def _seq_loader_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """
    简易像素加载器：12 帧旋转光段（参考 svg_examples/04_animated_loader.svg 的“旋转”语义）。
    每帧绘制在 16x16 上。
    """
    pal = _palette_footnote()
    bg_ring = _mix(pal["S"], pal["K"], 0.35)
    fg = pal["B"]
    hi = _mix(pal["B"], pal["W"], 0.25)

    points = [
        (8, 1),
        (11, 2),
        (13, 4),
        (14, 8),
        (13, 12),
        (11, 14),
        (8, 15),
        (5, 14),
        (3, 12),
        (2, 8),
        (3, 4),
        (5, 2),
    ]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        # ring base
        for (x, y) in points:
            _put(img, x, y, bg_ring)
        # rotating highlight
        i = frame % len(points)
        (x, y) = points[i]
        _put(img, x, y, fg)
        (x2, y2) = points[(i - 1) % len(points)]
        _put(img, x2, y2, hi)
        _outline_from_alpha(img, pal["K"])

    return [draw for _ in range(count)]


def _seq_glitch_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """时间污染：每帧不同的红/蓝错位块。"""
    pal = _palette_footnote()
    k = pal["K"]
    r = pal["R"]
    b = pal["B"]
    w = pal["W"]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        # deterministic per-frame RNG
        local = random.Random((rng.randint(0, 1_000_000) << 16) ^ frame)
        for _ in range(18):
            x = local.randint(1, img.width - 2)
            y = local.randint(1, img.height - 2)
            c = r if local.random() < 0.6 else b
            c2 = _mix(c, w, 0.1)
            _put(img, x, y, c2)
            if local.random() < 0.5:
                _put(img, x + 1, y, c)
            if local.random() < 0.35:
                _put(img, x, y + 1, c)
        _outline_from_alpha(img, k)

    return [draw for _ in range(count)]


def _seq_field_accept_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """字段接受：金色环扩散（脉冲）。"""
    pal = _palette_footnote()
    y = pal["Y"]
    k = pal["K"]
    w = pal["W"]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        # expanding rings
        t = frame / max(1, count - 1)
        r0 = 1 + int(6 * t)
        _circle(img, 8, 8, 1, y, fill=True)
        _circle(img, 8, 8, min(7, r0), _mix(y, w, 0.35), fill=False)
        if r0 >= 3:
            _circle(img, 8, 8, min(7, r0 - 2), _mix(y, w, 0.5), fill=False)
        _noise_speckle(img, rng, amount=4, color=_mix(y, w, 0.15), alpha_only=True)
        _outline_from_alpha(img, k)

    return [draw for _ in range(count)]


def _seq_depth_perception_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """深度感知边缘呼吸效果：荧光绿边框脉动。"""
    pal = _palette_footnote()
    a = pal["A"]  # accent-depth (green)
    k = pal["K"]
    w = pal["W"]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        # breathing sine wave
        import math
        t = frame / max(1, count - 1)
        intensity = 0.3 + 0.7 * (0.5 + 0.5 * math.sin(t * 2 * math.pi))
        edge_color = _mix(a, w, intensity * 0.4)
        dim_color = _mix(a, k, 0.7)

        # edge glow (2px border that pulses)
        border_width = 2
        for y in range(img.height):
            for x in range(img.width):
                dx = min(x, img.width - 1 - x)
                dy = min(y, img.height - 1 - y)
                edge = min(dx, dy)
                if edge < border_width:
                    c = edge_color if edge == 0 else dim_color
                    _put(img, x, y, c)

        # corner accent dots
        corner_r = 1
        corners = [
            (corner_r + 1, corner_r + 1),
            (img.width - corner_r - 2, corner_r + 1),
            (corner_r + 1, img.height - corner_r - 2),
            (img.width - corner_r - 2, img.height - corner_r - 2),
        ]
        for cx, cy in corners:
            _circle(img, cx, cy, corner_r, _mix(a, w, intensity * 0.6), fill=True)

        # some scanning lines (subtle)
        scan_y = int((t * img.height * 2) % img.height)
        for x in range(img.width):
            if 2 < x < img.width - 3:
                _put(img, x, scan_y, _mix(a, k, 0.5))

    return [draw for _ in range(count)]


def _seq_depth_intervention_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """深度介入效果：裂痕产生动画。"""
    pal = _palette_footnote()
    a = pal["A"]
    k = pal["K"]
    w = pal["W"]
    m = pal["M"]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        local = random.Random((rng.randint(0, 1_000_000) << 16) ^ frame)
        t = frame / max(1, count - 1)

        # growing crack from center
        cx, cy = img.width // 2, img.height // 2
        crack_len = int(6 * t)

        # main crack
        crack_color = _mix(k, m, 0.6)
        glow_color = _mix(a, w, 0.3 * (1 - t))

        if crack_len > 0:
            # diagonal crack
            _line(img, cx, cy, cx + crack_len, cy + crack_len, crack_color)
            _line(img, cx + 1, cy, cx + crack_len + 1, cy + crack_len, glow_color)

            # branches
            if crack_len > 2:
                _line(img, cx + 2, cy + 2, cx + 2 + crack_len // 2, cy, crack_color)
                _line(img, cx + 3, cy + 3, cx + 3, cy + 3 + crack_len // 2, crack_color)

        # impact point glow
        _circle(img, cx, cy, 2 - int(t * 2), _mix(a, w, 0.5), fill=True)

        # sparks
        for _ in range(int(6 * (1 - t))):
            sx = cx + local.randint(-crack_len - 2, crack_len + 2)
            sy = cy + local.randint(-crack_len - 2, crack_len + 2)
            _put(img, sx, sy, _mix(a, w, local.random() * 0.5))

        _outline_from_alpha(img, k)

    return [draw for _ in range(count)]


def _seq_time_intervention_frames(count: int) -> List[Callable[[Image.Image, random.Random, int], None]]:
    """时间干预回溯效果：红色波纹 + 倒带线条。"""
    pal = _palette_footnote()
    r = pal["R"]
    k = pal["K"]
    w = pal["W"]
    b = pal["B"]

    def draw(img: Image.Image, rng: random.Random, frame: int) -> None:
        import math
        t = frame / max(1, count - 1)

        cx, cy = img.width // 2, img.height // 2

        # concentric circles expanding/contracting
        phase = t * 2 * math.pi
        for ring in range(1, 8):
            ring_r = int(ring + 3 * math.sin(phase + ring * 0.5))
            if 0 < ring_r < min(img.width, img.height) // 2:
                ring_color = _mix(r, w, 0.1 + 0.2 * math.sin(phase + ring))
                _circle(img, cx, cy, ring_r, ring_color, fill=False)

        # rewind arrows (<<)
        arrow_x = int(img.width * 0.3 + 4 * math.sin(phase * 2))
        arrow_color = _mix(r, w, 0.4)
        # first arrow
        _line(img, arrow_x, cy, arrow_x - 3, cy - 3, arrow_color)
        _line(img, arrow_x, cy, arrow_x - 3, cy + 3, arrow_color)
        # second arrow
        _line(img, arrow_x + 4, cy, arrow_x + 1, cy - 3, arrow_color)
        _line(img, arrow_x + 4, cy, arrow_x + 1, cy + 3, arrow_color)

        # glitch noise (some blue/red offset)
        local = random.Random((rng.randint(0, 1_000_000) << 16) ^ frame)
        for _ in range(8):
            gx = local.randint(2, img.width - 3)
            gy = local.randint(2, img.height - 3)
            gc = r if local.random() < 0.6 else b
            _put(img, gx, gy, _mix(gc, w, 0.2))

        _outline_from_alpha(img, k)

    return [draw for _ in range(count)]


def _save_sequence_frames(
    *,
    name: str,
    out_dir: str,
    base_size: Tuple[int, int],
    scale: int,
    max_colors: int,
    dither: bool,
    rng: random.Random,
    frame_draw: Callable[[Image.Image, random.Random, int], None],
    frame_count: int,
    also_strip: bool,
) -> None:
    seq_dir = os.path.join(out_dir, "sequences", name)
    _ensure_dir(seq_dir)

    # frames
    frames: List[Image.Image] = []
    for i in range(frame_count):
        img = Image.new("RGBA", base_size, (0, 0, 0, 0))
        frame_draw(img, rng, i)
        img = _quantize_rgba(img, max_colors=max_colors, dither=dither)
        img = _scale_nearest(img, scale)
        out_path = os.path.join(seq_dir, f"px_{name}_f{i:02d}.png")
        _save(img, out_path)
        frames.append(img)

    # strip (horizontal)
    if also_strip and frames:
        strip = Image.new("RGBA", (frames[0].width * len(frames), frames[0].height), (0, 0, 0, 0))
        for i, fr in enumerate(frames):
            strip.paste(fr, (i * fr.width, 0))
        _save(strip, os.path.join(out_dir, "sequences", f"px_{name}_strip.png"))


def _assets() -> List[PixelAsset]:
    # 统一 16x16 base，scale 4 -> 64x64（可用于 Phaser 小图标/bitmap UI）
    return [
        PixelAsset(
            path="icons/abilities/px_ability_depth_perception.png",
            base_size=(16, 16),
            draw=_asset_ability_depth_perception,
        ),
        PixelAsset(
            path="icons/abilities/px_ability_depth_intervention.png",
            base_size=(16, 16),
            draw=_asset_ability_depth_intervention,
        ),
        PixelAsset(
            path="icons/abilities/px_ability_time_intervention.png",
            base_size=(16, 16),
            draw=_asset_ability_time_intervention,
        ),
        PixelAsset(path="icons/counters/px_counter_r.png", base_size=(16, 16), draw=_asset_counter_r),
        PixelAsset(path="icons/counters/px_counter_p.png", base_size=(16, 16), draw=_asset_counter_p),
        PixelAsset(path="icons/counters/px_counter_w.png", base_size=(16, 16), draw=_asset_counter_w),
        PixelAsset(path="icons/items/px_item_keycard.png", base_size=(16, 16), draw=_asset_item_keycard),
        PixelAsset(path="icons/items/px_item_tape.png", base_size=(16, 16), draw=_asset_item_tape),
        PixelAsset(path="icons/items/px_item_wrench.png", base_size=(16, 16), draw=_asset_item_wrench),
        PixelAsset(path="icons/items/px_item_archive.png", base_size=(16, 16), draw=_asset_item_archive),
        PixelAsset(path="icons/effects/px_fx_scar.png", base_size=(16, 16), draw=_asset_fx_scar),
        PixelAsset(path="icons/effects/px_fx_glitch.png", base_size=(16, 16), draw=_asset_fx_glitch),
        PixelAsset(path="icons/effects/px_fx_field_accept.png", base_size=(16, 16), draw=_asset_fx_field_accept),
        PixelAsset(path="icons/effects/px_fx_system_correct.png", base_size=(16, 16), draw=_asset_fx_system_correct),

        # 更复杂示例（精灵条带 / tiles / UI）
        PixelAsset(path="sprites/px_sprite_ghost_idle_strip.png", base_size=(64, 16), draw=_asset_sprite_ghost_idle_strip),
        # 角色精灵：用更高基底(32x32)以容纳五官细节，但保持最终输出帧为 128x128
        PixelAsset(
            path="sprites/px_sprite_cenhui_idle_strip.png",
            base_size=(128, 32),  # 4 frames * 32x32
            draw=_asset_sprite_cenhui_idle_strip,
            scale_override=4,
        ),
        # 岑回行走动画：8帧
        PixelAsset(
            path="sprites/px_sprite_cenhui_walk_strip.png",
            base_size=(256, 32),  # 8 frames * 32x32
            draw=_asset_sprite_cenhui_walk_strip,
            scale_override=4,
        ),
        PixelAsset(
            path="sprites/px_sprite_gulin_idle_strip.png",
            base_size=(128, 32),  # 4 frames * 32x32
            draw=_asset_sprite_gulin_idle_strip,
            scale_override=4,
        ),
        PixelAsset(
            path="sprites/px_sprite_atang_idle_strip.png",
            base_size=(128, 32),  # 4 frames * 32x32
            draw=_asset_sprite_atang_idle_strip,
            scale_override=4,
        ),
        PixelAsset(path="tiles/px_tiles_platform_basic.png", base_size=(64, 16), draw=_asset_tiles_platform_basic),
        PixelAsset(path="ui/px_ui_panel_9slice.png", base_size=(24, 24), draw=_asset_ui_panel_9slice),

        # UI 占位资产
        PixelAsset(
            path="ui/px_hud_counter_bar.png",
            base_size=(50, 15),
            draw=_asset_hud_counter_bar,
            scale_override=4,
        ),
        PixelAsset(
            path="ui/px_hud_ability_slot.png",
            base_size=(20, 20),
            draw=_asset_hud_ability_slot,
            scale_override=4,
        ),
        PixelAsset(
            path="ui/px_dialogue_frame.png",
            base_size=(28, 28),
            draw=_asset_dialogue_frame,
            scale_override=8,
        ),

        # 背景占位 (竖屏 750x1334 @ scale 8 from 94x167 base)
        PixelAsset(
            path="backgrounds/px_bg_placeholder.png",
            base_size=(94, 167),
            draw=_asset_bg_placeholder,
            scale_override=8,
        ),
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="assets/images/pixel", help="输出根目录（建议放 assets/images/pixel）")
    parser.add_argument("--scale", type=int, default=4, help="最近邻放大倍数（像素风关键）")
    parser.add_argument("--max-colors", type=int, default=24, help="量化色数上限（0 表示不量化）")
    parser.add_argument("--dither", action="store_true", help="量化时启用抖动（默认关闭，更干净）")
    parser.add_argument("--with-sequences", action="store_true", help="生成序列帧 PNG（包含条带示例）")
    parser.add_argument("--sequence-frames", type=int, default=12, help="序列帧数量（默认 12 帧）")
    parser.add_argument("--seed", type=int, default=20251224, help="随机种子（保证可复现）")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    out_dir = args.out_dir
    scale = args.scale
    max_colors = args.max_colors
    dither = args.dither

    print("[Pixel Assets Generator]")
    print(f"  out_dir = {out_dir}")
    print(f"  scale   = {scale}")
    print(f"  colors  = {max_colors} (dither={dither})")
    print(f"  seed    = {args.seed}")
    print("-" * 50)

    generated = 0
    for asset in _assets():
        img = Image.new("RGBA", asset.base_size, (0, 0, 0, 0))
        asset.draw(img, rng)
        img = _quantize_rgba(img, max_colors=max_colors, dither=dither)
        asset_scale = asset.scale_override if asset.scale_override is not None else scale
        img_scaled = _scale_nearest(img, asset_scale)
        out_path = os.path.join(out_dir, asset.path)
        _save(img_scaled, out_path)
        generated += 1
        print(f"  + {asset.path} ({img_scaled.width}x{img_scaled.height})")

    if args.with_sequences:
        # loader / glitch / field_accept / depth effects / time effects
        seq_count = max(2, args.sequence_frames)
        _save_sequence_frames(
            name="loader",
            out_dir=out_dir,
            base_size=(16, 16),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_loader_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        _save_sequence_frames(
            name="glitch",
            out_dir=out_dir,
            base_size=(16, 16),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_glitch_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        _save_sequence_frames(
            name="field_accept",
            out_dir=out_dir,
            base_size=(16, 16),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_field_accept_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        # 深度感知边缘呼吸效果 (larger for overlay)
        _save_sequence_frames(
            name="depth_perception",
            out_dir=out_dir,
            base_size=(24, 24),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_depth_perception_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        # 深度介入裂痕效果
        _save_sequence_frames(
            name="depth_intervention",
            out_dir=out_dir,
            base_size=(16, 16),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_depth_intervention_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        # 时间干预回溯效果
        _save_sequence_frames(
            name="time_intervention",
            out_dir=out_dir,
            base_size=(16, 16),
            scale=scale,
            max_colors=max_colors,
            dither=dither,
            rng=rng,
            frame_draw=_seq_time_intervention_frames(seq_count)[0],
            frame_count=seq_count,
            also_strip=True,
        )
        print(f"  + sequences/* (frames={seq_count}, strip=6)")

    print("-" * 50)
    print(f"[DONE] generated: {generated}")


if __name__ == "__main__":
    main()


