# -*- coding: utf-8 -*-
"""
测试图片生成功能
- 文生图：根据描述生成图片
- 图生图：根据指令修改图片
"""
import os
from image_gen import ImageGenerator

API_KEY = "61ec3ab6-845e-4cd3-b753-5a4e000b1c73"


def test_text_to_image():
    """测试文生图"""
    print("\n=== 测试文生图 ===")
    g = ImageGenerator(API_KEY)
    result = g.generate("一只可爱的小猫咪", output_path="test_cat.png")
    print(f"文生图结果: {result}")
    return result


def test_image_to_image():
    """测试图生图"""
    print("\n=== 测试图生图 ===")
    
    # 确保有输入图片
    input_image = "test_cat.png"
    if not os.path.exists(input_image):
        print(f"需要先生成输入图片: {input_image}")
        input_image = test_text_to_image()
    
    g = ImageGenerator(API_KEY)
    
    # 测试1: 添加元素
    result1 = g.edit_image(
        input_image=input_image,
        prompt="给猫咪戴上一顶红色的帽子",
        output_path="test_cat_hat.png",
        temperature=1.0,
        top_p=0.95
    )
    print(f"图生图结果1 (添加帽子): {result1}")
    
    # 测试2: 改变背景
    result2 = g.edit_image(
        input_image=input_image,
        prompt="把背景改成星空夜晚",
        output_path="test_cat_night.png"
    )
    print(f"图生图结果2 (改变背景): {result2}")
    
    return result1, result2


def test_image_to_image_chain():
    """测试连续图生图"""
    print("\n=== 测试连续图生图 ===")
    
    g = ImageGenerator(API_KEY)
    
    # 第一步：生成基础图
    base_image = g.generate(
        "一个简单的红色苹果，白色背景",
        output_path="test_apple_base.png"
    )
    print(f"基础图: {base_image}")
    
    # 第二步：添加叶子
    step1 = g.edit_image(
        input_image=base_image,
        prompt="给苹果添加绿色的叶子",
        output_path="test_apple_leaf.png"
    )
    print(f"添加叶子: {step1}")
    
    # 第三步：添加露珠
    step2 = g.edit_image(
        input_image=step1,
        prompt="在苹果表面添加几滴水珠",
        output_path="test_apple_water.png"
    )
    print(f"添加水珠: {step2}")
    
    return step2


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "text":
            test_text_to_image()
        elif cmd == "image":
            test_image_to_image()
        elif cmd == "chain":
            test_image_to_image_chain()
        else:
            print(f"未知命令: {cmd}")
            print("用法: python test_gen.py [text|image|chain]")
    else:
        # 默认运行所有测试
        print("运行所有测试...")
        print("用法: python test_gen.py [text|image|chain]")
        test_text_to_image()
        test_image_to_image()

