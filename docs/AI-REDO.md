# 奖励模块 · 变体 / feat 改造交接

版本：**4.19.0**（2026-10-30）

## 这一版做了什么

按参考项目的「模块 → 变体 → feat」结构，在奖励模块上做了**结构样板**，并且没有删除「奖励形式」。

### 数据结构

- 卡片新增 `variantMode: true`。开启后：
  - `card.options[]` = **变体**（一级）
  - `variant.options[]` = **feat**（二级）
- 未开启 `variantMode` 的卡片完全维持旧语义（组 = 批量勾选），不影响其余 40 个模块。

### 选中语义（关键）

`project.optionSelections[cardId]` 仍然是一个扁平 id 数组，同时装两类 id：

| 动作 | 写入 |
|---|---|
| 启用变体 | 数组里加入**变体 id** |
| 停用变体 | 移除变体 id，并移除它的全部 feat id |
| 勾选 feat | 加入 feat id；若父变体未启用，自动补上变体 id |
| 全选 feat | 加入变体 id + 该变体全部 feat id |
| 清空 feat | 只移 feat id，**变体保持启用** |

所以「变体已启用」≠「全选 feat」：变体可以启用但 0 个 feat。

### 已改的模块

| 模块 | 变体 | feat |
|---|---|---|
| 游玩前奖励选择 | 4选1 / 重抽 | 4选1: 基础奖励位、广告专属奖励位、VIP专属奖励位、看广告重抽、**随机出奖励**<br>重抽: 看广告重抽、VIP重抽、货币重抽、**固定奖励池** |
| 结算时奖励方式 | 宝箱奖励N选1 / 直接奖励 | 宝箱: VIP专属奖励位、付费专属奖励位、广告领取全部、**随机出奖励**<br>直接: 货币道具资源、看广告双倍、看广告参与倍率小游戏、**固定发放** |
| 奖励形式 | 随机 / 固定（0 feat） | —— |

「奖励形式」**没有删除**，只在截图和备注里标明「迁移中」；它的两个概念已经作为 feat 进了上面两个模块。确认文案无误后可以整卡删除。

加粗的 4 个 feat 是这次从「奖励形式」拆出来并入的。

## 交互表现

- 选择弹窗：每个变体一张卡，左上角复选框 = 变体启用状态，右上角显示 `n / m feat`；变体下方是它的 feat 列表，未启用时整块变灰但仍可点（点 feat 会自动启用父变体）；底部有「全选 feat / 清空 feat」。
- 悬停卡片：同样的变体列表，计数显示 `1 / 2 变体 · 2 / 9 feat`。
- 卡片正面：变体标题在启用时加粗，未启用灰；卡片整体选中态、颜色、统计都跟着变体走。
- 变体没有 feat 时（如「奖励形式」的随机/固定），显示「已启用 / 未启用」，不显示 feat 区。

## 验证方式

本地起静态服务后用无头 Edge 截图（不需要开浏览器窗口）：

```powershell
node tools\serve.cjs 4176
# 首页
& "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --window-size=1440,900 --virtual-time-budget=9000 --screenshot="$PWD\tmp\home.png" `
  "http://127.0.0.1:4176/"
# 弹窗（带预选，方便截图）
... --screenshot="tmp\picker.png" "http://127.0.0.1:4176/?picker=card_level_result&pick=dir_card_level_result_1,opt_ref_card_level_result_1_1"
# 卡片正面 / 悬停层
... "http://127.0.0.1:4176/?demo=variant"
... "http://127.0.0.1:4176/?demo=variant&hover=card_reward_choice"
```

调试参数（仅调试用，线上无副作用）：

| 参数 | 作用 |
|---|---|
| `?picker=<cardId>` | 打开该模块的选择弹窗 |
| `&pick=<id,id>` | 预勾选（配合 picker 截图） |
| `?demo=variant` | 给默认配置勾上 3 个奖励模块的变体，用于看卡片正面与悬停层 |

`tools/serve.cjs` 起静态服务。Electron 版截图脚本在本机跑不起来（启动即崩，0xC0000005），已删，实测一律用 Edge 无头。

## 还没做 / 待确认

1. 其余模块是否也切成 `variantMode`（决定后同一套逻辑直接复用）。
2. 「奖励形式」整卡是否删除、什么时候删。
3. 变体之间的互斥关系（现在是**全部可多选**，没有互斥约束）。
4. 编辑模式里对变体的增删改：目前沿用的是一级/二级选项编辑器，没有专门的「变体」文案。
5. `data/modules.json` 已同步这 3 张卡，其余仍是旧种子；`npm run seed:data` 会覆盖 `docs/data.json`，慎用。
