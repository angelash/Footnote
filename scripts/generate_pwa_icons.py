#!/usr/bin/env python3
"""
生成 PWA 图标
使用 Pillow 创建各种尺寸的应用图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

# 输出目录
OUTPUT_DIR = "public/icons"

# 图标尺寸
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# 配色
BG_COLOR = (10, 10, 15)  # #0A0A0F
ACCENT_COLOR = (74, 158, 255)  # #4A9EFF
GLOW_COLOR = (0, 255, 170)  # #00FFAA

def create_icon(size: int) -> Image.Image:
    """创建单个图标"""
    # 创建带 alpha 通道的图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 圆角背景
    corner_radius = size // 6
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        fill=BG_COLOR
    )
    
    # 边框
    draw.rounded_rectangle(
        [(2, 2), (size - 3, size - 3)],
        radius=corner_radius - 2,
        outline=ACCENT_COLOR,
        width=max(1, size // 64)
    )
    
    # 中心图形 - 代表"脚注"符号
    center_x = size // 2
    center_y = size // 2
    symbol_size = size // 3
    
    # 绘制一个抽象的 "F" 或脚注符号
    line_width = max(2, size // 32)
    
    # 主竖线
    x1 = center_x - symbol_size // 4
    y1 = center_y - symbol_size // 2
    y2 = center_y + symbol_size // 2
    draw.line([(x1, y1), (x1, y2)], fill=GLOW_COLOR, width=line_width)
    
    # 顶部横线
    x2 = center_x + symbol_size // 4
    draw.line([(x1, y1), (x2, y1)], fill=GLOW_COLOR, width=line_width)
    
    # 中间横线
    mid_y = center_y - symbol_size // 8
    mid_x2 = center_x + symbol_size // 8
    draw.line([(x1, mid_y), (mid_x2, mid_y)], fill=GLOW_COLOR, width=line_width)
    
    # 装饰点
    dot_size = max(2, size // 24)
    draw.ellipse(
        [(center_x + symbol_size // 3 - dot_size, center_y + symbol_size // 4 - dot_size),
         (center_x + symbol_size // 3 + dot_size, center_y + symbol_size // 4 + dot_size)],
        fill=ACCENT_COLOR
    )
    
    return img


def create_shortcut_icon(size: int, icon_type: str) -> Image.Image:
    """创建快捷方式图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    corner_radius = size // 6
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        fill=BG_COLOR
    )
    
    center = size // 2
    symbol_size = size // 3
    line_width = max(2, size // 32)
    
    if icon_type == 'continue':
        # 播放/继续符号 (三角形)
        points = [
            (center - symbol_size // 3, center - symbol_size // 2),
            (center + symbol_size // 2, center),
            (center - symbol_size // 3, center + symbol_size // 2)
        ]
        draw.polygon(points, fill=GLOW_COLOR)
    elif icon_type == 'new':
        # 加号符号
        draw.line(
            [(center - symbol_size // 2, center), (center + symbol_size // 2, center)],
            fill=ACCENT_COLOR, width=line_width
        )
        draw.line(
            [(center, center - symbol_size // 2), (center, center + symbol_size // 2)],
            fill=ACCENT_COLOR, width=line_width
        )
    
    return img


def main():
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Generating PWA icons...")
    
    # 生成主图标
    for size in ICON_SIZES:
        icon = create_icon(size)
        filename = f"icon-{size}x{size}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        icon.save(filepath, 'PNG')
        print(f"  [OK] {filename}")
    
    # 生成快捷方式图标
    shortcuts = [('continue', 96), ('new', 96)]
    for icon_type, size in shortcuts:
        icon = create_shortcut_icon(size, icon_type)
        filename = f"{icon_type}-{size}x{size}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        icon.save(filepath, 'PNG')
        print(f"  [OK] {filename} (shortcut)")
    
    # 生成 favicon
    favicon = create_icon(32)
    favicon.save(os.path.join("public", "favicon.ico"), 'ICO')
    print("  [OK] favicon.ico")
    
    # 生成 apple-touch-icon
    apple_icon = create_icon(180)
    apple_icon.save(os.path.join("public", "apple-touch-icon.png"), 'PNG')
    print("  [OK] apple-touch-icon.png")
    
    print(f"\nDone! Generated {len(ICON_SIZES) + len(shortcuts) + 2} icons")


if __name__ == '__main__':
    main()

