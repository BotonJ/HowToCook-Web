# HowToCook 待办任务清单

**创建时间**：2026-06-01
**最后更新**：2026-06-01

---

## 任务列表

### 任务 1：更换网站 LOGO

- **状态**：🔴 待确认文件
- **优先级**：P2
- **描述**：网站 LOGO 需要更换，已准备好但可能未上传
- **需要确认**：
  - [ ] 新 LOGO 文件在哪里？
  - [ ] 格式是什么？（SVG/PNG）
  - [ ] 尺寸要求？
- **改动文件**：
  - `src/components/Navbar.tsx`
  - `public/` 目录（放置新 LOGO 文件）
- **验收标准**：
  - [ ] 新 LOGO 正确显示
  - [ ] 移动端和桌面端都正常
  - [ ] 深色/浅色模式都可见

---

### 任务 2：修复 MCP Skill 语言切换问题

- **状态**：🔴 待排查
- **优先级**：P1
- **描述**：切换为英语后，MCP Skill 本身和安装说明也变成了英语，无法切回中文
- **排查方向**：
  - [ ] 检查 McpBanner 组件的 i18n 逻辑
  - [ ] 确认是否独立于全局语言状态
  - [ ] 检查语言切换后状态是否正确更新
- **改动文件**：
  - `src/components/McpBanner.tsx`
  - `src/lib/i18n/zh.ts`
  - `src/lib/i18n/en.ts`
- **验收标准**：
  - [ ] 语言切换后，Skill 安装说明正确显示对应语言
  - [ ] 可以从英文切回中文
  - [ ] 语言偏好持久化

---

### 任务 3：食材探索页面改名

- **状态**：🔴 待确认名称
- **优先级**：P2
- **描述**：食材探索这个标签和页面需要改名，内容已经准备好
- **需要确认**：
  - [ ] 新名称是什么？
- **改动文件**：
  - `src/components/Navbar.tsx` — 导航标签
  - `src/pages/Explore.tsx` — 页面标题
  - `src/lib/i18n/zh.ts` — 中文翻译
  - `src/lib/i18n/en.ts` — 英文翻译
- **验收标准**：
  - [ ] 导航标签显示新名称
  - [ ] 页面标题显示新名称
  - [ ] 中英文翻译都正确

---

### 任务 4：完善中英文切换的完整翻译

- **状态**：🔴 待检查
- **优先级**：P1
- **描述**：中英文切换后网站还没有完全切换为对应语言，需检查
- **检查清单**：
  - [ ] Navbar 所有链接
  - [ ] CategoryNav 标签
  - [ ] RecipeCard 徽章（难度、时间、菜系）
  - [ ] RecipeDetail 标签
  - [ ] About 页面内容
  - [ ] Credits 页面内容
  - [ ] Cooking Academy 内容
  - [ ] McpBanner 内容
  - [ ] PwaInstallButton 文本
  - [ ] 错误页面
- **改动文件**：
  - `src/lib/i18n/zh.ts`
  - `src/lib/i18n/en.ts`
  - 各组件文件（添加 useI18n 或 useT）
- **验收标准**：
  - [ ] 切换语言后，所有 UI 元素显示对应语言
  - [ ] 无遗漏的硬编码中文/英文
  - [ ] 语言偏好持久化

---

### 任务 5：上线新数据源和烹饪学园内容

- **状态**：🟡 进行中
- **优先级**：P1
- **描述**：
  1. 新菜谱数据源：掌管面食的神（36 道面点菜谱）
  2. 烹饪学院：模块 0-9（最小厨房 MVP）
- **子任务**：
  - [x] 面食菜谱转换脚本
  - [x] 面食菜谱集成到 useRecipes
  - [x] 烹饪学院内容转换
  - [x] 烹饪学院内容集成到 Tips 页面
  - [ ] **恢复数据源筛选（HowToCook/随便做/面食之神）**
  - [ ] **烹饪学院改版（系列合集布局）**
- **改动文件**：
  - `scripts/convert-noodle-recipes.ts`
  - `public/data/noodle-recipes.json`
  - `scripts/convert-cooking-academy.ts`
  - `src/data/cooking-academy.json`
  - `src/hooks/useRecipes.ts`
  - `src/pages/Tips.tsx`
  - `src/components/SourceNav.tsx`
  - `src/pages/Home.tsx`
- **验收标准**：
  - [ ] 主页显示三个数据源标签
  - [ ] 切换数据源后菜谱正确筛选
  - [ ] 烹饪学院显示系列合集布局
  - [ ] 模块间导航正常

---

## 依赖关系

```
任务 5 (P0) ← 任务 4 (P1) ← 任务 2 (P1)
                ↓
            任务 3 (P2)
                ↓
            任务 1 (P2)
```

## 提交计划

| 任务 | 提交信息 |
|------|----------|
| 5 | `fix(source): restore HowToCook/随便做/面食之神 source tabs` |
| 5 | `feat(academy): redesign cooking academy with series layout` |
| 4 | `fix(i18n): complete translation for all components` |
| 2 | `fix(skill): restore language toggle for MCP install instructions` |
| 3 | `feat(explore): rename explore page` |
| 1 | `feat(logo): update website logo` |

---

## 备注

- 所有任务在 `feature/i18n-en` 分支完成后再合并到 `main`
- 每个任务完成后部署到 preview 测试
- 用户确认后再合并到 production
