#!/usr/bin/env python3
"""
将章节 raw 候选图 -> output 最终图，并更新 viewer/data.json（章节模式）。

约定目录：
- 候选图：comics/generated/chXX/raw/CHXX-PNN_1.webp ...
- 最终图：comics/output/chXX/page-NN.webp
- 输入：comics/scripts/chapters/chXX/chXX-prompts.json（用于页标题）

策略：
- 默认每页选第1张候选图（可人工改 selection.json 后再扩展）
"""

from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass(frozen=True)
class PageInfo:
    page_id: str  # "P01"
    title: str


def _load_pages_from_prompts_json(path: Path) -> List[PageInfo]:
    data = json.loads(path.read_text(encoding="utf-8"))
    pages: List[PageInfo] = []
    for p in data.get("pages", []):
        pid_full = str(p.get("id", "")).strip()  # "CH01-P01"
        title = str(p.get("title", "")).strip()
        if not pid_full.startswith("CH"):
            continue
        # 取 Pxx
        m = pid_full.split("-")[-1]
        if not m.startswith("P"):
            continue
        pages.append(PageInfo(page_id=m, title=title))
    return pages


def _list_candidates(raw_dir: Path, ch_upper: str, page_id: str) -> List[str]:
    # 生成相对路径，供 viewer 使用
    # 文件名：CH01-P01_1.webp ...
    prefix = f"{ch_upper}-{page_id}_"
    files = sorted([p for p in raw_dir.glob(f"{ch_upper}-{page_id}_*.webp")])
    return [str(Path("generated") / raw_dir.parent.name / raw_dir.name / f.name).replace("\\", "/") for f in files]


def _pick_best_index(candidates: List[str]) -> Optional[int]:
    if not candidates:
        return None
    return 0


def _ensure_viewer_data(viewer_data_path: Path) -> Dict:
    if viewer_data_path.exists():
        return json.loads(viewer_data_path.read_text(encoding="utf-8"))
    return {"title": "备注 / Footnote（重做版）", "description": "按章节逐级验收的漫画生产", "chapters": []}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--chapter", required=True, help="例如 ch01")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ch = args.chapter.lower()
    ch_upper = ch.upper()

    prompts_json = repo_root / "comics" / "scripts" / "chapters" / ch / f"{ch}-prompts.json"
    raw_dir = repo_root / "comics" / "generated" / ch / "raw"
    out_dir = repo_root / "comics" / "output" / ch
    viewer_data_path = repo_root / "comics" / "viewer" / "data.json"
    selection_path = repo_root / "comics" / "scripts" / "chapters" / ch / f"{ch}-selection.json"

    out_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)

    pages = _load_pages_from_prompts_json(prompts_json)
    if not pages:
        raise SystemExit(f"no pages found in {prompts_json}")

    viewer = _ensure_viewer_data(viewer_data_path)
    viewer.setdefault("chapters", [])

    # 找到/创建章节条目
    chapter_entry = None
    for c in viewer["chapters"]:
        if c.get("id") == ch:
            chapter_entry = c
            break
    if chapter_entry is None:
        chapter_entry = {"id": ch, "title": ch_upper, "status": "in_progress", "pages": []}
        viewer["chapters"].append(chapter_entry)

    # page entries
    chapter_pages: List[Dict] = []
    for p in pages:
        candidates = _list_candidates(raw_dir, ch_upper, p.page_id)
        selected = _pick_best_index(candidates)
        final = None

        if selected is not None:
            # copy best to output
            src_rel = Path(candidates[selected])
            src_abs = repo_root / "comics" / src_rel
            dst_abs = out_dir / f"page-{p.page_id[1:]}.webp"
            if src_abs.exists():
                shutil.copy2(src_abs, dst_abs)
                final = str(Path("output") / ch / dst_abs.name).replace("\\", "/")

        chapter_pages.append(
            {
                "id": p.page_id,
                "title": p.title,
                "final": final,
                "candidates": candidates,
                "selected": selected,
            }
        )

    chapter_entry["pages"] = chapter_pages
    # 完成判定：所有页都有 final
    chapter_entry["status"] = "completed" if all(p.get("final") for p in chapter_pages) else "in_progress"

    # 写入 selection.json（用于验收与后续人工改选）
    selection_payload: Dict = {
        "chapter": int(ch[2:]) if ch.startswith("ch") and ch[2:].isdigit() else ch,
        "title": str(ch_upper),
        "status": chapter_entry["status"],
        "pages": [
            {
                "id": p.get("id"),
                "title": p.get("title"),
                "selected": p.get("selected"),
                "final": p.get("final"),
                "candidates": p.get("candidates", []),
            }
            for p in chapter_pages
        ],
    }
    selection_path.write_text(json.dumps(selection_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    viewer_data_path.write_text(json.dumps(viewer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[OK] viewer updated: {viewer_data_path}")
    print(f"[OK] output updated: {out_dir}")
    print(f"[OK] selection updated: {selection_path}")


if __name__ == "__main__":
    main()


