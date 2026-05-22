#!/usr/bin/env python3
"""Download remaining LFS images from GitHub API."""

import os
import re
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

IMAGES_DIR = Path("public/images/dishes")
LFS_BATCH_URL = "https://github.com/king-jingxiang/HowToCook.git/info/lfs/objects/batch"
CHUNK_SIZE = 50  # batch size per request
DELAY_BETWEEN_BATCHES = 3  # seconds
MAX_RETRIES = 3

def find_lfs_pointers():
    """Find all files that are still LFS pointers (< 200 bytes)."""
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

def download_batch(pointers_batch):
    """Download a batch of LFS objects."""
    objects = [{"oid": sha, "size": size} for _, sha, size in pointers_batch]
    payload = json.dumps({
        "operation": "download",
        "transfers": ["basic"],
        "objects": objects
    }).encode()

    req = urllib.request.Request(
        LFS_BATCH_URL,
        data=payload,
        headers={
            "Content-Type": "application/vnd.git-lfs+json",
            "Accept": "application/vnd.git-lfs+json",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  Batch request failed: {e.code} {e.reason}")
        return []
    except Exception as e:
        print(f"  Batch request error: {e}")
        return []

    results = []
    for i, obj in enumerate(data.get("objects", [])):
        if "error" in obj:
            results.append((pointers_batch[i][0], None, obj["error"].get("message", "unknown")))
            continue
        actions = obj.get("actions", {})
        download = actions.get("download", {})
        url = download.get("href")
        if url:
            results.append((pointers_batch[i][0], url, None))
        else:
            results.append((pointers_batch[i][0], None, "no download URL"))
    return results

def download_image(fpath, url, retries=MAX_RETRIES):
    """Download a single image from URL."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            if len(data) > 200:  # sanity check
                fpath.write_bytes(data)
                return True
            else:
                print(f"    Too small ({len(data)} bytes), retrying...")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
            else:
                print(f"    Failed after {retries} attempts: {e}")
    return False

def main():
    os.chdir(Path(__file__).parent)

    pointers = find_lfs_pointers()
    print(f"Found {len(pointers)} LFS pointer files to download")

    if not pointers:
        print("All images are already downloaded!")
        return

    downloaded = 0
    failed = 0

    for i in range(0, len(pointers), CHUNK_SIZE):
        batch = pointers[i:i+CHUNK_SIZE]
        print(f"\nBatch {i//CHUNK_SIZE + 1}: processing {len(batch)} files...")

        results = download_batch(batch)
        if not results:
            print("  Batch failed, skipping")
            failed += len(batch)
            continue

        for fpath, url, error in results:
            if error:
                print(f"  SKIP {fpath.name}: {error}")
                failed += 1
                continue

            if download_image(fpath, url):
                downloaded += 1
                print(f"  OK {fpath.name} ({fpath.stat().st_size // 1024}KB)")
            else:
                failed += 1
                print(f"  FAIL {fpath.name}")

        if i + CHUNK_SIZE < len(pointers):
            time.sleep(DELAY_BETWEEN_BATCHES)

    print(f"\nDone! Downloaded: {downloaded}, Failed: {failed}")

if __name__ == "__main__":
    main()
