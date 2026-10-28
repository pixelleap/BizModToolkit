# 商业化模块工具箱 · 协作源（方案 B）

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
cd collab
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

本地已经是一个 Git 仓库（`main` 分支）。推到 GitHub / GitLab / Gitee：

```bash
git remote add origin <私有仓库地址>
git push -u origin main
```

建议用**私有仓库**；缩略图总大小约 0.5MB，不需要 Git LFS。