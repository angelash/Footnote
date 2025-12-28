#!/usr/bin/env python3
"""
从 chXX-prompts-full.md 提取每页提示词 code block，输出 JSON 方便自动化。

约定：
- 页面标题行（两种都支持）：
  - ### CH01-P01 ...
  - ## P01 ...
- 提示词在紧随其后的第一个 ``` code block 中
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List


def extract(md: str) -> List[Dict[str, str]]:
    lines = md.splitlines()
    pages: List[Dict[str, str]] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # format A: "### CH07-P01 Title"
        m_full = re.match(r"^###\s+(CH\d{2}-P\d{2})\s+(.+)$", line)
        if m_full:
            page_id = m_full.group(1)
            title = m_full.group(2).strip()
        else:
            # format B: "## P01 Title" (chapter prefix inferred later)
            m_short = re.match(r"^##\s+(P\d{2})\s+(.+)$", line)
            if not m_short:
                i += 1
                continue

            page_id = m_short.group(1)  # temporary, will be prefixed in main()
            title = m_short.group(2).strip()

        # find first code fence (``` or ```lang)
        j = i + 1
        while j < len(lines) and not lines[j].lstrip().startswith("```"):
            j += 1
        if j >= len(lines):
            raise ValueError(f"missing code block for {page_id}")

        k = j + 1
        block: List[str] = []
        while k < len(lines) and lines[k].strip() != "```":
            block.append(lines[k])
            k += 1
        if k >= len(lines):
            raise ValueError(f"unclosed code block for {page_id}")

        prompt = "\n".join(block).strip() + "\n"
        pages.append({"id": page_id, "title": title, "prompt": prompt})
        i = k + 1

    return pages


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="chXX-prompts-full.md")
    parser.add_argument("--output", required=True, help="output json path")
    args = parser.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)

    # infer chapter prefix from filename: "ch07-prompts-full.md" -> "CH07"
    chapter_prefix = ""
    m_ch = re.search(r"(ch\d{2})", in_path.name, re.IGNORECASE)
    if m_ch:
        chapter_prefix = m_ch.group(1).upper()

    pages = extract(in_path.read_text(encoding="utf-8"))
    # normalize ids for short format ("P01" -> "CH07-P01")
    if chapter_prefix:
        for p in pages:
            pid = str(p.get("id", "")).strip()
            if re.fullmatch(r"P\d{2}", pid):
                p["id"] = f"{chapter_prefix}-{pid}"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"pages": pages}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] extracted: {len(pages)} pages -> {out_path}")


if __name__ == "__main__":
    main()


