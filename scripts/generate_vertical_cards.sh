#!/bin/bash
# 批量生成随便做竖版菜谱卡片
# 用法: ./generate_vertical_cards.sh [单张菜名]

set -e

WEBSITE_DIR="/Users/dor/Projects/HowToCook_Plan/website"
SRC_IMG_DIR="$WEBSITE_DIR/public/images/dishes/suibianzuo"
OUTPUT_DIR="$WEBSITE_DIR/public/images/dishes/suibianzuo-vertical"
DETAIL_FILE="$WEBSITE_DIR/public/data/recipes-detail.json"
PROMPT_TEMPLATE="/Users/dor/Projects/HowToCook_Plan/菜谱生图提示词.txt"

# 修复 DNS 问题：直接用真实 IP
AGNES_IP="104.18.19.62"
AGNES_HOST="apihub.agnes-ai.com"
AGNES_URL="https://$AGNES_HOST/v1/images/generations"

mkdir -p "$OUTPUT_DIR"

if [ -z "$AGNES_API_KEY" ]; then
  echo "❌ AGNES_API_KEY 未设置"
  exit 1
fi

# 获取菜谱详情的 Python 辅助函数
get_recipe_detail() {
  local recipe_id="$1"
  python3 -c "
import json, sys
with open('$DETAIL_FILE') as f:
    data = json.load(f)
for cat in data:
    for r in cat.get('recipes', []):
        if r.get('id') == '$recipe_id':
            print(json.dumps({
                'name': r.get('name', ''),
                'ingredients': r.get('ingredients', []),
                'ingredients_text': r.get('ingredients_text', ''),
                'steps_text': r.get('steps_text', ''),
                'extra_text': r.get('extra_text', ''),
                'description': r.get('description', '')
            }, ensure_ascii=False))
            sys.exit(0)
print('{}')
"
}

# 用 MiniMax 分析图片生成英文描述
analyze_image() {
  local img_path="$1"
  local prompt="Describe this food photo in English for image generation. Focus on: dish appearance, colors, ingredients visible, plating style, lighting, background. Keep it concise (50 words max)."

  # 调用 MiniMax MCP（这里用占位，实际需要通过 MCP 调用）
  echo "Food photography, professional lighting, white plate, appetizing presentation"
}

# 生成菜谱卡片
generate_card() {
  local recipe_id="$1"
  local recipe_name="$2"
  local img_path="$3"

  # 获取菜谱详情
  local detail=$(get_recipe_detail "$recipe_id")
  local ingredients=$(echo "$detail" | python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(f'- {i}' for i in d.get('ingredients', [])))" 2>/dev/null || echo "")
  local steps=$(echo "$detail" | python3 -c "
import json,sys
d=json.load(sys.stdin)
steps_text = d.get('steps_text', '')
# 简化步骤文本
lines = steps_text.split('\n')
clean_steps = []
for line in lines:
    line = line.strip()
    if line and not line.startswith('#') and not line.startswith('-'):
        clean_steps.append(line)
print('\n'.join(clean_steps[:6]))
" 2>/dev/null || echo "")

  # 构建提示词
  local prompt="Generate a 9:16 vertical recipe infographic card.

**Layout:**
- Top 40%: Professional food photography of $recipe_name
- Bottom 60%: Structured recipe information on off-white paper texture background

**Food Photo (Top):**
Professional food photography, natural lighting, appetizing presentation, clean background.

**Recipe Info (Bottom):**
Title: $recipe_name (centered, elegant Chinese font)

Ingredients:
$ingredients

Steps:
$steps

**Style:** Flat vector icons, simple line art illustrations, clean minimalist design, warm colors.

**IMPORTANT:** Generate the actual image, not just a description."

  # 调用 Agnes API（使用 --resolve 绕过 DNS）
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
  recipe_id="随便做/$1"
  img_path="$SRC_IMG_DIR/$1.jpg"
  if [ -f "$img_path" ]; then
    generate_card "$recipe_id" "$1" "$img_path"
  else
    echo "❌ 图片不存在: $img_path"
  fi
else
  # 批量模式
  echo "🚀 开始批量生成竖版菜谱卡片..."
  echo "   输入: $SRC_IMG_DIR"
  echo "   输出: $OUTPUT_DIR"
  echo ""

  success=0
  failed=0

  for img in "$SRC_IMG_DIR"/*.jpg; do
    recipe_name=$(basename "$img" .jpg)
    recipe_id="随便做/$recipe_name"

    if generate_card "$recipe_id" "$recipe_name" "$img"; then
      ((success++))
    else
      ((failed++))
    fi

    # 避免 API 限流
    sleep 1
  done

  echo ""
  echo "📊 完成: $success 成功, $failed 失败"
fi
