# 商业化模块工具箱 · 网页版

静态网页版，不再需要 exe / 安装包。

```text
https://pixelleap.github.io/Biz-module-toolbox/
```

## 功能

- 43 个商业化模块
- 选择模式 / 编辑模式
- 所有游戏共用一套默认选中配置
- 模块选项、说明图、标签、分类
- SVG / PNG / PDF 导出
- 分享 HTML
- JSON 导入 / 导出
- 网页编辑密码
- 自动读取最新 `docs/data.json`

## 编辑与发布

1. 打开网页
2. 切换到「编辑模式」
3. 输入编辑密码：

```text
yixiaoyou
```

4. 修改模块、选项、图片
5. 点「设置 → 数据 → 导出 data.json」
6. 用导出的文件覆盖仓库里的：

```text
docs/data.json
```

7. 提交并推送：

```bash
git add docs/data.json
git commit -m "update data"
git push
```

8. GitHub Pages 自动更新，别人刷新网页就能看到

内容更新**不需要执行构建**，也不需要重新打包。

## 编辑密码说明

密码是前端门槛，用来防止普通访客误操作：

- 密码以 SHA-256 哈希写在页面 JS 里
- 登录状态只保存在当前标签页（sessionStorage）
- 懂技术的人仍然可以绕过
- data.json 和数据本身是公开的

如果需要真正阻止别人修改，必须接后端账号系统；当前按「够用」实现。

## data.json

`docs/data.json` 是线上内容唯一数据源：

```text
docs/
  index.html     网页应用
  data.json      模块、选项、项目、默认配置、图片
  .nojekyll
```

`data/*.json` 和 `thumbs/` 只作为初始种子/备份。

- 网页启动时请求 `data.json`
- 访客本地只保存「选择」，不保存整份内容
- data.json 更新后内容自动更新，本地选择按模块/选项 ID 保留
- 被删除的模块/选项自动从本地选择中移除

## 本地预览

在仓库根目录起一个静态服务器：

```bash
npx serve docs
```

或：

```bash
python -m http.server 4174 --directory docs
```

然后打开：

```text
http://127.0.0.1:4174/
```

直接双击 `docs/index.html` 也能看内置快照，但 `data.json` 的联网更新和密码编辑请用 HTTP 地址。

## 构建网页

只有修改代码（模板 / 构建脚本）时才需要：

```bash
npm run build
```

输出：

```text
docs/index.html
```

已存在的 `docs/data.json` **不会被覆盖**。

如果确实要从 `data/*.json` 重新生成线上数据：

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

> 改成 Public 会把 Git 历史里的旧数据也公开，不只是当前 `docs/`。

## 目录

```text
build.mjs             构建入口
lib/build.mjs         把 data 模板构建成 docs/index.html
template/template.html  网页应用源码
data/                 初始模块/游戏/分类/行数据
thumbs/               初始缩略图和选项图
docs/                 GitHub Pages 发布目录
```

## 版本

v3.0.0

- 从 Electron 桌面版迁移到静态网页
- data.json 线上更新，不再打包 exe
- 编辑密码
- 本地选择保留
- 本地编辑草稿

