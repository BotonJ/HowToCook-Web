#!/bin/bash
# Download remaining LFS images using curl

cd "$(dirname "$0")"
mkdir -p /tmp/lfs_downloads

TOTAL=0
DOWNLOADED=0
FAILED=0

# Find all LFS pointer files
for fpath in $(find public/images/dishes -name "*.jpeg" -size -200c); do
    TOTAL=$((TOTAL + 1))
    oid=$(grep -o 'oid sha256:[a-f0-9]\{64\}' "$fpath" | cut -d: -f2)
    size=$(grep -o 'size [0-9]*' "$fpath" | cut -d' ' -f2)

    if [ -z "$oid" ]; then
        echo "SKIP $fpath: no oid"
        FAILED=$((FAILED + 1))
        continue
    fi

    # Request download URL from GitHub LFS API
    response=$(curl -s -X POST "https://github.com/king-jingxiang/HowToCook.git/info/lfs/objects/batch" \
        -H "Content-Type: application/vnd.git-lfs+json" \
        -H "Accept: application/vnd.git-lfs+json" \
        -d "{\"operation\":\"download\",\"transfers\":[\"basic\"],\"objects\":[{\"oid\":\"$oid\",\"size\":${size:-0}}]}")

    # Extract download URL
    url=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    obj = data['objects'][0]
    if 'actions' in obj and 'download' in obj['actions']:
        print(obj['actions']['download']['href'])
    elif 'error' in obj:
        print('ERROR:' + obj['error'].get('message', 'unknown'), file=sys.stderr)
except Exception as e:
    print('PARSE_ERROR:' + str(e), file=sys.stderr)
" 2>&1)

    if [[ "$url" == ERROR:* ]] || [[ "$url" == PARSE_ERROR:* ]]; then
        echo "SKIP $(basename "$fpath"): $url"
        FAILED=$((FAILED + 1))
        continue
    fi

    if [ -z "$url" ]; then
        echo "SKIP $(basename "$fpath"): no URL"
        FAILED=$((FAILED + 1))
        continue
    fi

    # Download the image
    if curl -s -o "$fpath" "$url" && [ $(wc -c < "$fpath") -gt 200 ]; then
        DOWNLOADED=$((DOWNLOADED + 1))
        echo "OK $(basename "$fpath") ($(du -h "$fpath" | cut -f1))"
    else
        FAILED=$((FAILED + 1))
        echo "FAIL $(basename "$fpath")"
    fi

    # Rate limit: pause every 20 downloads
    if [ $((DOWNLOADED % 20)) -eq 0 ] && [ $DOWNLOADED -gt 0 ]; then
        echo "--- Pausing to avoid rate limit ---"
        sleep 2
    fi
done

echo ""
echo "Done! Total: $TOTAL, Downloaded: $DOWNLOADED, Failed: $FAILED"
