# 商业化模块工具箱 · 桌面版（v2.1）

Windows 桌面程序：一个窗口里编辑 45 个模块，修改直接写入本地 Git 仓库，VSCode 里提交/推送。

## 怎么打开

双击仓库根目录的：

```text
打开工具箱.bat
```

它会启动 `release\商业化模块工具箱.exe`；没有打包版时回退到开发模式（需要先 `npm install`）。

不要再双击 `dist` 里的 HTML 来编辑——那是只读预览，改了不会进 Git。

## 第一次使用

默认工作区：

```text
D:\Workspace\module-board
```

如果路径不存在，程序会弹出文件夹选择器，选择包含以下内容的仓库：

```text
data/modules.json
template/template.html
build.mjs
```

选择结果保存在本机 `.electron-data/workspace.json`，下次自动使用。

### 从旧文件版迁移一次

如果你之前在直接打开的 HTML 里改过数据：

1. 在旧页面「分享 → 数据与身份 → 导出 JSON」
2. 打开桌面版
3. 「分享 → 数据与身份 → 导入 JSON」选择该文件
4. 导入完成即写入 `data/`、`thumbs/` 和 `dist/`

之后不再需要导出/导入。

## 日常编辑

在桌面窗口里用「编辑模式」改：

- 标题、正文、说明、标签
- 缩略图
- 分类颜色
- 游戏选择 / 新建游戏

每次保存会自动：

1. 写 `data/modules.json`、`games.json`、`categories.json`、`rows.json`
2. 写 `thumbs/<card_id>.webp`
3. 重建 `dist/`

然后打开 VSCode 的「源代码管理」：

```text
data/...      已修改
thumbs/...    已修改
dist/...      已修改
```

填写提交信息 → Commit → Push。程序不自动 commit。

## 操作

- 菜单「文件 → 切换工作区」换仓库
- 菜单「文件 → 重新构建」手动重建
- 菜单「文件 → 打开工作区文件夹」
- 关闭窗口即退出
- 第二次双击只聚焦已有窗口，不会多开

顶栏状态：

- `● 桌面版 · 已写入仓库`：正常
- `同步失败 · 修改未写入仓库`：检查工作区权限/磁盘
- 直接打开 `dist` HTML 时显示 `只读 · 未连接仓库`

## 开发与打包

```bash
cd D:\Workspace\module-board
npm install
npm run desktop          # 开发模式
npm run desktop:dist     # 生成 release\商业化模块工具箱-2.1.0.exe
```

打包产物在 `release/`，不提交 Git。

## 数据源

```text
data/modules.json      模块标题/正文/分类/标签/说明
data/games.json        游戏 + 启用的模块
data/categories.json   分类及颜色
data/rows.json         行分组
thumbs/<id>.webp       640×360 缩略图
template/template.html 应用外壳
build.mjs              构建逻辑（可被桌面主进程直接 import）
lib/repo.mjs           读写 data/thumbs + 构建
desktop/main.mjs       Electron 主进程
desktop/preload.cjs    IPC 白名单
```

## 为什么不再用浏览器本地服务

浏览器 `file://` 不能写任意文件；本地服务能写，但会引入 localhost/双入口/端口问题。桌面版通过 Electron IPC 直接写文件，路径唯一、状态明确。

旧 `server.mjs` / `启动编辑模式.bat` 仍保留作备用，但日常请用桌面版。

## 常见问题

**改了没变化？**  
看顶栏是不是 `只读 · 未连接仓库`；是的话你打开的是 `dist` HTML，请改用 `打开工具箱.bat`。

**缩略图没进 Git？**  
桌面版改图会写 `thumbs/<id>.webp`；如果只在旧文件版改，先按「第一次使用」迁移一次。

**VSCode 看不到变化？**  
确认打开的是同一个工作区，且桌面版顶栏是 `已写入仓库`；刷新 VSCode 源代码管理。

**切换工作区后显示旧数据？**  
菜单「文件 → 重新构建」，或重启程序。

## 验证

- 浏览器文件模式 `?selftest=1` / `?uitest=1`：45 / 65 PASS
- 桌面模式：顶栏桌面徽标、无只读条、编辑写入 `data/` / `thumbs/` 已手工验证
- 当前模块：45 个，缩略图 45 张

## 仓库

https://github.com/kimhui1/Commercial-module-toolbox

仓库含内部策划数据，建议保持 Private。