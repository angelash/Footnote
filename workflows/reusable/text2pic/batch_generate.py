# -*- coding: utf-8 -*-
"""
Footnote 游戏素材批量生成器
基于 Gemini 2.5 Flash Image API
按照游戏美术风格指南生成不同类型的素材
"""

import os
import time
from pathlib import Path
from image_gen import ImageGenerator

# API Key
API_KEY = "61ec3ab6-845e-4cd3-b753-5a4e000b1c73"

# 输出目录
OUTPUT_BASE = Path(__file__).parent / "generated"

# 全局风格约束前缀
STYLE_PREFIX = """
风格要求：赛博-东方极简风格，深色调为主，荧光强调色点缀
视觉特点：干净线条、简化细节、克制表达、系统感
色彩：深蓝黑背景(#0A0E17-#1E2940)，量子青(#00F5D4)、琥珀光(#FFD166)、收敛紫(#A855F7)作为强调色
无文字无水印，适合游戏使用
"""

# 背景素材配置
BACKGROUND_PROMPTS = [
    {
        "name": "bg_residential_alley",
        "prompt": "一条深夜的居住环小巷，两侧是简约的旧楼建筑，昏暗的路灯发出温暖的橙黄光，地面有轻微反光，远处是朦胧的高楼轮廓，整体氛围安静孤独，赛博朋克东方风格，深色调为主",
        "aspect_ratio": "9:16"
    },
    {
        "name": "bg_archive_room",
        "prompt": "神秘的档案室内部，高大的档案柜延伸到暗处，褐色调的旧纸堆叠，一盏昏黄的台灯照亮一角，空气中漂浮着微尘，怀旧神秘的氛围，赛博-东方极简风格",
        "aspect_ratio": "9:16"
    },
    {
        "name": "bg_edge_fracture",
        "prompt": "世界边缘的断裂区域，深黑色的虚空中有青色荧光裂隙，扭曲的空间碎片漂浮，结构异常可视化，危险而神秘的氛围，赛博朋克风格",
        "aspect_ratio": "9:16"
    },
]

# 角色素材配置
CHARACTER_PROMPTS = [
    {
        "name": "char_mysterious_figure",
        "prompt": "赛博朋克风格的神秘人物立绘，穿着深色工装外套，面部轮廓简洁，表情克制冷静，青色的科技线条点缀在服装边缘，深蓝灰色调为主，简洁有力的剪影，游戏角色设计，透明背景",
        "aspect_ratio": "3:4"
    },
    {
        "name": "char_data_keeper",
        "prompt": "数据守护者角色立绘，穿着带有金色边缘的深蓝正装，手持发光的数据晶片，表情沉稳威严，赛博-东方极简风格，干净线条设计，游戏角色，透明背景",
        "aspect_ratio": "3:4"
    },
    {
        "name": "char_wanderer",
        "prompt": "漂泊者角色立绘，穿着层叠的灰色破旧外衣，身上有空间错位的视觉效果，表情迷茫，周围有淡淡的紫色光晕，赛博朋克风格，游戏角色设计，透明背景",
        "aspect_ratio": "3:4"
    },
]

# 物品素材配置
OBJECT_PROMPTS = [
    {
        "name": "obj_memory_chip",
        "prompt": "发光的记忆芯片道具图标，青色荧光边缘，精密的电路纹理，悬浮在深色背景上，赛博朋克风格，游戏道具设计，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "obj_archive_scroll",
        "prompt": "古老的档案卷轴道具，褐色泛黄的纸张，卷轴边缘有细微的金色纹饰，微微发出暖黄光晕，赛博-东方极简风格，游戏道具图标，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "obj_dimensional_key",
        "prompt": "维度钥匙道具，几何形状的金属钥匙，表面有发光的青色符文，散发着神秘的紫色光芒，赛博朋克风格，游戏道具设计，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "obj_prayer_card",
        "prompt": "祈祷卡片道具，深蓝色的卡面，边缘有金色线条装饰，中央是一个发光的神秘符号，赛博-东方神秘风格，游戏卡牌设计，透明背景",
        "aspect_ratio": "1:1"
    },
]

# 特效素材配置
EFFECT_PROMPTS = [
    {
        "name": "fx_depth_perception",
        "prompt": "深度感知能力特效，青色的扫描线从上向下扫过，半透明的线框网格效果，边缘有微弱的发光，赛博朋克科技感，游戏特效设计，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "fx_time_ripple",
        "prompt": "时间波纹特效，同心圆向外扩散的波纹，紫色到青色的渐变发光，有轻微的重影效果，时空扭曲感，游戏特效设计，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "fx_scar_mark",
        "prompt": "深度伤痕特效，裂缝状的发光纹理，边缘发出青色的光芒，中央是深邃的黑色裂隙，赛博朋克风格，游戏特效设计，透明背景",
        "aspect_ratio": "1:1"
    },
]

# UI素材配置
UI_PROMPTS = [
    {
        "name": "ui_dialogue_panel",
        "prompt": "游戏对话框面板UI设计，深蓝色半透明背景，青色发光的细边框，右上角有小型装饰图标，赛博朋克-东方极简风格，干净简洁的设计",
        "aspect_ratio": "16:9"
    },
    {
        "name": "ui_ability_icon",
        "prompt": "能力图标UI，一只发光的眼睛符号，青色荧光描边，深色填充，圆形边框，赛博朋克风格，游戏图标设计，透明背景",
        "aspect_ratio": "1:1"
    },
    {
        "name": "ui_warning_indicator",
        "prompt": "警告状态指示器UI，三角形警告符号，琥珀黄色发光效果，脉冲动感设计，赛博朋克风格，游戏界面元素，透明背景",
        "aspect_ratio": "1:1"
    },
]


def ensure_dirs():
    """确保输出目录存在"""
    dirs = ["backgrounds", "characters", "objects", "effects", "ui"]
    for d in dirs:
        (OUTPUT_BASE / d).mkdir(parents=True, exist_ok=True)


def generate_assets(generator: ImageGenerator, prompts: list, category: str, batch_name: str = ""):
    """生成一组素材"""
    output_dir = OUTPUT_BASE / category
    results = []
    
    print(f"\n{'='*60}")
    print(f"开始生成 {category} 素材 ({len(prompts)} 个)")
    print(f"{'='*60}")
    
    for i, item in enumerate(prompts):
        name = item["name"]
        prompt = STYLE_PREFIX + item["prompt"]
        aspect_ratio = item.get("aspect_ratio", "1:1")
        
        output_path = output_dir / f"{name}.png"
        
        print(f"\n[{i+1}/{len(prompts)}] 生成: {name}")
        print(f"  宽高比: {aspect_ratio}")
        print(f"  提示词: {item['prompt'][:50]}...")
        
        try:
            result = generator.generate(
                prompt=prompt,
                output_path=str(output_path),
                aspect_ratio=aspect_ratio,
                temperature=0.7
            )
            results.append({"name": name, "path": result, "status": "success"})
            print(f"  [OK] {result}")
        except Exception as e:
            results.append({"name": name, "error": str(e), "status": "failed"})
            print(f"  [FAIL] {e}")
        
        # 避免请求过快
        time.sleep(2)
    
    return results


def main():
    """主函数"""
    print("=" * 60)
    print("Footnote 游戏素材批量生成器")
    print("=" * 60)
    
    # 确保目录存在
    ensure_dirs()
    
    # 创建生成器
    generator = ImageGenerator(API_KEY)
    
    all_results = {}
    
    # 生成各类素材
    all_results["backgrounds"] = generate_assets(generator, BACKGROUND_PROMPTS, "backgrounds")
    all_results["characters"] = generate_assets(generator, CHARACTER_PROMPTS, "characters")
    all_results["objects"] = generate_assets(generator, OBJECT_PROMPTS, "objects")
    all_results["effects"] = generate_assets(generator, EFFECT_PROMPTS, "effects")
    all_results["ui"] = generate_assets(generator, UI_PROMPTS, "ui")
    
    # 汇总结果
    print("\n" + "=" * 60)
    print("生成结果汇总")
    print("=" * 60)
    
    total_success = 0
    total_failed = 0
    
    for category, results in all_results.items():
        success = sum(1 for r in results if r["status"] == "success")
        failed = sum(1 for r in results if r["status"] == "failed")
        total_success += success
        total_failed += failed
        print(f"{category}: 成功 {success}/{len(results)}")
    
    print(f"\n总计: 成功 {total_success}, 失败 {total_failed}")
    print(f"输出目录: {OUTPUT_BASE}")


if __name__ == "__main__":
    main()

