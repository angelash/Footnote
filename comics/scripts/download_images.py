#!/usr/bin/env python3
"""
批量下载智绘平台生成的图片（通用脚本）

用法：
1) 下载单组URL（同一页的4张候选图）
   python comics/scripts/download_images.py --urls-file <txt> --output-dir <dir> --prefix <name>

2) 直接命令行传URL（少量）
   python comics/scripts/download_images.py --output-dir <dir> --prefix <name> <url1> <url2> ...

说明：
- 以截图确认生成完成（进度条不可靠）
- URL 中 *_small.webp 也视为可直接下载的完整图
"""

from __future__ import annotations

import argparse
import os
from typing import List

import requests


def _read_urls_file(path: str) -> List[str]:
    urls: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s:
                continue
            if s.startswith("#"):
                continue
            urls.append(s)
    return urls


def download_images(urls: List[str], output_dir: str, prefix: str) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)

    downloaded: List[str] = []
    for i, url in enumerate(urls):
        try:
            r = requests.get(url, timeout=60)
            if r.status_code == 200:
                filepath = f"{output_dir}/{prefix}_{i+1}.webp"
                with open(filepath, "wb") as f:
                    f.write(r.content)
                print(f"[OK] {i+1}/{len(urls)} {filepath} ({len(r.content)} bytes)")
                downloaded.append(filepath)
            else:
                print(f"[FAIL] {i+1}/{len(urls)} HTTP {r.status_code} url={url}")
        except Exception as e:
            print(f"[ERR] {i+1}/{len(urls)} {e} url={url}")

    return downloaded


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--urls-file", default="", help="包含URL的txt文件（每行一个URL，可含#注释）")
    parser.add_argument("--output-dir", required=True, help="输出目录")
    parser.add_argument("--prefix", required=True, help="文件名前缀（将输出 prefix_1.webp ...）")
    parser.add_argument("urls", nargs="*", help="直接传入的URL列表（可选）")
    args = parser.parse_args()

    urls: List[str] = []
    if args.urls_file:
        urls.extend(_read_urls_file(args.urls_file))
    urls.extend(args.urls)

    if not urls:
        raise SystemExit("no urls provided")

    download_images(urls, args.output_dir, args.prefix)


if __name__ == "__main__":
    main()

