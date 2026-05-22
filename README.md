# HowToCook（图片版）

本项目参考开源菜谱仓库 [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)，在保留原有菜谱 Markdown 内容组织方式的基础上，为每道菜使用 `gemini-3-pro-image-preview` 批量生成`4K`分辨率的菜品图片，并提供按分类聚合的目录页，便于浏览与检索。

## 在线访问

- 站点地址：<https://king-jingxiang.github.io/HowToCook/>

## 项目用途

- 提供更直观的菜谱浏览体验，图片与文字同步呈现
- 按分类聚合，便于快速查找与检索
- 作为学习烹饪或内容整理的参考库

## 目录

下面链接对应本项目目录 `menus/` 下的分类 Markdown 文件：

- [基础操作](./menus/dishes/tips.md)
- [素菜](./menus/vegetable_dish.md)
- [荤菜](./menus/meat_dish.md)
- [水产](./menus/aquatic.md)
- [早餐](./menus/breakfast.md)
- [主食](./menus/staple.md)
- [汤与粥](./menus/soup.md)
- [饮料](./menus/drink.md)
- [甜品](./menus/dessert.md)
- [半成品加工](./menus/semi-finished.md)
- [酱料和其它材料](./menus/condiment.md)

## 内容结构

- `menus/`：分类目录索引页
- `dishes/`：各菜谱的 Markdown 与配图

## 图片生成

为保证菜谱图片统一风格，本项目使用 `gemini-3-pro-image-preview` 模型进行批量生成，配合以下提示词模板即可输出一致的 9:16 菜谱卡片。将每道菜的做法内容替换到 `{{cook_content}}` 后提交生成。

```
**提示词目标：** 生成一张 9:16 比例的简约信息图表式菜谱卡片。**最终必须生成图片**。

**1. 整体布局 (Layout Structure):**

* **比例：** 严格遵守 9:16 纵向长图布局。
* **分区：** 图像垂直分为两大部分。上半部分（约占 40%）为高清食物成品实拍图；下半部分（约占 60%）为结构化的菜谱信息区。
* **背景：** 统一使用米白色（Off-white）或浅米色纸张纹理背景，整体风格清新干净。

**2. 视觉风格 (Visual Style):**

* **成品图风格：** 顶部照片采用专业美食摄影风格，自然光、高对比度、质感细腻，放置在木质或大理石纹理的桌面上。
* **插画风格：** 菜谱区使用简约的扁平化矢量图标（Flat Vector Icons）和简单的黑色线稿插画（Line Art Illustrations）。
* **装饰元素：** 画面边缘点缀与菜品主题相关的简约线条装饰（如波浪、植物叶片或简约边框）。

**3. 模块化内容 (Modular Content):**

* **标题区：** 居中显示菜名，使用优雅且易读的中文字体。
* **原料区：** 使用小巧的食物图标配上文字，排列整齐。
* **步骤区：** 使用圆圈数字标注步骤，每个步骤配以简约的厨具/动作线稿简笔画。
* **底部装饰：** 包含简短的技巧说明或温馨提示。

**4. 负向约束 (Negative Prompt):**

* 避免画面杂乱、避免深色背景、不要出现混乱的文字重叠、不要使用过于写实的烹饪过程图（仅限线稿）。

菜谱做法如下：
{{cook_content}}
```

批量生成建议使用 Gemini Batch API，成本更低、适合较大规模的任务：
<https://ai.google.dev/gemini-api/docs/batch-api?hl=zh-cn&batch=file>

## 图片压缩

当前使用 4K 原始图片压缩到 2K，发布 Release 时会导出 2K 分辨率图片生成的 PDF 以及 1K 分辨率生成的 PDF。对应命令如下：

```bash
# 4k转2k
pnpm run compress-images -- --quality 92 --height 2752 --overwrite true
# 2k转1k
pnpm run compress-images -- --quality 92 --height 1376 --output-dir dist/images-1k --overwrite false
```

## 后续计划

- 校对当前生成的菜谱图片是否有错误，文字残缺，渲染图错误等问题
- 补充原始菜谱文档并添加 Markdown 链接以及 page 页面链接
- page 页面增加菜谱文档的展示
- page 页面增加模糊搜索来进行菜谱搜索
- page 页面增加菜谱选择以及导出的功能，用来定制自己的私房菜

## 如何参与与贡献

- Fork 本仓库并创建分支
- 在 `dishes/` 中新增或修正菜谱内容，并在对应 `menus/` 分类页补充入口
- 提交清晰的变更说明后发起 Pull Request

## 致谢

- 原始菜谱与结构参考：<https://github.com/Anduin2017/HowToCook>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=king-jingxiang/HowToCook&type=date&legend=top-left)](https://www.star-history.com/#king-jingxiang/HowToCook&type=date&legend=top-left)