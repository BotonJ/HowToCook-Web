# HowToCook 网站改版计划

**创建时间**：2026-06-01
**当前分支**：feature/i18n-en
**目标**：修复 preview 问题 + 完成 5 个待办任务

---

## 问题清单

### P0：紧急修复

| # | 问题 | 状态 |
|---|------|------|
| 1 | 主页数据源筛选（HowToCook/随便做）丢失 | 🔴 待修复 |
| 2 | 掌管面食的神未在主页显示 | 🔴 待修复 |

### P1：功能完善

| # | 任务 | 状态 |
|---|------|------|
| 3 | 烹饪学院改版（系列合集布局） | 🔴 待开始 |
| 4 | 完善中英文切换翻译 | 🔴 待开始 |
| 5 | 修复 MCP Skill 语言切换问题 | 🔴 待开始 |

### P2：内容更新

| # | 任务 | 状态 |
|---|------|------|
| 6 | 更换网站 LOGO | 🔴 待确认文件 |
| 7 | 食材探索页面改名 | 🔴 待确认名称 |

---

## 执行计划

### Phase 1：恢复数据源筛选（P0）

**目标**：恢复 HowToCook/随便做/面食之神 三个数据源标签

**改动文件**：
- `src/components/SourceNav.tsx` — 恢复并扩展数据源配置
- `src/pages/Home.tsx` — 恢复 SourceNav 逻辑

**逻辑**：
```
中文模式：
  [HowToCook] [随便做] [面食之神]  ← 数据源筛选
  [荤菜] [素菜] [汤粥] [主食] ... ← 分类筛选

英文模式：
  [All] [Chinese▼] [American] [Italian] ... ← 菜系筛选
```

**数据源映射**：
| 标签 | source 值 | 说明 |
|------|-----------|------|
| HowToCook | `howtocook` | 原始数据 |
| 随便做 | `随便做` | 第二数据源 |
| 面食之神 | `noodle-god` | 新增面点菜谱 |

---

### Phase 2：烹饪学院改版（P1）

**目标**：将分散的模块改为系列合集布局

**当前问题**：
- 10 个模块平铺展示，不适合系列内容
- 缺少进度指示
- 缺少系列导航

**改版方案**：
```
┌─────────────────────────────────────────────────────┐
│ 📚 最小厨房 MVP 系列                                │
│ ─────────────────────────────────────────────────── │
│ ① 概述  ② 锅具  ③ 刀具  ④ 砧板  ⑤ 工具            │
│ ⑥ 调料  ⑦ 存储  ⑧ 餐具  ⑨ 炉灶  ⑩ 安全            │
│ ─────────────────────────────────────────────────── │
│ 进度: ████████░░ 8/10 完成                          │
│                                                     │
│ 当前模块：② 锅具                                    │
│ [上一个] [下一个 →]                                  │
└─────────────────────────────────────────────────────┘
```

**改动文件**：
- `src/pages/Tips.tsx` — 重新设计布局
- `src/pages/TipDetail.tsx` — 添加系列导航

---

### Phase 3：完善中英文翻译（P1）

**目标**：确保所有组件在语言切换后正确显示

**检查清单**：
- [ ] Navbar 所有链接
- [ ] CategoryNav 标签
- [ ] RecipeCard 徽章
- [ ] RecipeDetail 标签
- [ ] About 页面内容
- [ ] Credits 页面内容
- [ ] Cooking Academy 内容
- [ ] McpBanner 内容

---

### Phase 4：修复 MCP Skill 语言切换（P1）

**问题**：切换英语后，Skill 安装说明变成英语，无法切回中文

**排查方向**：
- McpBanner 组件的 i18n 逻辑
- 是否独立于全局语言状态

---

### Phase 5：内容更新（P2）

#### 5.1 更换 LOGO
- **待确认**：新 LOGO 文件位置、格式、尺寸
- **改动文件**：`src/components/Navbar.tsx`

#### 5.2 食材探索页面改名
- **待确认**：新名称是什么
- **改动文件**：
  - `src/components/Navbar.tsx` — 导航标签
  - `src/pages/Explore.tsx` — 页面标题
  - `src/lib/i18n/zh.ts` — 中文翻译
  - `src/lib/i18n/en.ts` — 英文翻译

---

## 提交策略

每个 Phase 完成后单独提交：

```bash
git commit -m "fix(source): restore HowToCook/随便做/面食之神 source tabs"
git commit -m "feat(academy): redesign cooking academy with series layout"
git commit -m "fix(i18n): complete translation for all components"
git commit -m "fix(skill): restore language toggle for MCP install instructions"
git commit -m "feat(content): update LOGO and rename explore page"
```

---

## 验证方案

### 功能验证

1. **数据源筛选**
   - 中文模式显示三个数据源标签
   - 切换数据源后菜谱正确筛选
   - 英文模式显示 CuisineNav

2. **烹饪学院**
   - 系列合集正确显示
   - 模块间导航正常
   - 进度指示正确

3. **语言切换**
   - 所有组件正确翻译
   - Skill 安装说明可切回中文
   - 语言偏好持久化

### 构建验证

```bash
pnpm run build
pnpm run preview
```

---

## 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据源筛选逻辑复杂 | 可能引入 bug | 充分测试 |
| 烹饪学院改版工作量大 | 延期 | 先做最小版本 |
| 翻译内容不完整 | 用户体验差 | 优先翻译核心组件 |

---

## 待确认事项

| 事项 | 负责人 | 截止时间 |
|------|--------|----------|
| 新 LOGO 文件位置 | 用户 | - |
| 食材探索新名称 | 用户 | - |
| 烹饪学院改版确认 | 用户 | - |
