# 2026-06-02 Pipeline Audit Fixes — website

**审计报告**：`docs/pipeline-audit-2026-06-02.md`
**修复范围**：P0-2, P1-1, P1-2, P1-5（面食之神数据链路 + description 清理）

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

---

## 提交记录

| commit | message |
|---|---|
| `b123fb5` | feat: add CN/EN logo v2 |
| `d5ee7c3` | fix: 面食之神数据链路修复 (P0-2/P1-1/P1-2/P1-5) |

## 待做

- P1-6: URL 编码 `%2F` 隐式依赖（需线上 curl 验证）
- P1-8: 面食之神风味画像缺失（需写补丁脚本）
- P2-6/7/8/10: validate-data 增强、imageMap miss 告警、search:index 拆分、language 字段
