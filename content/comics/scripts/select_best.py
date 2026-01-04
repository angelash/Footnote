#!/usr/bin/env python3
"""EP01 最佳图片筛选与归档脚本"""

import os
import shutil
import json

# EP01 筛选结果（人工审核后的最佳图索引，从1开始）
SELECTIONS = {
    "P01": 3,  # 扉页 - 图3招牌最清晰
    "P02": 3,  # 晨间核验 - 图3屏幕文字清晰
    "P03": 1,  # 延迟三秒 - 图1张力十足
    "P04": 1,  # 薄墙任务 - 图1叙事完整
    "P05": 1,  # 发现空腔 - 图1悬疑感强
    "P06": 1,  # 第一次记录 - 图1核心情节
    "P07": 1,  # 早餐摊
    "P08": 1,  # 双日期
    "P09": 1,  # 回家路上
    "P10": 1,  # 错误门牌
    "P11": 1,  # 空地场景
    "P12": 1,  # 空椅发现
    "P13": 1,  # 悬浮篮子
    "P14": 1,  # 第三条记录
    "P15": 1,  # 夜晚房间
    "P16": 1,  # 整理思绪
    "P17": 1,  # 决心
    "P18": 1,  # 预告页
}

# 文件名映射
FILE_MAP = {
    "P01": "EP01-P01-title",
    "P02": "EP01-P02-verify",
    "P03": "EP01-P03-delay",
    "P04": "EP01-P04-task",
    "P05": "EP01-P05-hollow",
    "P06": "EP01-P06-record",
    "P07": "EP01-P07-more",
    "P08": "EP01-P08-chair",
    "P09": "EP01-P09-home",
    "P10": "EP01-P10-plate",
    "P11": "EP01-P11-vacant",
    "P12": "EP01-P12-invisible-chair",
    "P13": "EP01-P13-record-chair",
    "P14": "EP01-P14-record-invisible",
    "P15": "EP01-P15-night-room",
    "P16": "EP01-P16-organize",
    "P17": "EP01-P17-decision",
    "P18": "EP01-P18-preview",
}

def main():
    source_dir = "comics/generated/ep01-v4/approved"
    output_dir = "comics/output/ep01"
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    copied = []
    for page_id, selection in SELECTIONS.items():
        prefix = FILE_MAP[page_id]
        src_file = f"{source_dir}/{prefix}_{selection}.webp"
        dst_file = f"{output_dir}/page-{page_id[1:]}.webp"
        
        if os.path.exists(src_file):
            shutil.copy2(src_file, dst_file)
            print(f"[OK] {page_id}: {prefix}_{selection}.webp -> {dst_file}")
            copied.append(page_id)
        else:
            print(f"[SKIP] {page_id}: {src_file} not found")
    
    print(f"\nTotal: {len(copied)}/18 pages copied to {output_dir}")
    
    # 更新data.json中的selected字段
    update_data_json()

def update_data_json():
    data_path = "comics/viewer/data.json"
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for ep in data['episodes']:
        if ep['id'] == 'ep01':
            for page in ep['pages']:
                page_id = page['id']
                if page_id in SELECTIONS:
                    selection = SELECTIONS[page_id] - 1  # 转为0-based index
                    page['selected'] = selection
                    if page['candidates'] and len(page['candidates']) > selection:
                        page['final'] = f"output/ep01/page-{page_id[1:]}.webp"
    
    with open(data_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Updated {data_path}")

if __name__ == '__main__':
    main()

