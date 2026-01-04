#!/usr/bin/env python3
"""
逐章节漫画生产骨架初始化

目标：
- 基于 docs/alignment/story_index.json 生成指定范围的章节目录与“阶段性文档”
- 每章按 Phase1-4 产出可逐级验收的文件占位

产物（每章）：
comics/scripts/chapters/chXX/
  - chXX-source.md                 # 该章原文摘录（自动截取）
  - chXX-scene-analysis.yaml       # Phase1：内容分析（待填写）
  - chXX-prompts-full.md           # Phase2：分镜+提示词（待填写）
  - chXX-urls.txt                  # Phase3：生成URL（待填写）
  - chXX-selection.json            # Phase4：4选1结果（待填写）
docs/chapters/CHXX-验收.md          # 验收入口（每章一份）
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ChapterRef:
    number: int
    title: str
    part_number: int
    part_title: str
    source_file: str
    start_line: int
    end_line: int


def _load_story_index(repo_root: Path) -> dict[str, Any]:
    p = repo_root / "docs" / "alignment" / "story_index.json"
    return json.loads(p.read_text(encoding="utf-8"))


def _get_chapter(index: dict[str, Any], ch_no: int) -> ChapterRef:
    for ch in index["chapters"]:
        if int(ch["number"]) == ch_no:
            return ChapterRef(
                number=int(ch["number"]),
                title=str(ch["title"]),
                part_number=int(ch["part_number"]),
                part_title=str(ch["part_title"]),
                source_file=str(ch["source_file"]),
                start_line=int(ch["start_line"]),
                end_line=int(ch["end_line"]),
            )
    raise KeyError(f"chapter not found: {ch_no}")


def _extract_chapter_text(repo_root: Path, ref: ChapterRef) -> str:
    p = repo_root / ref.source_file
    lines = p.read_text(encoding="utf-8").splitlines()
    body = "\n".join(lines[ref.start_line - 1 : ref.end_line])
    return body.rstrip() + "\n"


def _write_if_missing(path: Path, content: str) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

def _get_max_chapter_no(index: dict[str, Any]) -> int:
    max_no = 0
    for ch in index.get("chapters", []):
        try:
            max_no = max(max_no, int(ch["number"]))
        except Exception:
            continue
    if max_no <= 0:
        raise ValueError("no chapters found in story_index.json")
    return max_no


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    idx = _load_story_index(repo_root)
    max_ch_no = _get_max_chapter_no(idx)

    parser = argparse.ArgumentParser(description="init chapter scaffolding from story_index.json")
    parser.add_argument("--start", type=int, default=1, help="start chapter number (inclusive)")
    parser.add_argument("--end", type=int, default=max_ch_no, help="end chapter number (inclusive)")
    args = parser.parse_args()

    start_no = max(1, int(args.start))
    end_no = min(max_ch_no, int(args.end))
    if start_no > end_no:
        raise SystemExit(f"invalid range: start={start_no} > end={end_no}")

    chapters_dir = repo_root / "comics" / "scripts" / "chapters"
    docs_dir = repo_root / "docs" / "chapters"
    chapters_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    for ch_no in range(start_no, end_no + 1):
        ref = _get_chapter(idx, ch_no)
        ch_id = f"ch{ch_no:02d}"
        ch_folder = chapters_dir / ch_id

        # Phase0: 原文摘录（权威参照）
        source_md = ch_folder / f"{ch_id}-source.md"
        _write_if_missing(
            source_md,
            f"# CH{ch_no:02d}《{ref.title}》原文摘录（权威参照）\n\n"
            f"> 来源：`{ref.source_file}` L{ref.start_line}-L{ref.end_line}\n\n"
            + _extract_chapter_text(repo_root, ref),
        )

        # Phase1: 场景分析
        scene_yaml = ch_folder / f"{ch_id}-scene-analysis.yaml"
        _write_if_missing(
            scene_yaml,
            f"# CH{ch_no:02d}《{ref.title}》场景分析（Phase 1）\n"
            f"# 参照：{ref.source_file} L{ref.start_line}-L{ref.end_line}\n\n"
            "metadata:\n"
            f"  chapter: {ch_no}\n"
            f"  title: {ref.title}\n"
            f"  part: \"第{ref.part_number}部：{ref.part_title}\"\n"
            "  status: draft\n"
            "  scope:\n"
            "    - \"只允许使用本章原文内容，不得引入后续章事件/术语\"\n"
            "\n"
            "characters:\n"
            "  cenhui:\n"
            "    name: 岑回\n"
            "    gender: 男\n"
            "    description: \"20多岁的亚洲男性，黑色短发整齐干练，深邃疲倦但锐利的眼神，穿着灰色维修局工作服，胸口佩戴工号牌，身材中等偏瘦，气质克制沉稳\"\n"
            "\n"
            "anchors:\n"
            "  # 每章至少列 6-12 个“原文锚点短句”，用于对齐检查\n"
            "  - \"待填写：从原文复制短句\"\n"
            "\n"
            "scenes:\n"
            "  # 每个 scene 对应一段可视化单元（可拆成漫画页）\n"
            "  - id: S01\n"
            "    location: \"待填写\"\n"
            "    event: \"待填写\"\n"
            "    beats:\n"
            "      - \"待填写\"\n",
        )

        # Phase2: 提示词
        prompts_md = ch_folder / f"{ch_id}-prompts-full.md"
        _write_if_missing(
            prompts_md,
            f"# CH{ch_no:02d}《{ref.title}》分镜与完整提示词（Phase 2）\n\n"
            "## 使用说明\n"
            "- 以 `chXX-scene-analysis.yaml` 为输入\n"
            "- 每页输出 1 张图（默认 2x2 四格），含中文对白/旁白\n"
            "- 每页生成 4 张候选图\n\n"
            "## 全局风格锚定（每页必须包含）\n"
            "```\n"
            "彩色漫画，赛博朋克风格，暗色调配色，霓虹蓝/品红点缀，清晰线条，高质量数字绘画，统一的人物设计，一致的光影处理。\n"
            "```\n\n"
            "## 主角设定（每页必须包含）\n"
            "```\n"
            "岑回：20多岁的亚洲男性，黑色短发整齐干练，深邃疲倦但锐利的眼神，穿着灰色维修局工作服，胸口佩戴工号牌，身材中等偏瘦，气质克制沉稳。\n"
            "```\n\n"
            "## 页面列表\n"
            "> 待 Phase1 验收后再填充。\n",
        )

        # Phase3: URL记录
        urls_txt = ch_folder / f"{ch_id}-urls.txt"
        _write_if_missing(
            urls_txt,
            f"# CH{ch_no:02d}《{ref.title}》生成URL记录（Phase 3）\n\n"
            "## 说明\n"
            "- 每页 4 条 URL\n"
            "- 以截图确认完成（不看进度条）\n\n"
            "## P01\n",
        )

        # Phase4: 选择结果
        selection_json = ch_folder / f"{ch_id}-selection.json"
        _write_if_missing(
            selection_json,
            json.dumps(
                {
                    "chapter": ch_no,
                    "title": ref.title,
                    "status": "draft",
                    "pages": [],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
        )

        # 验收入口文档
        accept_md = docs_dir / f"CH{ch_no:02d}-验收.md"
        _write_if_missing(
            accept_md,
            f"# CH{ch_no:02d}《{ref.title}》阶段性验收\n\n"
            f"- 权威原文：`comics/scripts/chapters/{ch_id}/{ch_id}-source.md`\n"
            f"- Phase1（场景分析）：`comics/scripts/chapters/{ch_id}/{ch_id}-scene-analysis.yaml`\n"
            f"- Phase2（分镜提示词）：`comics/scripts/chapters/{ch_id}/{ch_id}-prompts-full.md`\n"
            f"- Phase3（URL记录）：`comics/scripts/chapters/{ch_id}/{ch_id}-urls.txt`\n"
            f"- Phase4（筛选结果）：`comics/scripts/chapters/{ch_id}/{ch_id}-selection.json`\n\n"
            "## Phase 1：内容分析验收\n"
            "- [ ] anchors 是否全部来自原文（逐条可定位）\n"
            "- [ ] scene 列表是否覆盖本章关键事件且不引入后续章术语\n\n"
            "## Phase 2：分镜与提示词验收\n"
            "- [ ] 每页对白/旁白均为中文，且来自原文或严格等价改写\n"
            "- [ ] 不出现后期术语（对账/模型/无意义判词等，若原文未出现）\n\n"
            "## Phase 3：出图验收\n"
            "- [ ] 每页 4 张候选图 URL 记录完整\n"
            "- [ ] 截图确认完成（以截图为准）\n\n"
            "## Phase 4：归档验收\n"
            "- [ ] 每页选 1 张最佳图并归档\n"
            "- [ ] viewer 可浏览该章\n",
        )

    # 创建新的 viewer/data.json（章节模式）
    viewer_data = repo_root / "comics" / "viewer" / "data.json"
    if not viewer_data.exists():
        viewer_data.write_text(
            json.dumps(
                {
                    "title": "备注 / Footnote（重做版）",
                    "description": "按章节逐级验收的漫画生产",
                    "chapters": [],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    print(f"[OK] chapter scaffolding generated: CH{start_no:02d}-CH{end_no:02d} (max=CH{max_ch_no:02d})")


if __name__ == "__main__":
    main()


