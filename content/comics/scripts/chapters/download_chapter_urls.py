#!/usr/bin/env python3
"""
按章节 urls.txt 批量下载候选图。

输入格式：comics/scripts/chapters/chXX/chXX-urls.txt

示例：
## P01
https://...
https://...
## P02
https://...

规则：
- 允许每页 1-4 张（部分成功也先下载）
- 输出到 comics/generated/chXX/raw/
  - CHXX-P01_1.webp ...
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Dict, List

import requests


def parse_urls_file(path: Path) -> Dict[str, List[str]]:
    pages: Dict[str, List[str]] = {}
    current_page = ""

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("# "):
            continue

        m = re.match(r"^##\s*(P\d{2})\s*$", line)
        if m:
            current_page = m.group(1)
            pages.setdefault(current_page, [])
            continue

        if line.startswith("http"):
            if not current_page:
                raise ValueError(f"url appears before any page header: {line}")
            pages[current_page].append(line)

    return pages


def download_images(urls: List[str], output_dir: Path, prefix: str) -> List[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)

    downloaded: List[Path] = []
    for i, url in enumerate(urls):
        try:
            r = requests.get(url, timeout=60)
            if r.status_code == 200:
                filepath = output_dir / f"{prefix}_{i+1}.webp"
                filepath.write_bytes(r.content)
                print(f"[OK] {i+1}/{len(urls)} {filepath} ({len(r.content)} bytes)")
                downloaded.append(filepath)
            else:
                print(f"[FAIL] {i+1}/{len(urls)} HTTP {r.status_code} url={url}")
        except Exception as e:
            print(f"[ERR] {i+1}/{len(urls)} {e} url={url}")

    return downloaded


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", required=True, help="例如 ch01")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    chapter = args.chapter.lower()
    urls_path = repo_root / "comics" / "scripts" / "chapters" / chapter / f"{chapter}-urls.txt"
    out_dir = repo_root / "comics" / "generated" / chapter / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)

    pages = parse_urls_file(urls_path)
    if not pages:
        raise SystemExit(f"no pages in {urls_path}")

    for page_id in sorted(pages.keys()):
        urls = pages[page_id]
        if not urls:
            print(f"[SKIP] {page_id}: no urls")
            continue
        prefix = f"{chapter.upper()}-{page_id}"
        download_images(urls, out_dir, prefix)

    print(f"[OK] downloaded to {out_dir}")


if __name__ == "__main__":
    main()


