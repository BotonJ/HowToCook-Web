#!/usr/bin/env python3
"""Download remaining LFS images using subprocess curl."""

import os
import re
import json
import subprocess
import time
from pathlib import Path

IMAGES_DIR = Path("public/images/dishes")
LFS_BATCH_URL = "https://github.com/king-jingxiang/HowToCook.git/info/lfs/objects/batch"
CHUNK_SIZE = 10
DELAY = 1

def find_lfs_pointers():
    pointers = []
    for fpath in IMAGES_DIR.rglob("*.jpeg"):
        if fpath.stat().st_size < 200:
            content = fpath.read_text()
            oid_match = re.search(r'oid sha256:([a-f0-9]{64})', content)
            size_match = re.search(r'size (\d+)', content)
            if oid_match:
                size = int(size_match.group(1)) if size_match else 0
                pointers.append((fpath, oid_match.group(1), size))
    return pointers

def get_download_urls(batch):
    """Get download URLs from GitHub LFS API."""
    objects = [{"oid": sha, "size": size} for _, sha, size in batch]
    payload = json.dumps({
        "operation": "download",
        "transfers": ["basic"],
        "objects": objects
    })

    result = subprocess.run(
        ["curl", "-s", "-X", "POST", LFS_BATCH_URL,
         "-H", "Content-Type: application/vnd.git-lfs+json",
         "-H", "Accept: application/vnd.git-lfs+json",
         "-d", payload],
        capture_output=True, text=True, timeout=30
    )

    if result.returncode != 0:
        return [(fpath, None, "curl failed") for fpath, _, _ in batch]

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return [(fpath, None, "invalid JSON") for fpath, _, _ in batch]

    results = []
    for i, obj in enumerate(data.get("objects", [])):
        fpath = batch[i][0]
        if "error" in obj:
            results.append((fpath, None, obj["error"].get("message", "unknown")))
        elif "actions" in obj and "download" in obj["actions"]:
            results.append((fpath, obj["actions"]["download"]["href"], None))
        else:
            results.append((fpath, None, "no download URL"))
    return results

def download_image(fpath, url, retries=3):
    """Download image using curl with retries."""
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["curl", "-s", "--connect-timeout", "10", "--max-time", "60",
                 "-o", str(fpath), url],
                capture_output=True, timeout=90
            )
            if result.returncode == 0 and fpath.exists() and fpath.stat().st_size > 200:
                return True
        except subprocess.TimeoutExpired:
            pass
        if attempt < retries - 1:
            time.sleep(2)
    return False

def main():
    os.chdir(Path(__file__).parent)

    pointers = find_lfs_pointers()
    print(f"Found {len(pointers)} LFS pointer files to download")

    if not pointers:
        print("All images already downloaded!")
        return

    downloaded = 0
    failed = 0

    for i in range(0, len(pointers), CHUNK_SIZE):
        batch = pointers[i:i+CHUNK_SIZE]
        print(f"\nBatch {i//CHUNK_SIZE + 1}/{(len(pointers) + CHUNK_SIZE - 1)//CHUNK_SIZE}:")

        results = get_download_urls(batch)

        for fpath, url, error in results:
            if error:
                print(f"  SKIP {fpath.name}: {error}")
                failed += 1
                continue

            if download_image(fpath, url):
                downloaded += 1
                size_kb = fpath.stat().st_size // 1024
                print(f"  OK {fpath.name} ({size_kb}KB)")
            else:
                failed += 1
                print(f"  FAIL {fpath.name}")

        if i + CHUNK_SIZE < len(pointers):
            time.sleep(DELAY)

    print(f"\nDone! Downloaded: {downloaded}, Failed: {failed}")
    remaining = len(find_lfs_pointers())
    print(f"Remaining pointers: {remaining}")

if __name__ == "__main__":
    main()
