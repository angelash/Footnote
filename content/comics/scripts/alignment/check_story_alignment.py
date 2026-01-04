#!/usr/bin/env python3
"""
剧情对齐检查（最小可用版）

目的：
- 以 story 为最高参照，扫描漫画产物中出现的“关键锚点短语”
- 给出这些锚点在小说中实际出现的章节位置
- 对比当前EP01/EP02的声明章节范围，找出明显不对齐点

输出：
- docs/alignment/alignment_check.json
- docs/alignment/剧情对齐分析报告.md（自动生成版本，后续会被人工报告补充/合并）
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def _load_story_index(repo_root: Path) -> dict[str, Any]:
    p = repo_root / "docs" / "alignment" / "story_index.json"
    if not p.exists():
        raise FileNotFoundError("Missing story_index.json. Run extract_story_index.py first.")
    return json.loads(p.read_text(encoding="utf-8"))


def _chapter_text(repo_root: Path, ch: dict[str, Any]) -> str:
    src = repo_root / ch["source_file"]
    lines = src.read_text(encoding="utf-8").splitlines()
    start = int(ch["start_line"])
    end = int(ch["end_line"])
    return "\n".join(lines[start - 1 : end])


def _find_phrase_chapters(repo_root: Path, story_index: dict[str, Any], phrase: str) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for ch in story_index["chapters"]:
        text = _chapter_text(repo_root, ch)
        if phrase in text:
            hits.append(
                {
                    "chapter": ch["number"],
                    "title": ch["title"],
                    "part": ch["part_number"],
                    "source_file": ch["source_file"],
                }
            )
    return hits


def _read_text(repo_root: Path, rel: str) -> str:
    p = repo_root / rel
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def _extract_declared_chapters_from_yaml_like(text: str) -> list[int]:
    # chapters: [1, 2, 3]
    m = re.search(r"^\s*chapters:\s*\[(?P<body>[^\]]+)\]\s*$", text, flags=re.MULTILINE)
    if not m:
        return []
    body = m.group("body")
    nums: list[int] = []
    for token in body.split(","):
        t = token.strip()
        if not t:
            continue
        if t.isdigit():
            nums.append(int(t))
    return nums


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    story_index = _load_story_index(repo_root)

    # === 1) 收集漫画产物中“出现即有强定位意义”的锚点短语 ===
    anchors = [
        "身份：核对中",
        "核对中持续了三秒",
        "互斥双日期",
        "两份小票",
        "17-06",
        "路线：已更正",
        "以最新更正为准",
        "结论：稳定",
        "对日期不敏感",
        "你今天像昨天",
        "你回来得更快了",
        "空椅",
        "边缘断口",
        "例外许可",
        "此行为在当前模型中无意义",
    ]

    artifacts = {
        "ep01_scene_analysis": "comics/scripts/ep01/ep01-scene-analysis.yaml",
        "ep02_scene_analysis": "comics/scripts/ep02/ep02-scene-analysis.yaml",
        "ep01_prompts": "comics/scripts/ep01/ep01-prompts-full.md",
        "ep02_prompts": "comics/scripts/ep02/ep02-prompts-full.md",
    }

    artifact_text: dict[str, str] = {k: _read_text(repo_root, v) for k, v in artifacts.items()}

    declared = {
        "EP01": _extract_declared_chapters_from_yaml_like(artifact_text["ep01_scene_analysis"]),
        "EP02": _extract_declared_chapters_from_yaml_like(artifact_text["ep02_scene_analysis"]),
    }

    # === 2) 锚点在小说中的真实落点 ===
    anchor_hits: dict[str, Any] = {}
    for a in anchors:
        anchor_hits[a] = _find_phrase_chapters(repo_root, story_index, a)

    # === 3) 锚点在漫画产物中的出现情况 ===
    used_in: dict[str, list[str]] = {a: [] for a in anchors}
    for a in anchors:
        for art_key, txt in artifact_text.items():
            if a and txt and a in txt:
                used_in[a].append(art_key)

    # === 4) 明显不对齐规则：锚点出现在某EP产物里，但锚点在小说中只落在EP声明章节之外 ===
    # 这只是“报警器”，用于快速定位最明显的问题，不等于最终裁决。
    alarms: list[dict[str, Any]] = []
    for a in anchors:
        if not used_in[a]:
            continue
        hits = anchor_hits[a]
        hit_chapters = sorted({h["chapter"] for h in hits})
        if not hit_chapters:
            continue

        # 仅对 EP01/EP02 做快速检查
        for ep in ["EP01", "EP02"]:
            ep_decl = declared.get(ep, [])
            if not ep_decl:
                continue

            appears = False
            if ep == "EP01":
                appears = any(k.startswith("ep01_") for k in used_in[a])
            if ep == "EP02":
                appears = any(k.startswith("ep02_") for k in used_in[a])
            if not appears:
                continue

            if not any(ch in ep_decl for ch in hit_chapters):
                alarms.append(
                    {
                        "ep": ep,
                        "anchor": a,
                        "declared_chapters": ep_decl,
                        "novel_chapters": hit_chapters,
                        "used_in": used_in[a],
                    }
                )

    out_dir = repo_root / "docs" / "alignment"
    out_dir.mkdir(parents=True, exist_ok=True)

    out_json = out_dir / "alignment_check.json"
    out_json.write_text(
        json.dumps(
            {
                "declared_episode_chapters": declared,
                "anchors": anchors,
                "anchor_hits_in_novel": anchor_hits,
                "anchor_used_in_artifacts": used_in,
                "alarms": alarms,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    # 输出一份可读的MD（简洁版，最终报告由人工补充）
    md_lines: list[str] = []
    md_lines.append("# 剧情对齐分析报告（自动检查输出）")
    md_lines.append("")
    md_lines.append("## 1. 参照与范围")
    md_lines.append("")
    md_lines.append("- **最高参照**：`story/1.md` ~ `story/5.md`（共 65 章）")
    md_lines.append("- **本次检查**：EP01/EP02 的 scene-analysis + prompts（锚点扫描）")
    md_lines.append("")
    md_lines.append("## 2. EP声明章节范围（来自 scene-analysis.yaml）")
    md_lines.append("")
    md_lines.append(f"- **EP01**: {declared.get('EP01', [])}")
    md_lines.append(f"- **EP02**: {declared.get('EP02', [])}")
    md_lines.append("")
    md_lines.append("## 3. 锚点落点（小说）与引用（漫画产物）")
    md_lines.append("")
    for a in anchors:
        used = used_in[a]
        hits = anchor_hits[a]
        if not used and not hits:
            continue
        hit_str = ", ".join([f"{h['chapter']}《{h['title']}》" for h in hits[:8]])
        if len(hits) > 8:
            hit_str += "…"
        md_lines.append(f"- **{a}**")
        md_lines.append(f"  - 小说章节：{hit_str if hit_str else '（未命中）'}")
        md_lines.append(f"  - 漫画引用：{', '.join(used) if used else '（未出现）'}")
    md_lines.append("")
    md_lines.append("## 4. 自动报警（高概率不对齐）")
    md_lines.append("")
    if not alarms:
        md_lines.append("- （无）")
    else:
        for al in alarms:
            md_lines.append(
                f"- **{al['ep']}** 引用了锚点 **{al['anchor']}**，但小说落点章节为 {al['novel_chapters']}，不在声明章节 {al['declared_chapters']} 内。"
            )
    md_lines.append("")
    md_lines.append("## 5. 下一步（人工复核）")
    md_lines.append("")
    md_lines.append("- 以本报告 alarms 为入口，逐条回到小说原文复核是否确为“挪用/提前/错章”。")
    md_lines.append("- 若确认不对齐：修正EP章节划分、重写受影响分镜与提示词，再决定是否需要重出图。")
    md_lines.append("")

    out_md = out_dir / "剧情对齐分析报告.md"
    out_md.write_text("\n".join(md_lines).rstrip() + "\n", encoding="utf-8")

    print(f"[OK] alignment check generated: {out_json.relative_to(repo_root)}")
    print(f"[OK] alignment report generated: {out_md.relative_to(repo_root)}")


if __name__ == "__main__":
    main()


