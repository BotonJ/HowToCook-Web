# HowToCook Web

基于开源菜谱仓库 [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) 及其衍生项目，重新构建的中文菜谱 Web 平台。

- 站点地址：https://www.howtocook.cn
- API 地址：https://api.howtocook.cn

## 项目特色

### 多源菜谱聚合

整合 4 个中文菜谱数据源，共 496 道菜谱：

| 数据源 | 说明 |
|--------|------|
| HowToCook | 社区维护的程序员做饭指南 |
| 随便做 | 隋坡菜谱（公开资料收集） |
| 金谷园 | 饺子馆菜谱 |
| 面食之神 | 面食菜谱 |

菜谱支持按分类、菜系（17 种）、烹饪方式（10 种）、难度、耗时筛选。

### 风味工作台

访问 `/explore`，基于自训练食材嵌入模型的风味探索工具：

- **概览**：搜索任意食材，查看 6 维风味剖面（甜/鲜/脂/辣/苦/酸）、风味轮、最近邻食材
- **搭配**：食材共现搭配推荐、惊喜搭配（语义相近但共现率低的创意组合）、多食材雷达图对比
- **菜谱**：从食材出发发现相关菜谱
- **实验室**：SLERP 插值 — 在两个食材的向量空间之间平滑过渡，探索风味渐变轨迹

数据来源：从 100 万道中文菜谱中训练的高维食材嵌入向量（22,000+ 词汇）。备注：菜谱质量清洗难度过大，目前可能存在大量未发现噪音。

### 烹饪学院

访问 `/academy`，提供入门级烹饪知识：

- **最小厨房 MVK 系列**（10 个模块）：从锅具、刀具、砧板到调味基础、厨房安全
- **技巧文章**：去腥技巧、油温判断、食品安全、食材搭配禁忌

### MCP Tools 集成

支持 Claude Code / Hermes / Open Claw 等 Agent 平台一键接入：

| 工具 | 功能 |
|------|------|
| `search_recipes` | 按关键词、分类、菜系搜索菜谱 |
| `get_recipe` | 获取菜谱详情 |
| `get_categories` | 获取分类列表 |
| `check_api_health` | API 健康检查 |

### 合集页

6 个主题合集，按厨具和场景快速筛选：

- 空气炸锅 · 微波炉 · 电饭煲 · 烤箱
- 懒人饭（难度 ≤ 2 + 快速烹饪）
- 下饭菜

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 · Vite 8 (Rolldown) · TypeScript 5.8 · Tailwind CSS 3 · Framer Motion |
| API | Hono · Cloudflare Workers · Cloudflare KV |
| 数据层 | Python（菜谱解析、索引、搜索、MCP 工具） |
| 部署 | Cloudflare Pages (前端) + Workers (API) |
| 其他 | PWA · i18n 中英双语 · Gemini AI 菜谱配图 |

## API 端点

```
GET /search?q=红烧肉&category=肉类&cuisine=川菜    搜索菜谱
GET /recipes?page=1&limit=20                        分页列表
GET /recipe/:id                                     菜谱详情（支持 ETag 缓存）
GET /categories                                     分类列表（含计数）
GET /epicure/pair?q=番茄&k=10                       风味搭配推荐
GET /epicure/substitute?q=番茄&k=5                  食材替代推荐
GET /epicure/explore?seed=番茄&dir=cuisine&angle=30 风味空间探索
GET /health                                         健康检查
```

## 本地开发

```bash
# 前端
cd website
npm install
npm run dev

# API
cd howtocook-api
npm install
npm run dev

# 数据同步
cd howtocook-skill
python -m howtocook_skill.sync
```

## 数据源致谢

- [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) — 原始菜谱数据
- [king-jingxiang/HowToCook](https://github.com/king-jingxiang/HowToCook) — 可视化参考
- [ryanuo/whatToEat](https://github.com/ryanuo/whatToEat) — 衍生项目
- 金谷园饺子馆 — 饺子馆菜谱
- 隋坡 — 随便做菜谱

## 算力及平台致谢

- MiMo-V2.5-Pro-UltraSpeed
- DeepSeek 
- 知乎

## 协议

MIT
