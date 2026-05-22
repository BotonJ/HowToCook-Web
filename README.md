# HowToCook（图片版）

本项目参考开源菜谱仓库 [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)，[king-jingxiang/HowToCook](https://github.com/king-jingxiang/HowToCook)[ryanuo/whatToEat]及相应衍生产品，在保留原有菜谱 Markdown 内容组织方式的基础上，重新编写了组织和搜索脚本，提供按分类聚合的目录页，便于浏览与检索。

同时，为整个项目制作了Skill和MCP功能，使用Cloudflare作为后端。只需要下载部署Skill，将可以自动连接本网站Mcp及时获得数据更新。
即便你没有使用过Agent，也可以通过访问 https://www.howtocook.cn 获得相同的使用体验。

项目还增加了不少专业大厨的菜谱和相应的视频资源。

## 在线访问

- 站点地址：<https://www.howtocook.cn>

## 项目用途

- 提供更直观的菜谱浏览体验，部分图片与文字同步呈现
- 按分类聚合，便于快速查找与检索
- 作为学习烹饪或内容整理的参考库
- 一键部署到Claude Code/Hermes/Open Claw 等。如果绑定了微信、飞书等渠道可以直接手机访问。

## 目录

下面链接对应本项目目录 `menus/` 下的分类 Markdown 文件：

## 数据库

- HowToCook 开源库 由Github程序员自行维护 
- 随便做 从公开资料收集的隋坡菜谱
- 金谷园 第一个将饺子馆制作成Skill的饺子馆菜谱库
- 其他大厨菜谱陆续增加中（取决于多方面因素）



## 后续计划

- 按统一格式整理上传菜谱 
- 增加英文翻译、西餐菜谱
- 优化脚本输出，以Html格式代替MD
- 增加Skill自动更新功能
- 其他

## 如何参与与贡献

- Fork 本仓库并创建分支
- 在 `dishes/` 中新增或修正菜谱内容，并在对应 `menus/` 分类页补充入口
- 提交清晰的变更说明后发起 Pull Request
- 提交Issue

## 致谢

- 原始菜谱与结构参考：<https://github.com/Anduin2017/HowToCook>
- 可视化图片制作参考：<https://github.com/king-jingxiang/HowToCook>
- 金谷园饺子馆 [JinGuYuan/jinguyuan-dumpling-skill]
- 隋坡

