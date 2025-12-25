# -*- coding: utf-8 -*-
"""测试图片生成"""
from image_gen import ImageGenerator

API_KEY = "61ec3ab6-845e-4cd3-b753-5a4e000b1c73"

g = ImageGenerator(API_KEY)
g.generate("一只可爱的小猫咪", output_path="test_cat.png")

