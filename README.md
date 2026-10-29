# 商业化模块工具箱 · Windows 桌面版

45 个商业化模块的桌面编辑器：改标题、正文、缩略图、游戏选择，修改直接写进本地 Git 仓库，VSCode 里提交。

## 下载安装

打开：

https://github.com/kimhui1/Commercial-module-toolbox/releases/latest

下载：

- `ModuleBoard-Setup-2.4.1.exe`：安装版，推荐
- `ModuleBoard-Portable-2.4.1.exe`：便携版，免安装

安装版会创建：

- 桌面快捷方式「商业化模块工具箱」
- 开始菜单快捷方式

以后直接双击快捷方式启动，**不需要 `.bat`、不需要 localhost、不需要 npm**。

> 安装包没有代码签名，Windows 首次可能提示 SmartScreen：点「更多信息 → 仍要运行」。

## 本地仓库直接启动

本机已经创建桌面快捷方式：

```text
桌面\商业化模块工具箱
```

双击即可，不需要 `.bat`。

仓库里也有同名快捷方式：

```text
D:\Workspace\module-board\商业化模块工具箱.lnk
```

它指向：

```text
D:\Workspace\module-board\release\win-unpacked\商业化模块工具箱.exe
```

开发模式：

```bash
cd D:\Workspace\module-board
npm run desktop
```

## 首次启动

程序优先使用这个 Git 工作区：

```text
D:\Workspace\module-board
```

如果不存在，会使用/创建：

```text
文档\商业化模块工具箱
```

所以别人下载安装后也能直接打开；要协作时，菜单「文件 → 切换工作区」选自己的 Git 仓库。

## 功能选项与红蓝规则

每个模块内部有多个可多选的功能选项：

- 卡片正文显示全部选项
- 已选选项：粗黑
- 未选选项：浅灰 + 删除线
- 鼠标悬停模块：显示选项列表 + 模块说明文字
- 悬停选项：另开独立说明窗，显示选项标题、分类、标签、内容、一张图
- 点击选项：切换选中；选任意选项会自动把模块加入当前游戏
- 点击模块本身：取消/恢复模块选中，已选选项保留
- **没有选中任何选项的模块不能加入当前游戏**
- 取消最后一个选项：自动把模块移出当前游戏

颜色：

- 卡片默认中性灰
- 已选中模块，选项中有付费点 → 红色
- 已选中模块，选项中没有付费点 → 蓝色
- 模块未选中 → 灰色

付费点判定：选项分类为「付费点 / 广告点」，或选项标签含「付费 / VIP / 广告」。

卡片不再显示模块标签、模块说明图。没有选中选项时：正文显示默认字，标签显示全部选项标签；选中选项后：正文按已选/未选样式显示，标签只取已选选项的标签。

检查器「功能选项」里可以逐项修改：

- 标题
- 分类
- 标签
- 内容/说明
- 一张选项图片

> 升级到 2.4.1 时，旧项目中“已选但没有选选项”的模块会被清空选中，需要重新按选项选择。

## 日常编辑

1. 打开桌面程序
2. 编辑模式里改标题、模块说明、缩略图、功能选项、游戏选择
3. 顶栏显示 `● 桌面版 · 已写入仓库`
4. 修改自动写入：
   ```text
   data/modules.json
   data/games.json
   data/categories.json
   data/rows.json
   thumbs/<card_id>.webp
   dist/
   ```
5. VSCode → 源代码管理 → Commit → Push

程序不自动 commit。

## 从旧文件版迁移一次

如果之前在直接打开的 HTML 里改过：

1. 旧页面「分享 → 数据与身份 → 导出 JSON」
2. 桌面版「分享 → 数据与身份 → 导入 JSON」
3. 选择 JSON

之后不再需要导出/导入。

## 开发

```bash
cd D:\Workspace\module-board
npm install
npm run desktop          # 开发模式
npm run desktop:dist     # 生成 release 下的 Setup/Portable
npm run build            # 只构建 dist HTML
```

## 发布新版本

1. 改 `package.json` 的 `version`，例如 `2.4.1`
2. 构建并提交
3. 打标签并推送：

```bash
git tag v2.4.1
git push origin v2.4.1
```

GitHub Actions（`.github/workflows/release.yml`）会自动：

- Windows 上安装依赖
- 构建 NSIS 安装包 + Portable
- 创建 GitHub Release 并上传 exe

## 目录

```text
data/                 模块/游戏/分类/行数据
thumbs/<id>.webp      640×360 缩略图
template/template.html 应用外壳
dist/                 构建产物；桌面程序打开它
build.mjs             构建逻辑
lib/repo.mjs          读写 data/thumbs + 构建
desktop/main.mjs      Electron 主进程
desktop/preload.cjs   IPC 白名单
.github/workflows/release.yml  自动发版
```

## 常见问题

**双击桌面图标没反应？**  
看 Windows SmartScreen 是否拦截；选「更多信息 → 仍要运行」。或试 Portable 版。

**改了没变化？**  
确认打开的是桌面程序，不是 `dist` 里的 HTML；顶栏应显示「桌面版 · 已写入仓库」。

**VSCode 看不到变化？**  
确认工作区是 `D:\Workspace\module-board`，并刷新源代码管理。

**换电脑 / 给别人用？**  
安装 Setup，首次启动会使用 `文档\商业化模块工具箱` 的内置数据；要进 Git 就在「文件 → 切换工作区」选择仓库。

## 验证

- 浏览器文件模式：自检 45 / 交互 65 PASS
- 桌面版：窗口、桌面徽标、编辑写入 `data/`、`thumbs/` 已验证
- 安装包：NSIS + Portable

仓库含内部策划数据，建议保持 Private；Private 后 Release 下载需要 GitHub 登录。