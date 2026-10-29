# 商业化模块工具箱 · 网页版

静态网页版，不再需要 exe / 安装包。

```text
https://pixelleap.github.io/BizModToolkit/
```

## 功能

- 模块 / 选项 / 选项 三层结构
- 43 个模块
- 206 个一级选项（含 43 个基础）
- 603 个二级选项
- 同一一级选项内可多选二级选项

- 43 个商业化模块
- 只保留一个「默认配置」
- 选择模式 / 编辑模式
- 模块选项、说明图、标签、分类
- JSON / PNG / SVG 导出与导入

- JSON 导入 / 导出
- 编辑密码
- 自动读取最新 `docs/data.json`

## 不保存、不缓存

网页不保存选择、草稿和图片：

- 选择模块/选项只影响当前页面
- 编辑内容只影响当前页面
- 刷新或重新打开，恢复 `docs/data.json` 的默认配置
- 不写 `localStorage` 选择/草稿
- 图片只在内存中，上传的图片刷新即丢失

编辑密码在当前标签页内记住；关闭标签页后重新输入。

## 默认配置

只有一个项目：

```text
默认配置
```

当前默认：7 个通用底座模块，137 个底座选项默认选中。

不再有「绝密行动」「示例游戏」，也没有项目切换、新建、复制、重命名、删除。

## 编辑与发布

1. 打开网页
2. 切到「编辑模式」
3. 输入密码：

```text
yixiaoyou
```

4. 修改模块、选项、图片
5. 设置 → 数据 → **导出 data.json（发布）**
6. 用导出的文件覆盖：

```text
docs/data.json
```

7. 提交并推送：

```bash
git add docs/data.json
git commit -m "update data"
git push
```

8. GitHub Pages 自动更新

刷新页面会恢复新的 `data.json` 默认值。  
编辑后请先导出，不要直接刷新。

内容更新不需要构建，也不需要重新打包。

## 编辑密码说明

密码是前端门槛：

- SHA-256 哈希写在页面 JS
- 解锁状态只保存在当前标签页
- 懂技术的人仍可绕过
- data.json 本身是公开的

需要真正阻止修改，必须接后端账号系统。

## data.json

`docs/data.json` 是线上内容唯一数据源：

```text
docs/
  index.html     网页应用
  data.json      模块、选项、默认配置、图片
  .nojekyll
```

- 页面启动请求 `data.json?t=...`，`cache: no-store`
- 数据更新后，刷新即用新内容
- 不读取本地旧选择/草稿
- `data/*.json` 和 `thumbs/` 只作为初始种子/备份

## 本地预览

```powershell
cd D:\Workspace\module-board
python -m http.server 4174 --directory docs
```

打开：

```text
http://127.0.0.1:4174/
```

直接双击 `index.html` 只能看内置快照；联网更新请用 HTTP 地址。

## 构建

只有修改代码（模板 / 构建脚本）时才需要：

```bash
npm run build
```

输出：

```text
docs/index.html
```

已存在的 `docs/data.json` 不会被覆盖。

从 `data/*.json` 重新生成线上数据：

```bash
npm run seed:data
```

## GitHub Pages

仓库需要是 **Public**：

1. Settings → General → 改 Public
2. Settings → Pages
3. Source：Deploy from a branch
4. Branch：`main`
5. Folder：`/docs`
6. Save

> 改成 Public 会把 Git 历史里的旧数据也公开。

## 版本

v4.1.0

- 只保留默认配置
- 删除项目切换
- 不保存选择/草稿/图片
- 刷新恢复 data.json 默认
- 编辑密码保留

