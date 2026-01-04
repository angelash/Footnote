#!/usr/bin/env python3
"""
EP02图片筛选归档脚本
为每页选择最佳图片并归档到output目录
"""
import os
import json
import shutil

# 配置
EPISODE = "ep02"
PAGES = 18
GENERATED_DIR = "../../generated/ep02"
OUTPUT_DIR = "../../output/ep02"
DATA_JSON = "../../viewer/data.json"

# 创建输出目录
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 读取现有data.json
with open(DATA_JSON, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 检查EP02是否存在
ep02_exists = any(ep['id'] == EPISODE for ep in data['episodes'])

if not ep02_exists:
    # 添加EP02条目
    ep02_data = {
        "id": EPISODE,
        "title": "EP02 记录者",
        "status": "processing",
        "pages": []
    }
    data['episodes'].append(ep02_data)

# 获取EP02数据
for ep in data['episodes']:
    if ep['id'] == EPISODE:
        ep02_data = ep
        break

# 页面标题映射
page_titles = {
    "p01": "无限延伸的走廊（扉页）",
    "p02": "门牌17-06",
    "p03": "进入异常走廊",
    "p04": "迷宫奔跑",
    "p05": "发现门框逃离",
    "p06": "遇见宋岚",
    "p07": "差异规则",
    "p08": "便签告别",
    "p09": "市政大厅",
    "p10": "自动更正",
    "p11": "帮老人填表",
    "p12": "离开办事厅",
    "p13": "医疗站",
    "p14": "填问卷",
    "p15": "许澄医生",
    "p16": "遇到阿棠",
    "p17": "对日期不敏感",
    "p18": "结论单：稳定"
}

# 清空pages列表重新生成
ep02_data['pages'] = []

# 处理每一页
for page_num in range(1, PAGES + 1):
    page_id = f"p{page_num:02d}"
    
    # 候选图片路径
    candidates = []
    for i in range(1, 5):
        src = os.path.join(GENERATED_DIR, f"{page_id}_{i}.webp")
        if os.path.exists(src):
            candidates.append(f"generated/{EPISODE}/{page_id}_{i}.webp")
    
    # 默认选择第一张作为最佳（之后可以手动调整）
    selected_idx = 0
    
    # 复制最佳图片到output
    src_file = os.path.join(GENERATED_DIR, f"{page_id}_{selected_idx + 1}.webp")
    dst_file = os.path.join(OUTPUT_DIR, f"page-{page_num:02d}.webp")
    
    if os.path.exists(src_file):
        shutil.copy2(src_file, dst_file)
        print(f"{page_id}: Copied candidate {selected_idx + 1} to output")
    else:
        print(f"{page_id}: WARNING - source file not found: {src_file}")
    
    # 添加页面数据
    page_data = {
        "id": page_id,
        "title": page_titles.get(page_id, f"Page {page_num}"),
        "candidates": candidates,
        "selected": selected_idx,
        "final": f"output/{EPISODE}/page-{page_num:02d}.webp"
    }
    ep02_data['pages'].append(page_data)

# 更新状态
ep02_data['status'] = "completed"

# 保存data.json
with open(DATA_JSON, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nEP02 archive complete!")
print(f"- Pages processed: {PAGES}")
print(f"- Output directory: {OUTPUT_DIR}")
print(f"- Data JSON updated: {DATA_JSON}")

