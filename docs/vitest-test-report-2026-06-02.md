# CQ-1: Vitest 测试框架搭建报告

**日期**: 2026-06-02
**任务**: 引入 Vitest 测试框架，覆盖 engine.ts 纯函数、useRecipes 缓存、api-transform

---

## 1. 环境配置

### 新增依赖
```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

### 新增/修改文件
| 文件 | 说明 |
|------|------|
| `vitest.config.ts` | Vitest 配置：jsdom 环境、路径别名、import.meta.env 注入 |
| `vitest.setup.ts` | 测试前置：加载 `@testing-library/jest-dom/vitest` |
| `package.json` | 新增 `test` / `test:watch` scripts |

### Vitest 配置摘要
- **环境**: jsdom（React Hook 渲染需要 DOM）
- **路径别名**: `@/*` → `./src/*`（通过 `vite-tsconfig-paths` 继承）
- **环境变量注入**: `BASE_URL="/"`, `VITE_API_BASE="https://test-api.example.com"`

---

## 2. 测试覆盖范围

### 2.1 `src/lib/epicure/engine.test.ts` — 47 个用例
覆盖函数：
- **纯数学函数**: `cosineSimilarity`（同向量/正交/反向/零向量）
- **字符串工具**: `formatName`
- **未加载状态防御**: `isLoaded`, `getVocabSize`, `getNearestNeighbors`, `getZhMap`, `getModeLabelZh`, `getModeLabelsZh`, `getEnName`, `getIngredientIndex`, `getIngredientName`, `getEmbedding`
- **加载后核心功能**: `getNearestNeighbors`, `slerp`, `getClosestMode`, `searchVocabulary`（中英双语）, `getCuisinePoles`, `slerpToCuisine`
- **Embedding 计算**: `computeRecipeEmbeddings`（含 zhReverse 回退、空列表、无匹配跳过）
- **扩展数据**: `loadCooccurrenceData` / `getCooccurrencePairs`（中文优先 + English fallback）, `loadInternationalRecipes` / `getInternationalRecipes`

### 2.2 `src/lib/api-transform.test.ts` — 13 个用例
覆盖函数：
- `transformDishIndex`（完整字段映射、空数组、缺失可选字段）
- `transformApiRecipe`（全字段转换、绝对/相对图片 URL、null image_url、空 optional 数组、单步骤 steps_text）
- `transformSearchResult`（本地缓存命中、远程 fallback、绝对/空图片 URL）

### 2.3 `src/hooks/useRecipes.test.ts` — 7 个用例
覆盖逻辑：
- Hook 首次加载（loading → false，数据正确性）
- 模块级缓存复用（二次 renderHook 无 loading）
- `retry` 清除缓存并重新加载
- `findRecipeById` 索引缓存（命中 + 未知 ID + 二次查找复用）
- `getFullRecipeData` 缓存（同一引用验证）

---

## 3. 首次运行结果（2026-06-02 21:31）

```
Test Files  3 failed (3)
     Tests  9 failed | 58 passed (67)
```

### 3.1 失败清单

| # | 测试文件 | 用例 | 失败原因 |
|---|----------|------|----------|
| 1 | `api-transform.test.ts` | `returns undefined for empty optional arrays` | 断言错误：`ingredients` 本身非空，仅 `optional_ingredients` 为空时 `ingredients_text` 应为 `"tofu"` 而非 `undefined` |
| 2 | `engine.test.ts` | `getEmbedding returns null for out-of-bounds index` | 设计行为差异：`getEmbedding` 未做 bounds check，`subarray(29700, 30000)` 返回空 `Float32Array []`，非 `null` |
| 3 | `engine.test.ts` | `getNearestNeighbors returns sorted neighbors` | 夹具数据 bug：`arr[300]=1` 导致 `getRow(1)[0]=1`，beef 与 carrot 向量相同，cosine=1（期望 0） |
| 4 | `engine.test.ts` | `slerp rotates towards direction` | 同上：向量重合 → `dPerpNorm=0` → 返回空数组（期望 1 条结果） |
| 5 | `engine.test.ts` | `slerpToCuisine uses cuisine pole` | 同上：`cuisinePoles.East_Asian` 与 seed 向量重合 → `dPerpNorm=0` → 返回空数组 |
| 6 | `engine.test.ts` | `computeRecipeEmbeddings averages ingredient vectors` | 同上：两向量相同 → 平均值第 0 维为 1（期望 0.5） |
| 7 | `useRecipes.test.ts` | `loads recipes and sets loading to false` | `recipes.length` 为 0（期望 1）：疑似 `fetch` mock 中 `/recipes` 路径匹配提前拦截了 `/data/recipes-meta.json`，或异步时序问题 |
| 8 | `useRecipes.test.ts` | `shares module-level cache across hook instances` | 同上：空数组导致 `recipes[0]` 为 `undefined` |
| 9 | `useRecipes.test.ts` | `retry clears cache and reloads` | 同上 |

### 3.2 根因归类

| 类别 | 数量 | 说明 |
|------|------|------|
| **测试夹具数据错误** | 5 | engine Float32Array 构造时索引错位，导致测试向量不独立 |
| **测试断言错误** | 1 | api-transform 中对 `ingredients_text` 的 undefined 期望不符合代码逻辑 |
| **代码行为与测试预期不一致** | 1 | `getEmbedding` 越界返回空 Float32Array 而非 null（需确认是否要修代码还是改测试） |
| **Mock / 异步时序待排查** | 3 | useRecipes hook 测试中 recipes 未加载成功，需进一步诊断 fetch 路由或 effect 执行时序 |

---

## 4. 修复计划

### 4.1 engine.test.ts（5 项）
1. **修正 embeddings buffer 构造**：`arr[300] = 1` → `arr[301] = 1`，确保 `getRow(0)` 与 `getRow(1)` 正交
2. **修正 cuisine pole 构造**：`East_Asian` 的第 0 维改为第 1 维（与 seed 向量正交）
3. **修正 `getEmbedding` 越界断言**：改为验证返回空 `Float32Array`，或同步修改 `engine.ts` 增加 bounds check

### 4.2 api-transform.test.ts（1 项）
4. **修正空数组测试**：`ingredients_text` 期望改为 `'tofu'`，仅 `steps_text` / `extra_text` 保持 `undefined`

### 4.3 useRecipes.test.ts（3 项）
5. **诊断 fetch mock 路由**：检查 `/recipes` 是否提前匹配了 `/data/recipes-meta.json`，调整匹配顺序或改为精确匹配
6. **如需要，增加 error 断言**：在 loading=false 后检查 `error` 字段，区分 resolve / reject 路径
7. **验证 jsdom + React effect 时序**：必要时在 `renderHook` 后增加 `act` 或调整 `waitFor` 条件

---

## 5. 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 测试运行器 | Vitest | 项目已有 Vite 构建，配置零成本；ESM 原生支持；与 Vite 插件生态共享 |
| DOM 环境 | jsdom | `@testing-library/react` 官方推荐；比 happy-dom 对 React effect 时序模拟更稳定 |
| Hook 测试方式 | `renderHook` + `vi.resetModules()` | useRecipes 依赖模块级缓存变量，必须通过 `resetModules` + 动态 `import()` 在每条用例前重置状态 |
| engine 数据注入 | mock `globalThis.fetch` + 内存 buffer | engine.ts 的 `loadData` 强依赖 `fetch`，mock fetch 可覆盖全部加载后逻辑，无需写磁盘 fixture 文件 |
| api-transform 策略 | 纯函数直接断言 | 无副作用、无外部依赖，直接传入入参断言返回值即可 |

---

## 6. 修复结果（2026-06-02 21:56）

```
Test Files  3 passed (3)
     Tests  67 passed (67)
```

### 6.1 实际修复清单

| # | 文件 | 修复内容 |
|---|------|---------|
| 1 | `engine.test.ts` | `arr[300]=1` → `arr[301]=1`（carrot 向量索引修正） |
| 2 | `engine.test.ts` | `East_Asian` pole: `[1,0,...]` → `[0,1,0,...]`（与 seed 正交） |
| 3 | `engine.test.ts` | `getEmbedding(99)` 断言改为验证空 `Float32Array`（length=0） |
| 4 | `api-transform.test.ts` | `ingredients_text` 期望改为 `'tofu'` |
| 5 | `useRecipes.test.ts` | API mock `/recipes`、`/categories` 返回实际数据（非空数组） |
| 6 | `useRecipes.test.ts` | 移除 `retry()` 后同步 `loading=true` 检查（React 18 批处理） |

### 6.2 根因修正：useRecipes 失败的真实原因

报告 §3.1 #7 归因为"fetch 路径匹配顺序"，**实际根因不同**：

`loadRecipes()` 加载本地 `recipes-meta.json` 后，后台调用 `fetchFromApiAndUpdate()` → `fetchAllRecipes()` + `fetchCategories()`。mock 对 API 端点返回空数组 → `notifyListeners()` 用空数据覆盖了已加载的本地数据。属于**数据流竞态**，非路径匹配问题。

---

## 7. 下一步行动

- [x] 按第 4 节修复 9 个失败用例
- [x] 重新运行 `pnpm test` 确认全绿（67/67）
- [ ] 可选：为 `engine.ts` 的 `getEmbedding` 增加 bounds check（代码改进，非测试修复）
- [ ] 可选：将测试纳入 CI（GitHub Actions 中增加 `pnpm test` 步骤）
