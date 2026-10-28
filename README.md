# 商业化模块工具箱 · 协作源（方案 B）

## 推荐：本地编辑模式（改了直接进 VSCode）

双击仓库根目录的：

```text
启动编辑模式.bat
```

它会启动一个只在本机运行的编辑服务，并自动打开：

```text
http://127.0.0.1:4173
```

在这里正常用「编辑模式」改标题、正文、缩略图、游戏选择，**修改会自动写入**：

- `data/modules.json`
- `data/games.json`
- `data/categories.json` / `data/rows.json`
- `thumbs/card_xxx.webp`
- `dist/`（自动重建）

然后直接在 VSCode 的「源代码管理」里提交、推送即可。  
关闭启动编辑模式的那个黑色窗口 = 停止服务。

## 只看 / 演示

双击：

```text
打开工具箱.bat
```

或进入 `dist/` 双击 HTML。这个方式只读，改了不会写回 `data/`。

`dist/` 里的 HTML 才是能直接用的工具；`data/`、`thumbs/`、`build.mjs` 是源数据，不是双击打开的。

这个目录是「Git + JSON + 构建」的协作源，不是最终交付的单文件。
最终 HTML 由 `build.mjs` 从 JSON 和缩略图生成，输出到 `dist/`。

## 目录

```text
data/
  modules.json       45 个模块的文字、分类、标签、说明
  categories.json    分类及颜色
  rows.json          行分组
  games.json         游戏项目 + 每个游戏启用了哪些模块
  meta.json          版本、来源、seed
thumbs/
  card_xxx.webp      640×360 缩略图，文件名 = 模块 id
template/
  template.html      应用外壳（含数据占位标记），不要直接改数据
build.mjs            构建脚本
dist/
  商业化模块工具箱编辑器.html   生成结果（可直接双击打开）
tools/
  extract.mjs        一次性从现有 HTML 提取数据，日常不用
```

## 快速开始

需要 Node.js 18+。

```bash
cd D:\Workspace\module-board
node build.mjs .
```

打开：

```text
dist/商业化模块工具箱编辑器.html
```

或：

```bash
npm run build
```

## 备用：不用本地编辑模式时

如果你直接改 `data/` 或 `thumbs/`，改完双击：

```text
publish.bat
```

或命令行：

```powershell
cd D:\Workspace\module-board
.\publish.ps1 -Message "补充广告奖励倍数说明"
```

它做三件事：

1. `node build.mjs .` 重新生成 `dist/`
2. `git add data thumbs dist` + `git commit`
3. 有远程仓库时 `git push`

第一次使用前先配置一次远程（见文末）。如果还没配远程，脚本会只提交到本地并提示你。

拉取同事更新 + 重新构建，双击 `pull.bat`。

## 我在网页里换了缩略图，为什么 publish 没反应？\n\n> 用 `启动编辑模式.bat` 时不会出现这个问题，编辑会自动写入 `thumbs/`。以下针对「直接双击 dist 里的 HTML」的旧方式。

网页里上传的缩略图只存在浏览器 localStorage/IndexedDB，**不会自动写进 `thumbs/`**。  
`publish.bat` 只提交 `data/`、`thumbs/`、`dist/`，所以它看不到网页里的改动。

两种正确做法：

### 做法 A：从网页导出，再导入（推荐）

1. 网页右上角「分享 → 数据与身份 → 导出 JSON」。
2. 把导出的 JSON 文件拖到：

```text
D:\Workspace\module-board\导入网页数据.bat
```

3. 它会执行 `import-state`、重建、提交、push。

注意：这会用网页当前状态覆盖 `data/modules.json`、`data/games.json` 和缩略图；导入前先确认 Git 工作区干净，方便回滚。

### 做法 B：直接替换缩略图文件

把新图转成 640×360 WebP，覆盖：

```text
D:\Workspace\module-board\thumbs\card_reward_choice.webp
```

然后双击 `publish.bat`。

## 日常修改流程

1. 从 `main` 拉分支，例如 `feat/add-reward-multiplier`。
2. 改 `data/modules.json`、`data/games.json`，或替换 `thumbs/<id>.webp`。
3. 运行 `node build.mjs .`。
4. 提交 `data/`、`thumbs/` 和 `dist/` 的变更。
5. 发 PR，评审看 JSON diff 和缩略图，不逐行看生成后的 HTML。
6. 合并后重新构建一次，确保 `dist` 与源数据一致。

## 数据字段

### modules.json

```json
{
  "id": "card_reward_choice",
  "order": 0,
  "title": "奖励选择",
  "rowId": "row_level",
  "categoryId": "cat_ad",
  "tags": ["广告", "付费"],
  "body": ["4选1 / 多选 / 重抽"],
  "note": "PM",
  "desc": "悬停说明：是什么 / 何时用 / 注意"
}
```

规则：

- `id` 一旦发布不要改，改 id = 新模块；旧 id 的缩略图和游戏选择会失效。
- `rowId` / `categoryId` 必须在 `rows.json` / `categories.json` 中存在。
- `order` 是全局排序；新增模块建议放在目标位置的两个 order 之间（如 `5.5`），或重排整表。
- `tags`、`body` 都是字符串数组；`body` 一行一个卡片正文行。
- 缩略图必须是 `thumbs/<id>.webp`，推荐 640×360。

### games.json

```json
{
  "id": "prj_demo",
  "name": "示例游戏",
  "selected": ["card_reward_choice", "card_level_result"],
  "createdAt": "2026-10-28T00:00:00.000Z",
  "updatedAt": "2026-10-28T00:00:00.000Z"
}
```

- 一个游戏一条；`selected` 是该游戏启用的模块 id。
- 未在 `selected` 里的模块 = 未选；不要复制整份模块表到每个游戏。
- 新增游戏直接加一条，`id` 用 `prj_xxx`。

## 从现有应用导入一次

如果某人已经在 HTML 里改过标题/正文/缩略图：

1. 让对方在应用里打开「分享 → 数据与身份 → 导出 JSON」。
2. 执行：

```bash
node tools/import-state.mjs <导出的.json> .
node build.mjs .
```

会把 `cards` 映射到 `data/modules.json`、`projects` 映射到 `data/games.json`，并导出缩略图到 `thumbs/`。  
导入前建议先提交当前仓库，方便回滚。

## 缩略图规范

- 640×360，16:9，WebP，文件名必须是 `<模块id>.webp`。
- 背景按分类：
  - 付费点 / 广告点：暖色淡彩
  - 留存活动 / 内容成长：冷色淡彩
  - 底座能力：紫色淡彩
- 图片里尽量不要出现文字；缩略图显示尺寸只有 164×92.25。

## 冲突规则

- 一个 PR 尽量只改一个模块或一组同主题模块。
- 不要两个人同时改同一个模块的 `title`/`body`/`desc`。
- 两个人同时改不同模块时，Git 通常能自动合并 `modules.json`；合并后必须重新 `node build.mjs .`。
- `dist/` 是生成物，冲突时不要手改，直接以合并后的源数据重新构建。
- 图片冲突：以最终确认的 `thumbs/<id>.webp` 为准，另存旧图到 `thumbs/archive/`（可选）。

## 和现有 HTML 的关系

- `dist/` 里的 HTML 是**发布/演示/离线查看**用的，不是协作源。
- 在 HTML 里直接改的标题、正文、缩略图只存在浏览器 localStorage，不会回写 JSON；下次重新构建/换文件就丢了。
- 正确做法：改 JSON → 构建 → 用生成的 HTML。
- 如果要把某人在浏览器里的编辑带回仓库，让对方在「分享 → 数据与身份」导出 JSON，再人工映射到 `data/modules.json` / `games.json`。

## 当前数据

- 45 个模块
- 6 个分类
- 5 个行分组
- 1 个示例游戏（`prj_demo`）
- 45 张内置缩略图

## 后续可选

- 加 `tools/import-state.mjs`：把应用导出的 JSON 自动拆成 `modules.json` / `games.json` / `thumbs/`。
- 加 CI：PR 时自动跑 `node build.mjs .` + HTML 自检。
- 加发布目录：每次打 tag 时把 `dist` 复制到 `releases/vX.Y.Z/`。

## 远程仓库

已配置：

```text
https://github.com/kimhui1/Commercial-module-toolbox
```

当前分支 `main` 已跟踪 `origin/main`，直接：

```bash
git push
```

即可。缩略图总大小约 0.5MB，不需要 Git LFS。

> 仓库包含内部策划数据和图片，建议在 GitHub 仓库设置里确认是 **Private**。