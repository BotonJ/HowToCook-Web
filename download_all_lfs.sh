#!/bin/bash
# Download all remaining LFS images

cd "$(dirname "$0")"

TOTAL=$(find public/images/dishes -name "*.jpeg" -size -200c | wc -l | tr -d ' ')
echo "Found $TOTAL LFS pointer files to download"

count=0
failed=0

for fpath in $(find public/images/dishes -name "*.jpeg" -size -200c); do
    oid=$(grep -o 'oid sha256:[a-f0-9]\{64\}' "$fpath" | cut -d: -f2)
    size=$(grep -o 'size [0-9]*' "$fpath" | cut -d' ' -f2)

    # Get download URL
    response=$(curl -s -X POST "https://github.com/king-jingxiang/HowToCook.git/info/lfs/objects/batch" \
        -H "Content-Type: application/vnd.git-lfs+json" \
        -H "Accept: application/vnd.git-lfs+json" \
        -d "{\"operation\":\"download\",\"transfers\":[\"basic\"],\"objects\":[{\"oid\":\"$oid\",\"size\":${size:-0}}]}")

    url=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['objects'][0]['actions']['download']['href'])" 2>/dev/null)

    if [ -z "$url" ]; then
        echo "SKIP $(basename "$fpath"): no URL"
        failed=$((failed + 1))
        continue
    fi

    # Download with timeout
    curl -s --connect-timeout 10 --max-time 60 -o "$fpath" "$url"

    if [ -f "$fpath" ] && [ $(wc -c < "$fpath") -gt 200 ]; then
        count=$((count + 1))
        echo "OK $(basename "$fpath") ($(du -h "$fpath" | cut -f1))"
    else
        failed=$((failed + 1))
        echo "FAIL $(basename "$fpath")"
    fi

    # Rate limit: pause every 10 downloads
    if [ $((count % 10)) -eq 0 ] && [ $count -gt 0 ]; then
        sleep 1
    fi
done

echo ""
echo "Done! Downloaded: $count, Failed: $failed, Total: $TOTAL"
echo "Remaining pointers: $(find public/images/dishes -name "*.jpeg" -size -200c | wc -l | tr -d ' ')"
