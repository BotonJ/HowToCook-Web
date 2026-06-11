# 风味工作台 React 转换 + Cloudflare 部署 执行计划

## 背景

将 HTML 原型 `HowToCook_Workbench_A_ModeSwitch.html`（1404 行单文件）转换为 React 组件，集成到现有 HowToCook 网站，部署到 Cloudflare Pages。

## 核心挑战与解决方案：6 维 vs 300 维

### 问题
- HTML 原型用 6 维风味（甜/酸/苦/鲜/辣/脂）做可视化
- 真实数据用 300 维嵌入做相似度计算
- 只有 13 个食材有专家标注的 6 维值

### 解决方案：菜谱反推 + 三层置信度

HowToCook 的 481 个菜谱同时拥有食材列表（`recipes.json`）和 6 维风味评分（`flavor-profiles.json`），通过 `zh_to_epicure.json` 映射到 epicure 词汇表。

| 层级 | 数量 | 数据来源 | 预估 MAE | 雷达图展示 |
|------|------|---------|----------|-----------|
| Tier 1 精确 | 13 | 专家标注 | 0 | ✅ 完整 |
| Tier 2 高置信 | 99 | 菜谱推导 (≥3 道菜) | ~0.5 | ✅ 完整 + 微标 |
| Tier 3 参考 | 174 | 菜谱推导 (1-2 道菜) | ~0.8 | ✅ 半透明 + 标注 |
| Tier 4 仅模式 | 1558 | 无 6 维数据 | — | 用 ModePanel |

286 个食材可展示雷达图（16%），覆盖大部分常用食材。剩余 1558 个使用已有的 ModePanel 模式系统（25 个属性，比 6 维更丰富）。

### 不同功能的数据源

| 功能 | 数据源 | 覆盖范围 |
|------|--------|---------|
| 雷达图 / 条形图 | ingredient-flavor-profiles.json | 286 食材 (Tier 1-3) |
| 风味圈搭配度 | 300 维嵌入 cosine similarity | 1790 食材（全部） |
| SLERP 菜系探索 | 300 维嵌入 + cuisinePoles | 1790 食材（全部） |
| 风味归属 (Cluster) | metadata.json modes | 1790 食材（全部） |
| 最近菜谱 | 300 维嵌入 vs flavor-profiles.json | 481 菜谱 |
| 平衡检测 / 缺什么 | ingredient-flavor-profiles.json | 286 食材 (Tier 1-3) |

---

## 现有资产

### 已有 React 网站 (`website/`)
- Vite + React 18 + TypeScript + Tailwind CSS 3
- `src/lib/epicure/engine.ts` — 300 维嵌入引擎（loadData, getNearestNeighbors, slerp, slerpToCuisine, getClosestMode, searchVocabulary）
- `src/lib/epicure/index.ts` — `useEpicure()` hook
- `src/lib/epicure/types.ts` — PairingResult, ModeResult, CuisinePole
- `src/components/explore/` — 6 个英文组件 (AngleSlider, IngredientSearch, IngredientCard, ModePanel, PairingPanel, SlerpPanel)
- 当前 Explore 页用 `<iframe src="/explore/workbench.html">` 嵌入原型

### 数据文件 (`public/data/epicure/`)
- `embeddings.f32` — 1790 食材 × 300 维浮点嵌入 (2.1MB)
- `metadata.json` — 词表、菜系极点、193 个模式
- `flavor-profiles.json` — 481 个菜谱的 6 维风味
- `epicure_vocab_zh.json` — 英→中映射
- `zh_to_epicure.json` — 中→英映射
- `mode-labels-zh.json` — 模式标签中译

### HTML 原型关键结构
- 15 个食材 + 14 个菜谱，硬编码 6 维数据
- 双模式：探索（1 食材）= 风味圈 SVG + Cluster + SLERP + 相关菜谱
- 合成（2+ 食材）= 雷达图 + 最近菜谱 + 风味评价 + 平衡检测 + 缺什么
- 全部 imperative DOM（getElementById + innerHTML）
- 使用 Tailwind CDN + Google Fonts (Literata + Plus Jakarta Sans) + Material Symbols

---

## Phase 1：数据层构建

### 1.1 构建脚本 `scripts/build-ingredient-flavors.ts`

读取：
- `public/data/recipes.json`（菜谱 + 食材列表）
- `public/data/epicure/flavor-profiles.json`（菜谱 6 维风味）
- `public/data/epicure/zh_to_epicure.json`（中→英映射）

逻辑：
1. 遍历 481 个菜谱，建立 `{中文食材: [菜谱风味列表]}`
2. 对每个食材，计算 6 维均值和标准差
3. 通过 zh_to_epicure 映射到 epicure 英文名
4. 合并专家标注的 13 个食材（硬编码，tier=1）
5. 按 recipe count 分层：≥3 → tier2，1-2 → tier3
6. 计算 confidence：min(1.0, nRecipes / 10)
7. epicure 中没有映射的 1558 个食材 → tier=4, confidence=0

输出 `public/data/epicure/ingredient-flavor-profiles.json`：
```json
{
  "chicken": {
    "sweet": 6.7, "sour": 6.5, "bitter": 7.0,
    "umami": 8.1, "spicy": 4.7, "fatty": 6.5,
    "tier": 1, "confidence": 1.0, "nRecipes": 0
  },
  "garlic": {
    "sweet": 6.6, "sour": 6.7, "bitter": 5.2,
    "umami": 7.5, "spicy": 4.5, "fatty": 4.0,
    "tier": 2, "confidence": 1.0, "nRecipes": 103
  }
}
```

### 1.2 数据加载模块 `src/lib/flavor-profiles.ts`

```ts
import type { FlavorProfile, FlavorVector } from '@/lib/epicure/types';

let profiles: Record<string, FlavorProfile> | null = null;

export async function loadFlavorProfiles(): Promise<void>;
export function getFlavorProfile(id: string): FlavorProfile | null;
export function getConfidenceTier(id: string): 1 | 2 | 3 | 4;
export function hasFlavorData(id: string): boolean;
```

### 1.3 扩展 `src/lib/epicure/types.ts`

新增：
```ts
export interface FlavorVector {
  sweet: number; sour: number; bitter: number;
  umami: number; spicy: number; fatty: number;
}

export interface FlavorProfile extends FlavorVector {
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  nRecipes: number;
}
```

---

## Phase 2：基础组件 + 状态管理

### 2.1 `src/components/workbench/FlavorWorkbench.tsx` — 主容器

```
状态：
- selected: Set<string>  // 选中的食材 ID
- mode: 'guide' | 'explore' | 'compose'  // 自动根据 selected.size 切换

数据加载：
- useEpicure() — 300 维引擎
- loadFlavorProfiles() — 6 维风味数据

Context：
- WorkbenchContext 向子组件传递 engine + flavorProfiles + selected + dispatch
```

### 2.2 `src/components/workbench/WorkbenchHeader.tsx`

- 标题 "风味工作台"（Literata 字体，渐变色）
- 副标题 "选 1 个食材探索风味圈，选 2+ 个食材合成分析"
- 模式徽章（探索/合成，带颜色）

### 2.3 `src/components/workbench/IngredientSearchBar.tsx`

- 搜索框（Material Symbols search 图标）
- Chip 网格（15 个核心食材快捷选择）
- 已选标签区（带删除按钮 + 清空按钮）
- 复用现有 IngredientSearch 的搜索逻辑，改为中文优先

### 2.4 `src/components/workbench/GuideView.tsx`

- 0 选中时显示
- 三步引导（选 1 个 → 探索模式 / 选 2+ → 合成模式 / 随时切换）

---

## Phase 3：探索模式（1 食材选中）

### 3.1 `src/components/workbench/explore/FlavorProfileBars.tsx`

- 6 维彩色条形图（sweet=#ff6b9d, sour=#ffd166, bitter=#06d6a0, umami=#4ecdc4, spicy=#ef476f, fatty=#e0aaff）
- 根据 tier 调整：
  - Tier 1: 实色，无标注
  - Tier 2: 实色，小字 "基于 N 道菜推算"
  - Tier 3: 透明度 0.6，标注 "参考值"
- 食品分组标签（inferFoodGroups 逻辑，从模式归属推导）

### 3.2 `src/components/workbench/explore/ClusterPanel.tsx`

- 调用 `getClosestMode(id, 5)` 获取 top 模式归属
- 展示：彩色圆点 + 模式名 + 匹配度 + 同类食材标签
- 对所有食材可用

### 3.3 `src/components/workbench/explore/FlavorWheel.tsx`（最复杂，~250 行）

- SVG 600×600 视口
- 中心：选中食材 emoji + 名称
- 9 个搭配节点，黄金角分布
- 节点大小 ∝ 相似度，颜色按 cluster
- 连接线（相似度越高越粗越不透明）
- 悬停：高亮节点 + 连接线，显示 tooltip
- 点击：切换探索起点
- 数据源：`getNearestNeighbors(id, 9)`（300 维）

### 3.4 `src/components/workbench/explore/CuisineExplorer.tsx`

- 菜系药丸（7 个菜系，复用 getCuisinePoles()）
- SLERP 滑轨（0°-90°，可拖拽圆形 thumb）
- 角度描述文本
- 结果 chips（top-3 食材，点击设为新探索起点）
- 数据源：`slerpToCuisine(seed, cuisine, angle, 10)`（300 维）

### 3.5 `src/components/workbench/explore/ExploreRecipes.tsx`

- 相关菜谱列表（图标 + 菜谱名 + 相似度）
- 数据源：300 维嵌入 cosine similarity vs flavor-profiles.json 中的菜谱
- 需要为 481 个菜谱计算嵌入（取其食材嵌入均值作为菜谱嵌入）

---

## Phase 4：合成模式（2+ 食材选中）

### 4.1 `src/components/workbench/compose/RadarChart.tsx`

- SVG 六角雷达图
- 6 个顶点：甜/酸/苦/鲜/辣/脂
- 多食材叠加，不同颜色 + 图例
- 仅 Tier 1-3 食材参与绘制
- 混合置信度 = 各食材最低 tier

### 4.2 `src/components/workbench/compose/ComposeDimBars.tsx`

- 选中食材的 6 维均值条形图
- 置信度指示器

### 4.3 `src/components/workbench/compose/FlavorComment.tsx`

- 基于 6 维分布生成风味评语
- 沿用原型 generateFlavorComment 逻辑

### 4.4 `src/components/workbench/compose/BalanceDetection.tsx`

- 检测偏离均值 >2σ 的维度
- 警报卡片（红色脉冲 = 过高，绿色脉冲 = 偏低）
- 修复建议（推荐补充食材）
- 仅在有 Tier 1-3 数据时可用

### 4.5 `src/components/workbench/compose/ClosestRecipes.tsx`

- 合成风味向量（选中食材的 6 维均值）
- 用 300 维嵌入计算最近菜谱（取食材均值作为合成向量）
- 展示 top-5 菜谱 + 相似度

### 4.6 `src/components/workbench/compose/Suggestions.tsx`

- 找最弱维度
- 推荐在该维度高分的补充食材
- 仅 Tier 1-2 食材参与推荐

---

## Phase 5：集成 + 清理

### 5.1 重写 `src/pages/Explore.tsx`

```tsx
import { FlavorWorkbench } from '@/components/workbench/FlavorWorkbench';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';

export function Explore() {
  useMeta({ title: '风味工作台', description: '...' });
  return (
    <Layout>
      <FlavorWorkbench />
    </Layout>
  );
}
```

### 5.2 删除 `public/explore/workbench.html`

---

## Phase 6：Cloudflare Pages 部署

### 6.1 配置

项目已是 Vite SPA，直接部署到 Cloudflare Pages：

- Build command: `pnpm build`
- Output directory: `dist`
- Node version: 18+
- 纯静态，无需 Workers / D1 / KV

### 6.2 SPA 路由

确保 `public/_redirects` 包含：
```
/*  /index.html  200
```

### 6.3 静态资源

- `embeddings.f32` (2.1MB) — Cloudflare 自动 gzip
- `ingredient-flavor-profiles.json`（新增，~100KB）— 很小
- `ingredient-recipes.json` (9.8MB) — 仅前端按需加载

---

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| **新增** | `scripts/build-ingredient-flavors.ts` | 构建脚本，生成风味数据 |
| **新增** | `public/data/epicure/ingredient-flavor-profiles.json` | 生成的数据文件 |
| **新增** | `src/lib/flavor-profiles.ts` | 风味数据加载模块 |
| **新增** | `src/components/workbench/FlavorWorkbench.tsx` | 主容器 |
| **新增** | `src/components/workbench/WorkbenchHeader.tsx` | 标题区 |
| **新增** | `src/components/workbench/IngredientSearchBar.tsx` | 搜索 + chips |
| **新增** | `src/components/workbench/GuideView.tsx` | 引导页 |
| **新增** | `src/components/workbench/WorkbenchContext.tsx` | Context 定义 |
| **新增** | `src/components/workbench/explore/FlavorProfileBars.tsx` | 6 维条形图 |
| **新增** | `src/components/workbench/explore/ClusterPanel.tsx` | 风味归属 |
| **新增** | `src/components/workbench/explore/FlavorWheel.tsx` | SVG 风味圈 |
| **新增** | `src/components/workbench/explore/CuisineExplorer.tsx` | SLERP 探索 |
| **新增** | `src/components/workbench/explore/ExploreRecipes.tsx` | 相关菜谱 |
| **新增** | `src/components/workbench/compose/RadarChart.tsx` | 雷达图 |
| **新增** | `src/components/workbench/compose/ComposeDimBars.tsx` | 合成条形图 |
| **新增** | `src/components/workbench/compose/FlavorComment.tsx` | 风味评语 |
| **新增** | `src/components/workbench/compose/BalanceDetection.tsx` | 平衡检测 |
| **新增** | `src/components/workbench/compose/ClosestRecipes.tsx` | 最近菜谱 |
| **新增** | `src/components/workbench/compose/Suggestions.tsx` | 缺什么 |
| **修改** | `src/lib/epicure/types.ts` | 新增 FlavorVector, FlavorProfile |
| **修改** | `src/pages/Explore.tsx` | 替换 iframe 为 FlavorWorkbench |
| **删除** | `public/explore/workbench.html` | 移除旧原型 |

## 依赖

无新增 npm 依赖。复用已有：
- react 18 + react-dom
- typescript ~5.8
- tailwindcss ^3.4
- framer-motion（动画过渡）
- lucide-react（图标，补充 Material Symbols）
- @fontsource-variable/literata + @fontsource/plus-jakarta-sans（已有字体）

## 执行顺序

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

每个 Phase 完成后可独立验证：
- Phase 1: 运行脚本，检查生成的 JSON 文件
- Phase 2: 页面渲染引导页，搜索可用
- Phase 3: 选中 1 食材，探索模式完整可用
- Phase 4: 选中 2+ 食材，合成模式完整可用
- Phase 5: `/explore` 路由正常，iframe 已移除
- Phase 6: Cloudflare Pages 部署成功
