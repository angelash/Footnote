#!/usr/bin/env python3
"""
《备注 / Footnote》占位图资产生成器
用于开发阶段生成临时占位资产
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# 输出目录
OUTPUT_DIR = "assets/images/placeholders"

# 颜色定义
COLORS = {
    'bg': (51, 51, 51, 255),           # #333333
    'icon': (102, 102, 102, 255),      # #666666
    'character': (74, 144, 217, 255),  # #4A90D9
    'scene': (42, 90, 58, 255),        # #2A5A3A
    'effect': (155, 89, 182, 255),     # #9B59B6
    'ui': (52, 73, 94, 255),           # #34495E
    'text': (255, 255, 255, 255),      # #FFFFFF
    'accent': (0, 255, 170, 255),      # #00FFAA (depth green)
}

def ensure_dir(path):
    """确保目录存在"""
    os.makedirs(path, exist_ok=True)

def create_placeholder(width, height, label, color_type='bg', outline=True):
    """创建基础占位图"""
    img = Image.new('RGBA', (width, height), COLORS[color_type])
    draw = ImageDraw.Draw(img)
    
    # 绘制边框
    if outline:
        draw.rectangle([0, 0, width-1, height-1], outline=COLORS['accent'], width=2)
    
    # 绘制对角线
    draw.line([0, 0, width, height], fill=COLORS['accent'], width=1)
    draw.line([width, 0, 0, height], fill=COLORS['accent'], width=1)
    
    # 绘制标签
    try:
        font = ImageFont.truetype("arial.ttf", min(width, height) // 8)
    except:
        font = ImageFont.load_default()
    
    # 计算文字位置
    bbox = draw.textbbox((0, 0), label, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # 绘制文字背景
    padding = 4
    draw.rectangle([x-padding, y-padding, x+text_width+padding, y+text_height+padding], 
                   fill=(0, 0, 0, 180))
    draw.text((x, y), label, fill=COLORS['text'], font=font)
    
    return img

def create_sprite_strip(frame_size, frames, label, direction='horizontal'):
    """创建精灵序列帧"""
    w, h = frame_size
    if direction == 'horizontal':
        strip_width = w * frames
        strip_height = h
    else:
        strip_width = w
        strip_height = h * frames
    
    img = Image.new('RGBA', (strip_width, strip_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    for i in range(frames):
        if direction == 'horizontal':
            x = i * w
            y = 0
        else:
            x = 0
            y = i * h
        
        # 绘制帧背景
        frame_color = (
            COLORS['character'][0],
            COLORS['character'][1],
            COLORS['character'][2],
            200 - i * 10
        )
        draw.rectangle([x+2, y+2, x+w-3, y+h-3], fill=frame_color, outline=COLORS['accent'])
        
        # 绘制帧号
        try:
            font = ImageFont.truetype("arial.ttf", 10)
        except:
            font = ImageFont.load_default()
        draw.text((x+5, y+5), f"F{i}", fill=COLORS['text'], font=font)
        
        # 绘制简单的角色轮廓
        center_x = x + w // 2
        center_y = y + h // 2
        # 头部
        draw.ellipse([center_x-8, center_y-20, center_x+8, center_y-4], fill=COLORS['text'])
        # 身体
        draw.rectangle([center_x-10, center_y-4, center_x+10, center_y+15], fill=COLORS['text'])
    
    return img

def create_effect_sequence(size, frames, effect_type='glow'):
    """创建特效序列帧"""
    images = []
    w, h = size
    
    for i in range(frames):
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # 基于帧数的动画参数
        progress = i / (frames - 1) if frames > 1 else 0
        
        if effect_type == 'glow':
            # 发光效果
            radius = int(w * 0.3 * (0.5 + progress * 0.5))
            alpha = int(255 * (1 - progress * 0.5))
            center = (w // 2, h // 2)
            draw.ellipse([center[0]-radius, center[1]-radius, 
                         center[0]+radius, center[1]+radius],
                        fill=(0, 255, 170, alpha))
        
        elif effect_type == 'pulse':
            # 脉冲效果
            radius = int(w * 0.4 * (0.5 + abs(progress - 0.5)))
            center = (w // 2, h // 2)
            draw.ellipse([center[0]-radius, center[1]-radius,
                         center[0]+radius, center[1]+radius],
                        outline=COLORS['accent'], width=3)
        
        elif effect_type == 'scan':
            # 扫描线效果
            line_y = int(h * progress)
            draw.line([0, line_y, w, line_y], fill=COLORS['accent'], width=2)
            # 发光区域
            for offset in range(-10, 11, 2):
                if 0 <= line_y + offset < h:
                    alpha = 255 - abs(offset) * 20
                    draw.line([0, line_y+offset, w, line_y+offset], 
                             fill=(0, 255, 170, max(0, alpha)), width=1)
        
        images.append(img)
    
    return images

def generate_player_sprites():
    """生成玩家角色精灵占位"""
    print("生成玩家角色精灵...")
    output_path = os.path.join(OUTPUT_DIR, "sprites")
    ensure_dir(output_path)
    
    # idle动画 (4帧)
    idle_strip = create_sprite_strip((64, 64), 4, "cenhui_idle")
    idle_strip.save(os.path.join(output_path, "placeholder_player_idle.png"))
    
    # walk动画 (8帧)
    walk_strip = create_sprite_strip((64, 64), 8, "cenhui_walk")
    walk_strip.save(os.path.join(output_path, "placeholder_player_walk.png"))
    
    print(f"  ✅ placeholder_player_idle.png (64x64, 4帧)")
    print(f"  ✅ placeholder_player_walk.png (64x64, 8帧)")

def generate_ability_effects():
    """生成能力特效占位"""
    print("生成能力特效序列帧...")
    output_path = os.path.join(OUTPUT_DIR, "effects")
    ensure_dir(output_path)
    
    # 深度感知激活 (12帧)
    depth_frames = create_effect_sequence((128, 128), 12, 'glow')
    for i, frame in enumerate(depth_frames):
        frame.save(os.path.join(output_path, f"placeholder_depth_activate_f{i:02d}.png"))
    
    # 深度感知循环 (8帧)
    depth_loop = create_effect_sequence((128, 128), 8, 'pulse')
    for i, frame in enumerate(depth_loop):
        frame.save(os.path.join(output_path, f"placeholder_depth_loop_f{i:02d}.png"))
    
    # 深度介入 (16帧)
    intervention_frames = create_effect_sequence((128, 128), 16, 'scan')
    for i, frame in enumerate(intervention_frames):
        frame.save(os.path.join(output_path, f"placeholder_intervention_f{i:02d}.png"))
    
    print(f"  ✅ placeholder_depth_activate_f*.png (128x128, 12帧)")
    print(f"  ✅ placeholder_depth_loop_f*.png (128x128, 8帧)")
    print(f"  ✅ placeholder_intervention_f*.png (128x128, 16帧)")

def generate_ui_placeholders():
    """生成UI占位图"""
    print("生成UI占位图...")
    output_path = os.path.join(OUTPUT_DIR, "ui")
    ensure_dir(output_path)
    
    # 标题界面背景
    title_bg = create_placeholder(750, 1334, "TITLE SCREEN", 'ui')
    title_bg.save(os.path.join(output_path, "placeholder_title_bg.png"))
    
    # 对话框背景
    dialogue_bg = create_placeholder(700, 200, "DIALOGUE BOX", 'ui')
    dialogue_bg.save(os.path.join(output_path, "placeholder_dialogue_bg.png"))
    
    # 头像框
    portrait_frame = create_placeholder(220, 220, "PORTRAIT", 'character')
    portrait_frame.save(os.path.join(output_path, "placeholder_portrait_frame.png"))
    
    # 能力栏
    ability_bar = create_placeholder(300, 80, "ABILITIES", 'ui')
    ability_bar.save(os.path.join(output_path, "placeholder_ability_bar.png"))
    
    # 计数器显示
    counter_display = create_placeholder(200, 60, "R|P|W", 'ui')
    counter_display.save(os.path.join(output_path, "placeholder_counters.png"))
    
    print(f"  ✅ placeholder_title_bg.png (750x1334)")
    print(f"  ✅ placeholder_dialogue_bg.png (700x200)")
    print(f"  ✅ placeholder_portrait_frame.png (220x220)")
    print(f"  ✅ placeholder_ability_bar.png (300x80)")
    print(f"  ✅ placeholder_counters.png (200x60)")

def generate_scene_placeholders():
    """生成场景占位图"""
    print("生成场景占位图...")
    output_path = os.path.join(OUTPUT_DIR, "scenes")
    ensure_dir(output_path)
    
    # 通用场景背景
    scene_bg = create_placeholder(750, 1334, "SCENE BG", 'scene')
    scene_bg.save(os.path.join(output_path, "placeholder_scene_bg.png"))
    
    # 缺失的C2场景
    for zone_id in ['C2-Z2', 'C2-Z3', 'C2-Z4', 'C2-Z5', 'C2-Z6', 'C2-Z7']:
        zone_bg = create_placeholder(750, 1334, zone_id, 'scene')
        zone_bg.save(os.path.join(output_path, f"placeholder_bg_{zone_id.lower().replace('-', '')}.png"))
    
    print(f"  ✅ placeholder_scene_bg.png (750x1334)")
    print(f"  ✅ placeholder_bg_c2z*.png (6个场景)")

def main():
    """主函数"""
    print("=" * 50)
    print("《备注 / Footnote》占位图资产生成器")
    print("=" * 50)
    print()
    
    ensure_dir(OUTPUT_DIR)
    
    generate_player_sprites()
    print()
    generate_ability_effects()
    print()
    generate_ui_placeholders()
    print()
    generate_scene_placeholders()
    
    print()
    print("=" * 50)
    print("占位图生成完成!")
    print(f"输出目录: {OUTPUT_DIR}")
    print("=" * 50)

if __name__ == "__main__":
    main()


