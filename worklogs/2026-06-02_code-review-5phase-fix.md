# Worklog: 五维度全面审核与分阶段修复

**日期**: 2026-06-02
**范围**: `src/` 全量源码（~7,500 行）+ `scripts/`（1,565 行）+ 配置文件

## 背景

对 HowToCook Website 进行全面 code review，5 个并行审核代理覆盖安全、代码质量、React 架构、构建脚本、可访问性/SEO 五个维度。发现 8 CRITICAL + 30 HIGH + 37 MEDIUM + 26 LOW 问题。

## 修复过程

### Phase 1: 安全与依赖修复
- 升级 `vite` 6.3.5 → 8.0.16 + `@vitejs/plugin-react` 4.7.0 → 6.0.2（修复 Rollup 路径遍历 CVE）
- 升级 `postcss` 8.5.6 → 8.5.15（修复 XSS CVE）
- 新增 `dompurify` 3.4.7，`TipDetail.tsx` 中 `marked.parse()` 输出经 DOMPurify 消毒
- 新增 `safeJsonLd()` 工具函数，三个 JSON-LD 组件替换不完整的 `</script>` 转义
- 修复 `RecipeJsonLd` 中 `Halal → KosherDiet` 映射错误

### Phase 2: 类型安全修复
- `tsconfig.json` 启用 `strict: true`（原来仅 `strictNullChecks`）
- 新增 `EnDish`、`NoodleDish`、`EnIndexData`、`NoodleData` 接口
- `useRecipes.ts` 消除 6 处 `any`，`CollectionPage.tsx` 消除 2 处 `any`
- `eslint.config.js` 配置 `no-unused-vars` 允许 `_` 前缀
- 修复 `api.ts` `no-control-regex`、移除无用 eslint-disable、修复 PwaInstallButton ts-expect-error 注释

### Phase 3: 性能优化
- `App.tsx` 8 个页面组件改为 `React.lazy` + `Suspense` 懒加载
- 主 bundle 从 629KB (205KB gzip) 降至 **263KB (88KB gzip)**，降幅 **58%**
- 代码分割为 18 个 chunk，消除 Vite chunk size 警告

### Phase 4: 代码卫生
- `engine.ts` export `cosineSimilarity` + `formatName`
- `ClosestRecipes.tsx`、`ExploreRecipes.tsx` 消除重复的 `cosineSimilarity`
- `ModePanel.tsx`、`IngredientSearch.tsx`、`ClusterPanel.tsx`、`IngredientSearchBar.tsx` 消除重复的 `formatName`
- 新增 `lib/flavor-dims.ts` 共享六维风味常量
- `BalanceDetection.tsx`、`Suggestions.tsx`、`FlavorComment.tsx` 改用共享常量

### Phase 5: 可访问性与 SEO
- 3 处搜索输入框添加 `aria-label`
- `LangProvider` 中 `document.documentElement.lang` 随语言切换动态更新
- `Layout.tsx` 添加 skip-to-content 链接 + `<main id="main-content">`
- `FlavorRadar.tsx` SVG 添加 `role="img"` + `<title>` + `<desc>` + `aria-label`

## 验证结果

| 指标 | 修复前 | 修复后 |
|------|-------|-------|
| TypeScript | pass | pass (strict: true) |
| ESLint errors (src/) | 17 | **0** |
| ESLint warnings | 10 | 9 (non-blocking react-refresh) |
| 主 bundle JS | 629 KB / 205 KB gzip | **263 KB / 88 KB gzip** |
| 代码分割 chunks | 1 | **18** |

## 未处理项（后续跟进）

- `scripts/` 中 5 个 lint errors（不影响生产包）
- `WorkbenchContext` 拆分（性能优化，需专项重构）
- `useEpicure` 返回值 `useMemo` 稳定化
- `RecipeDetail.tsx` i18n 硬编码字符串（工作量大）
- 更多 SVG 图表 a11y（FlavorWheel、RadarChart）
- `CuisineNav` useEffect 初始化副作用提升到父组件
