# 2026-06-02 Pipeline Audit Fixes — website

**审计报告**：`docs/pipeline-audit-2026-06-02.md`
**修复范围**：P0-2, P1-1, P1-2, P1-5, P1-8, P2-6, P2-7, P2-10

---

## 已修复

### P0-2. `generate-recipes.ts` 无 source 过滤
- **文件**：`scripts/generate-recipes.ts:208`
- **改动**：`buildIndexMap` 跳过 `source === '面食之神'` 的条目，防止重跑 `npm run generate-recipes` 时面食之神混入 `recipes.json`
- **提交**：`d5ee7c3`

### P1-1. `useRecipes.ts` 面食之神全塞 staple 分类
- **文件**：`src/hooks/useRecipes.ts:248-260`
- **改动**：noodle 合并逻辑从 `c.id === 'staple'` 改为 `c.id === noodleCat.id.replace('noodle-', '')`，按真实 category（staple/meat_dish/soup/vegetable_dish）分别合并
- **提交**：`d5ee7c3`

### P1-2. `generate-recipes.ts` indexMap 用 name 做 key 导致同名丢失
- **文件**：`scripts/generate-recipes.ts:208-209`
- **改动**：
  - indexMap key 从 `dish.name` 改为 `${dish.source}/${dish.name}`
  - recipe id 优先使用 `dish.id`（index.json 已有），回退为 `${dish.source}/${dish.name}`
  - 同名不同 source 的菜谱不再互相覆盖（536 → 536，0 丢失）
- **提交**：`d5ee7c3`

### P1-5. description 未清理 HTML 注释/视频 embed
- **文件**：`scripts/generate-recipes.ts:168`
- **改动**：description 收集时过滤 `<!-- -->`、`[!video](...)`、`> 引用块` 三种非内容行
- **提交**：`d5ee7c3`

### P1-8. 面食之神风味画像缺失
- **文件**：`public/data/epicure/flavor-profiles.json` + `scripts/append-noodle-flavor-profiles.py`（新增）
- **改动**：
  - 补丁脚本读取 noodle-recipes.json 的 ingredients，通过 zh_to_epicure.json + ingredient-flavor-profiles.json 计算 6 维风味向量
  - 32/33 道生成成功（擀饺子皮为纯技法教程，无食材映射）
  - key 格式 `noodle/xxx` 与前端 recipe.id 对齐
  - flavor-profiles.json: 481 → 513 条
- **提交**：`a501bda`

### P2-6. `validate-data.ts` 检查项远少于生成脚本
- **文件**：`scripts/validate-data.ts:72-77`
- **改动**：增加 `difficulty`、`cuisine`、`cooking_method`、`cook_time`、`ingredients` 五项必填校验，与 generate-recipes.ts 对齐
- **提交**：`a788182`

### P2-7. `buildImageMap` 静默 miss
- **文件**：`scripts/generate-recipes.ts:307`
- **改动**：图片名不匹配时输出 `⚠ 无图片: {name} ({source})` warning
- **提交**：`a788182`

### P2-10. 中文菜谱缺 `language` 字段
- **文件**：`scripts/generate-recipes.ts`
- **改动**：Recipe 接口新增 `language?: string`；中文菜谱构建时显式设 `language: 'zh'`
- **提交**：`a788182`

---

## 提交记录

| commit | message |
|---|---|
| `b123fb5` | feat: add CN/EN logo v2 |
| `d5ee7c3` | fix: 面食之神数据链路修复 (P0-2/P1-1/P1-2/P1-5) |
| `c67167d` | docs: pipeline audit 修复 worklog |
| `a788182` | fix: validate-data 增强 (P2-6) + 图片缺失告警 (P2-7) + language 字段 (P2-10) |
| `a501bda` | feat: 面食之神 32 道风味画像补丁 (P1-8) |

## 已知风险（不修复）

### P1-6. URL 编码 `%2F` 隐式依赖 Hono 解码行为
- **现状**：前端 `encodeURIComponent(id)` 将 `/` 编码为 `%2F`；后端 `safeDecode` 兜底已覆盖两种情况
- **风险**：Hono 未来版本改变解码行为时可能崩，但 `safeDecode` 兜底使当前不会出 bug
- **建议**：升级 Hono 时手动验证 `/recipe/howtocook%2F茶叶蛋` 能否正常返回

## 暂不处理

- P2-8: search:index 拆分（当前 25MiB 上限远够，暂不处理）
