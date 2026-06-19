# HowToCook 菜谱数据库

给所有下厨人的做饭指北，505+ 道菜谱，支持多维度筛选、智能推荐、偏好学习。

## 数据源

| 数据源 | 数量 | 特点 |
|--------|------|------|
| howtocook | 361 道 | 程序员风格、精确量化、步骤带公式 |
| 随便做 | 140 道 | 简易版/进阶版双步骤 |
| 金谷园 | 1 道 | 饺子馆招牌甜品 |
| 其他陆续增加 |  道 |  |



## 筛选维度

| 维度 | 字段 | 覆盖率 | 值 |
|------|------|--------|-----|
| 分类 | category | 100% | 荤菜/素菜/水产/早餐/主食/汤粥/甜点/饮品/调料/半成品 |
| 难度 | difficulty | 100% | 1-5 星 |
| 菜系 | cuisine | 100% | 川/粤/鲁/湘/东北/西北/苏/浙/闽/徽/京/客家/日式/韩式/东南亚/西式/家常 |
| 烹饪方式 | cooking_method | 100% | 炒/炖煮/蒸/烤/炸/凉拌/烘焙/饮品 |
| 时间 | cook_time | 100% | quick(<15m)/medium(15-30m)/long(30-60m)/slow(>60m) |
| 主食材 | main_ingredients | 89.8% | 11 组标准化食材 |
| 辣度 | tags.spicy | 100% | true/false |
| 过敏原 | tags.allergens | 100% | 花生/海鲜/麸质/乳制品/鸡蛋/大豆 |

## 使用方法

```bash
# 生成/更新索引（仅开发/构建；运行时菜谱数据走 API）
python scripts/indexer.py

# 搜索菜谱（CLI）
python search.py 水煮鱼

# 偏好初始化（首次使用）
python profile.py --init
```

在 Claude Code/Hermes/Open Claw 中直接使用触发词：
- `/查菜谱 红烧排骨` — 搜索菜谱
- `/想吃什么` — 随机推荐
- `来个川菜` — 按菜系筛选
- `设置口味偏好` — 初始化问卷

## 偏好系统

首次使用通过 `questionnaire.json`（6 道题）初始化偏好，后续行为自动积累权重。

| 行为 | 权重变化 |
|------|---------|
| 做了 | +0.10 |
| 收藏 | +0.07 |
| 浏览 | +0.02 |
| 跳过 | -0.03 |
| 不喜欢 | -0.15 |

权重每天衰减 5%（×0.95）。

## 文件说明

| 文件 | 说明 |
|------|------|
| `schema.py` | 枚举定义、映射规则、标签提取 |
| `parser.py` | 菜谱解析器（支持 -、*、+ 食材格式） |
| `search.py` | 搜索引擎（集成偏好筛选 + 多维搜索） |
| `mcp_tools.py` | MCP 工具封装（HTTP API 调用） |
| `http_client.py` | 共享 HTTP 客户端（统一 API_BASE 与 GET 请求） |
| `planner.py` | 购物清单 / 一周菜单 / 时间预算推荐 |
| `profile.py` | 偏好管理（初始化/更新/衰减） |
| `questionnaire.json` | 跨平台初始化问卷 |
| `index.json` | 菜谱索引（本地 fallback 缓存，详情走 API） |
| `scripts/indexer.py` | 索引生成器（构建工具） |

## 致谢

- 原始菜谱与结构参考：<https://github.com/Anduin2017/HowToCook>
- 可视化图片制作参考：<https://github.com/king-jingxiang/HowToCook>
- 金谷园饺子馆 [JinGuYuan/jinguyuan-dumpling-skill]
- 知乎
- 其他贡献者及关注者

## 协议
MIT



