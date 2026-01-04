#!/usr/bin/env python3
"""
从 story/*.md 抽取《备注》小说的“部/章”结构索引，作为剧情对齐的权威参照。

输出：
- docs/alignment/story_index.json
- docs/alignment/story_index.md
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Optional


@dataclass(frozen=True)
class ChapterIndexItem:
    number: int
    title: str
    part_number: int
    part_title: str
    source_file: str  # relative path
    start_line: int  # 1-based
    end_line: int  # 1-based inclusive
    insert_files: list[str]
    preview: str


_CHAPTER_RE = re.compile(r"^##\s+第(?P<num>[\d一二三四五六七八九十百零]+)章：(?P<title>.+?)\s*$")
_PART_RE = re.compile(r"^##\s+第(?P<num>[\d一二三四五六七八九十百零]+)部：(?P<title>.+?)\s*$")
_INSERT_RE = re.compile(r"^###\s+插页｜文件\s+(?P<file_id>.+?)\s*$")


def _cn_to_int(raw: str) -> int:
    """
    支持：数字、中文数字（到百位足够覆盖 1-99/1-65）。
    示例：一=1，十=10，十一=11，二十=20，三十一=31，六十五=65
    """
    raw = raw.strip()
    if raw.isdigit():
        return int(raw)

    digits = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
    units = {"十": 10, "百": 100}

    total = 0
    current = 0
    for ch in raw:
        if ch in digits:
            current = digits[ch]
            continue
        if ch in units:
            unit = units[ch]
            if current == 0:
                current = 1
            total += current * unit
            current = 0
            continue
        raise ValueError(f"Unsupported Chinese numeral: {raw}")

    return total + current


def _iter_story_files(story_dir: Path) -> list[Path]:
    files = sorted(story_dir.glob("*.md"), key=lambda p: int(p.stem) if p.stem.isdigit() else p.stem)
    return files


def _first_meaningful_preview(lines: list[str], start: int, end: int, limit: int = 140) -> str:
    """
    start/end: 1-based inclusive chapter boundaries
    """
    buf: list[str] = []
    for i in range(start, min(end, start + 60) + 1):
        s = lines[i - 1].strip()
        if not s:
            continue
        if s.startswith("#"):
            continue
        if s.startswith("```") or s.startswith(">"):
            continue
        buf.append(s)
        if len("".join(buf)) >= limit:
            break
    text = " ".join(buf).strip()
    if len(text) > limit:
        text = text[:limit].rstrip() + "…"
    return text


def build_index(repo_root: Path) -> list[ChapterIndexItem]:
    story_dir = repo_root / "story"
    if not story_dir.exists():
        raise FileNotFoundError(f"story dir not found: {story_dir}")

    items: list[ChapterIndexItem] = []

    current_part_number: int = 0
    current_part_title: str = ""

    for md in _iter_story_files(story_dir):
        rel = md.relative_to(repo_root).as_posix()
        raw = md.read_text(encoding="utf-8")
        lines = raw.splitlines()

        # 先扫描出本文件内所有“部/章”头的位置
        chapter_headers: list[tuple[int, int, str]] = []  # (line_no, chapter_no, title)
        part_headers: list[tuple[int, int, str]] = []  # (line_no, part_no, title)
        for idx, line in enumerate(lines, start=1):
            m_part = _PART_RE.match(line)
            if m_part:
                part_headers.append((idx, _cn_to_int(m_part.group("num")), m_part.group("title").strip()))
                continue
            m_ch = _CHAPTER_RE.match(line)
            if m_ch:
                chapter_headers.append((idx, _cn_to_int(m_ch.group("num")), m_ch.group("title").strip()))

        # 给每个 chapter 计算其所属 part：取“在该章之前最近出现的 part header”
        part_headers_sorted = sorted(part_headers, key=lambda x: x[0])

        def part_for_line(line_no: int) -> tuple[int, str]:
            nonlocal current_part_number, current_part_title
            candidates = [p for p in part_headers_sorted if p[0] <= line_no]
            if candidates:
                _, pn, pt = candidates[-1]
                return pn, pt
            # fallback：沿用上一个文件的 part
            return current_part_number, current_part_title

        for i, (line_no, ch_no, ch_title) in enumerate(chapter_headers):
            next_line = chapter_headers[i + 1][0] - 1 if i + 1 < len(chapter_headers) else len(lines)
            pn, pt = part_for_line(line_no)
            if pn:
                current_part_number, current_part_title = pn, pt

            insert_files: list[str] = []
            for ln in range(line_no, next_line + 1):
                ins = _INSERT_RE.match(lines[ln - 1])
                if ins:
                    insert_files.append(ins.group("file_id").strip())

            preview = _first_meaningful_preview(lines, line_no + 1, next_line)

            items.append(
                ChapterIndexItem(
                    number=ch_no,
                    title=ch_title,
                    part_number=pn,
                    part_title=pt,
                    source_file=rel,
                    start_line=line_no,
                    end_line=next_line,
                    insert_files=insert_files,
                    preview=preview,
                )
            )

    items.sort(key=lambda x: x.number)
    return items


def write_outputs(repo_root: Path, items: list[ChapterIndexItem]) -> None:
    out_dir = repo_root / "docs" / "alignment"
    out_dir.mkdir(parents=True, exist_ok=True)

    json_path = out_dir / "story_index.json"
    md_path = out_dir / "story_index.md"

    payload = {
        "title": "《备注/Footnote》小说章节索引",
        "chapter_count": len(items),
        "chapters": [asdict(x) for x in items],
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # Markdown 目录
    by_part: dict[int, list[ChapterIndexItem]] = {}
    for it in items:
        by_part.setdefault(it.part_number, []).append(it)

    lines: list[str] = []
    lines.append("# 《备注/Footnote》小说章节索引（自动生成）")
    lines.append("")
    lines.append(f"- 章节总数：**{len(items)}**")
    lines.append("- 来源：`story/1.md` ~ `story/5.md`")
    lines.append("")
    lines.append("## 分部目录")
    lines.append("")
    for pn in sorted(by_part.keys()):
        pt = by_part[pn][0].part_title if by_part[pn] else ""
        lines.append(f"- **第{pn}部：{pt}**（{len(by_part[pn])}章）")
    lines.append("")

    for pn in sorted(by_part.keys()):
        pt = by_part[pn][0].part_title if by_part[pn] else ""
        lines.append(f"## 第{pn}部：{pt}")
        lines.append("")
        for it in by_part[pn]:
            loc = f"{it.source_file}#L{it.start_line}-L{it.end_line}"
            ins = f"（插页 {len(it.insert_files)}）" if it.insert_files else ""
            lines.append(f"- **第{it.number}章：{it.title}** {ins} — `{loc}`")
            if it.preview:
                lines.append(f"  - 预览：{it.preview}")
        lines.append("")

    md_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    items = build_index(repo_root)
    write_outputs(repo_root, items)
    print(f"[OK] story index generated: {len(items)} chapters")


if __name__ == "__main__":
    main()


