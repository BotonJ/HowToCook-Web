#!/usr/bin/env python3
"""
One-off migration: align 483 recipe flavor profiles to 8d/0-1 baseline.

Reads:  public/data/epicure/flavor-profiles.json (6d, 0-10, 'fatty' key)
Writes: public/data/flavor/recipe-flavor-profiles.json (8d, 0-1, 'fat' key)

Transforms per entry:
  - Rename 'fatty' -> 'fat'
  - All values /10 (0-10 -> 0-1)
  - Add 'salty: 0' and 'aromatic: 0' (missing in original data)
"""

import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "public" / "data" / "epicure" / "flavor-profiles.json"
DST = ROOT / "public" / "data" / "flavor" / "recipe-flavor-profiles.json"

OLD_DIMS = ["sweet", "sour", "bitter", "umami", "spicy", "fatty"]
NEW_DIMS = ["sweet", "sour", "bitter", "umami", "spicy", "fat", "salty", "aromatic"]


def migrate():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    result = {}

    for recipe_id, values in data.items():
        new_entry = {}
        for dim in NEW_DIMS:
            if dim == "salty" or dim == "aromatic":
                new_entry[dim] = 0.0
            elif dim == "fat":
                new_entry[dim] = round(values.get("fatty", 0) / 10, 4)
            else:
                new_entry[dim] = round(values.get(dim, 0) / 10, 4)
        result[recipe_id] = new_entry

    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Migrated {len(result)} recipes: {SRC} -> {DST}")

    # Sanity check
    sample = result.get("howtocook/茶叶蛋")
    if sample:
        print(f"Sample 'howtocook/茶叶蛋': {sample}")
        assert set(sample.keys()) == set(NEW_DIMS), "Dimension mismatch!"
        assert all(0 <= v <= 1 for v in sample.values()), "Value out of [0,1] range!"


if __name__ == "__main__":
    migrate()
