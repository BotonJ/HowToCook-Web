#!/usr/bin/env python3
"""HowToCook 共享工具 — 路径解析、难度解析等公共函数"""

import os
import re
from pathlib import Path


def skill_dir() -> Path:
    return Path(__file__).parent


def skill_path(rel_path: str) -> Path:
    """将相对路径解析为绝对路径，含路径穿越防护。

    支持 Windows 盘符路径（C:/foo）和 WSL 路径（/mnt/c/foo）互转。
    解析后校验是否仍在 skill_dir 内，防止 ../../../etc/passwd 穿越。
    """
    rel_path = rel_path.replace("\\", "/")
    base = skill_dir().resolve()

    # WSL: /mnt/c/foo → C:/foo
    if os.environ.get("WSL_DISTRIB_NAME") and rel_path.startswith("/mnt/"):
        match = re.match(r"^/mnt/([a-z])/(.+)$", rel_path)
        if match:
            rel_path = f"{match.group(1).upper()}:/{match.group(2)}"

    # Windows: C:/foo → /mnt/c/foo (when on WSL)
    win_match = re.match(r"^([A-Za-z]):/(.+)$", rel_path)
    if win_match:
        rel_path = f"/mnt/{win_match.group(1).lower()}/{win_match.group(2)}"

    p = Path(rel_path)
    if p.is_absolute():
        resolved = p.resolve()
    else:
        resolved = (base / rel_path).resolve()

    # 路径穿越防护
    if not resolved.is_relative_to(base):
        raise ValueError(f"Path escapes base directory: {rel_path}")

    return resolved


def parse_difficulty(text: str) -> int:
    """从难度文本提取星级 (1-5)"""
    match = re.search(r"★+", text)
    if match:
        return len(match.group())
    return 3


def render_stars(difficulty: int) -> str:
    """Render difficulty as star rating string."""
    return '⭐' * difficulty + '☆' * (5 - difficulty)


def match_by_keywords(text: str, keyword_map: dict[str, list[str]], negatives: dict[str, list[str]] | None = None) -> str:
    """Match text against keyword map, return first matching category or empty string."""
    for cat, keywords in keyword_map.items():
        for kw in keywords:
            if kw in text:
                if negatives and cat in negatives:
                    if any(neg in text for neg in negatives[cat]):
                        continue
                return cat
    return ""
