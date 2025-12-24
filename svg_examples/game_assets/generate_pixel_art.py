"""
像素艺术生成器 - 生成2D游戏风格的像素图
运行: python generate_pixel_art.py
输出: pixel_*.png 文件
"""

from PIL import Image

def create_pixel_character():
    """生成一个简单的像素小人"""
    # 16x16 像素
    size = 16
    scale = 4  # 放大倍数，最终64x64
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    # 颜色定义
    SKIN = (255, 206, 180, 255)
    HAIR = (101, 67, 33, 255)
    SHIRT = (65, 105, 225, 255)  # 蓝色衬衫
    PANTS = (50, 50, 50, 255)
    SHOES = (139, 69, 19, 255)
    EYE = (0, 0, 0, 255)
    
    # 头发 (行2-4)
    for x in range(5, 11):
        pixels[x, 2] = HAIR
    for x in range(4, 12):
        pixels[x, 3] = HAIR
    for x in range(4, 12):
        pixels[x, 4] = HAIR
    
    # 脸 (行5-7)
    for y in range(5, 8):
        for x in range(5, 11):
            pixels[x, y] = SKIN
    
    # 眼睛
    pixels[6, 6] = EYE
    pixels[9, 6] = EYE
    
    # 身体/衬衫 (行8-11)
    for y in range(8, 12):
        for x in range(5, 11):
            pixels[x, y] = SHIRT
    # 手臂
    for y in range(8, 11):
        pixels[4, y] = SHIRT
        pixels[11, y] = SHIRT
    
    # 裤子 (行12-13)
    for y in range(12, 14):
        for x in range(5, 8):
            pixels[x, y] = PANTS
        for x in range(8, 11):
            pixels[x, y] = PANTS
    
    # 鞋子 (行14)
    for x in range(5, 8):
        pixels[x, 14] = SHOES
    for x in range(8, 11):
        pixels[x, 14] = SHOES
    
    # 放大
    img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
    return img_scaled


def create_pixel_heart():
    """生成像素爱心（生命值图标）"""
    size = 16
    scale = 4
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    RED = (220, 20, 60, 255)
    LIGHT = (255, 100, 100, 255)
    DARK = (139, 0, 0, 255)
    
    # 爱心形状
    heart = [
        "  ####  ####  ",
        " ########### ",
        "##############",
        "##############",
        "##############",
        " ############ ",
        "  ##########  ",
        "   ########   ",
        "    ######    ",
        "     ####     ",
        "      ##      ",
    ]
    
    for y, row in enumerate(heart):
        for x, char in enumerate(row):
            if char == '#':
                px = x + 1
                py = y + 2
                if 0 <= px < size and 0 <= py < size:
                    # 添加简单阴影效果
                    if x < 4 and y < 4:
                        pixels[px, py] = LIGHT
                    elif x > 8 or y > 6:
                        pixels[px, py] = DARK
                    else:
                        pixels[px, py] = RED
    
    img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
    return img_scaled


def create_pixel_coin():
    """生成像素金币"""
    size = 16
    scale = 4
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    GOLD = (255, 215, 0, 255)
    LIGHT = (255, 245, 157, 255)
    DARK = (184, 134, 11, 255)
    OUTLINE = (139, 90, 43, 255)
    
    # 圆形金币
    for y in range(3, 13):
        for x in range(3, 13):
            # 简单的圆形判断
            dx = x - 7.5
            dy = y - 7.5
            dist = (dx*dx + dy*dy) ** 0.5
            
            if dist < 4:
                if x < 6 and y < 6:
                    pixels[x, y] = LIGHT
                elif x > 8 or y > 8:
                    pixels[x, y] = DARK
                else:
                    pixels[x, y] = GOLD
            elif dist < 5:
                pixels[x, y] = OUTLINE
    
    # $ 符号
    for y in range(5, 11):
        pixels[7, y] = DARK
        pixels[8, y] = DARK
    
    img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
    return img_scaled


def create_pixel_sword():
    """生成像素剑"""
    size = 16
    scale = 4
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    BLADE = (192, 192, 192, 255)
    BLADE_LIGHT = (224, 224, 224, 255)
    BLADE_DARK = (128, 128, 128, 255)
    HANDLE = (139, 69, 19, 255)
    GUARD = (255, 215, 0, 255)
    
    # 剑身（斜向）
    for i in range(8):
        x, y = 12 - i, 2 + i
        if 0 <= x < size and 0 <= y < size:
            pixels[x, y] = BLADE_LIGHT
            pixels[x-1, y] = BLADE
            if x-2 >= 0:
                pixels[x-2, y] = BLADE_DARK
    
    # 护手
    for x in range(3, 7):
        pixels[x, 10] = GUARD
    
    # 剑柄
    for i in range(4):
        pixels[2 - i//2, 11 + i] = HANDLE
        pixels[3 - i//2, 11 + i] = HANDLE
    
    img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
    return img_scaled


def create_pixel_tree():
    """生成像素树"""
    size = 32
    scale = 2
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    TRUNK = (139, 90, 43, 255)
    TRUNK_DARK = (101, 67, 33, 255)
    LEAF = (34, 139, 34, 255)
    LEAF_LIGHT = (50, 205, 50, 255)
    LEAF_DARK = (0, 100, 0, 255)
    
    # 树干
    for y in range(20, 32):
        for x in range(13, 19):
            if x < 15:
                pixels[x, y] = TRUNK_DARK
            else:
                pixels[x, y] = TRUNK
    
    # 树冠（多层）
    # 底层
    for y in range(14, 22):
        for x in range(6, 26):
            dx = x - 16
            dy = y - 18
            if dx*dx/80 + dy*dy/16 < 1:
                pixels[x, y] = LEAF_DARK if y > 18 else LEAF
    
    # 中层
    for y in range(8, 16):
        for x in range(8, 24):
            dx = x - 16
            dy = y - 12
            if dx*dx/50 + dy*dy/16 < 1:
                pixels[x, y] = LEAF if y > 12 else LEAF_LIGHT
    
    # 顶层
    for y in range(4, 10):
        for x in range(11, 21):
            dx = x - 16
            dy = y - 7
            if dx*dx/20 + dy*dy/9 < 1:
                pixels[x, y] = LEAF_LIGHT
    
    img_scaled = img.resize((size * scale, size * scale), Image.NEAREST)
    return img_scaled


def main():
    import os
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    assets = [
        ("pixel_character.png", create_pixel_character),
        ("pixel_heart.png", create_pixel_heart),
        ("pixel_coin.png", create_pixel_coin),
        ("pixel_sword.png", create_pixel_sword),
        ("pixel_tree.png", create_pixel_tree),
    ]
    
    print("[Pixel Art Generator]")
    print("=" * 40)
    
    for filename, generator in assets:
        filepath = os.path.join(output_dir, filename)
        img = generator()
        img.save(filepath)
        print(f"[OK] Generated: {filename} ({img.size[0]}x{img.size[1]})")
    
    print("=" * 40)
    print(f"Output: {output_dir}")
    print("Done!")


if __name__ == "__main__":
    main()

