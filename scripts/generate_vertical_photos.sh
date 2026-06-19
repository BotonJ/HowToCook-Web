#!/bin/bash
# 批量生成竖版纯食物照片（以图生图）
# 用法: ./generate_vertical_photos.sh [单张菜名]

set -e

WEBSITE_DIR="/Users/dor/Projects/HowToCook_Plan/website"
SRC_IMG_DIR="$WEBSITE_DIR/public/images/dishes/suibianzuo"
OUTPUT_DIR="$WEBSITE_DIR/public/images/dishes/suibianzuo-vertical"

# 修复 DNS 问题
AGNES_IP="104.18.19.62"
AGNES_HOST="apihub.agnes-ai.com"
AGNES_URL="https://$AGNES_HOST/v1/images/generations"

mkdir -p "$OUTPUT_DIR"

if [ -z "$AGNES_API_KEY" ]; then
  echo "❌ AGNES_API_KEY 未设置"
  exit 1
fi

generate_vertical_photo() {
  local recipe_name="$1"
  local img_path="$SRC_IMG_DIR/$recipe_name.jpg"

  if [ ! -f "$img_path" ]; then
    echo "❌ 图片不存在: $img_path"
    return 1
  fi

  # 构建提示词：基于菜名生成竖版食物照片
  local prompt="Professional food photography of $recipe_name, vertical portrait orientation 9:16 ratio. Centered composition, appetizing presentation on elegant plate, natural soft lighting, shallow depth of field, clean minimalist background. High-end restaurant style, magazine quality food photography. The dish should be the main focus, beautifully plated and garnished."

  # 调用 Agnes API
  local response=$(curl -s --resolve "$AGNES_HOST:443:$AGNES_IP" \
    "$AGNES_URL" \
    -H "Authorization: Bearer $AGNES_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"agnes-image-2.1-flash\",
      \"prompt\": $(echo "$prompt" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"),
      \"size\": \"768x1344\"
    }")

  # 提取 URL 并下载
  local img_url=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin)['data'][0]['url'])" 2>/dev/null)

  if [ -n "$img_url" ]; then
    local output_file="$OUTPUT_DIR/${recipe_name}.png"
    curl -sL "$img_url" -o "$output_file"
    echo "✅ $recipe_name → $output_file"
    return 0
  else
    echo "❌ $recipe_name: 生成失败"
    echo "   Response: $response"
    return 1
  fi
}

# 主流程
if [ -n "$1" ]; then
  # 单张模式
  generate_vertical_photo "$1"
else
  # 批量模式（先测试前 5 张）
  echo "🚀 开始生成竖版食物照片（测试前 5 张）..."
  echo "   输入: $SRC_IMG_DIR"
  echo "   输出: $OUTPUT_DIR"
  echo ""

  success=0
  failed=0
  count=0

  for img in "$SRC_IMG_DIR"/*.jpg; do
    if [ $count -ge 5 ]; then
      break
    fi

    recipe_name=$(basename "$img" .jpg)
    if generate_vertical_photo "$recipe_name"; then
      ((success++))
    else
      ((failed++))
    fi

    ((count++))
    # 避免 API 限流
    sleep 1
  done

  echo ""
  echo "📊 测试完成: $success 成功, $failed 失败"
  echo "   图片保存在: $OUTPUT_DIR"
fi
