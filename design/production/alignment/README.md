# 对齐工具说明（Story → Docs/Data/Comics）

## 目标

- **以小说为唯一最高参照**（`story/1.md` ~ `story/5.md`）
- 生成“权威章节索引”
- 扫描漫画产物中的锚点短语，自动报警“明显错位/提前”

---

## 生成小说章节索引

在仓库根目录执行：

```bash
python comics/scripts/alignment/extract_story_index.py
```

输出：

- `docs/alignment/story_index.json`
- `docs/alignment/story_index.md`

---

## 运行剧情对齐自动检查（EP01/EP02）

在仓库根目录执行：

```bash
python comics/scripts/alignment/check_story_alignment.py
```

输出：

- `docs/alignment/alignment_check.json`
- `docs/alignment/剧情对齐分析报告.md`（自动生成简版）

---

## 说明

该检查脚本是“报警器”，用于快速定位最明显的错位点；最终裁决以人工回到小说原文复核为准。


