# 变体 / feat 改造交接

当前版本：**v4.21.0**（2026-10-30）
线上：https://pixelleap.github.io/BizModToolkit/

## 现在的结构

**40 个模块 / 156 变体 / 436 feat**，全部是「模块 → 变体 → feat」：

- `card.options[]` = 变体（一级），`variant.options[]` = feat（二级）
- 卡片带 `variantMode: true`；未带这个字段的旧数据按 legacy 语义渲染（兜底用，线上已无这种卡）
- 变体有独立启用状态：启用 ≠ 全选 feat，变体可以启用但 0 个 feat
- 变体之间**不互斥**
- 0-feat 的变体是合法形态（原子变体），弹窗里只显示「已启用 / 未启用」。现在剩 15 个

## 选中语义

`project.optionSelections[cardId]` 是扁平 id 数组，同时装变体 id 与 feat id：

| 动作 | 写入 |
|---|---|
| 启用变体 | 加入变体 id |
| 停用变体 | 移除变体 id，并连带移除它的 feat |
| 勾 feat | 加入 feat id；父变体没启用时自动补上 |
| 全选 feat | 变体 id + 该变体全部 feat |
| 清空 feat | 只移除 feat，变体保持启用 |

**数据自愈**：`normalizeState()` 末尾跑 `repairVariantSelections()`，老数据 / 外部导入 / 分享文件里「有 feat 没父变体」都会自动补；`importJSON()` 里也调了一次。仓库数据另有 `tools/repair-selections.mjs`。

## v4.21.0：模块合并与清理

按 [`MERGE-REVIEW.md`](MERGE-REVIEW.md) 的确认结果执行（**A4 图包商店按决定保留，未并入商城**）：

| 动作 | 结果 |
|---|---|
| 删「奖励形式」 | 随机 / 固定 早已是两个奖励模块的 feat |
| 「小关卡结构」并入「大关卡结构」 | 4 个原子变体：线性 / 非线性·无限 / 单阶段 / 多阶段 |
| 「首页背景」并入「建造与装饰」 | 新增变体「首页展示」，2 个 feat：壁纸展示 / 建造与装饰展示 |
| 角色与外观 | 删 解锁角色 / 角色外观 / 角色属性（8 → 5 变体） |
| 相册与收藏 | 删 筛选功能 / 收藏功能（7 → 5 变体） |
| 内容下载 | 删 看广告 / 使用货币 / VIP权益（7 → 4 变体） |
| 迷你内容包 | 删「购买」；「任务」→ 关卡包下的 feat「任务解锁内容」（8 → 6 变体） |

删掉的 3 张卡的缩略图移到 `thumbs/archive/`。变体转 feat 时**保留原 id**，所以历史勾选不失效。

## v4.20.0：全量切变体

- 43 张卡全部 `variantMode`，编辑器文案统一成「变体 / feat」
- 删除 23 个由旧正文自动生成、与真实变体重复的空壳变体
- 修 bug：删变体残留 id、删最后一个 feat 连变体一起删、自检底座断言误报、`autoCategoryId()` 忽略变体 tags
- `lib/build.mjs` webState 补 `variantMode`

## 剩余 15 个原子变体

图包商店 3（**保留独立模块**）、免费宝箱 3、大关卡结构 4、还有各模块里的「免费提示」「低等级/高等级」「挑战次数限制」「看主动广告后禁用」这类。

## 关于「图包商店」

用户决定：**不并入商城**，保留为独立模块（3 个原子变体：限时特价 / 捆绑特价 / 单卖）。以后要合并时注意：它的三种是"卖法"，适合降为 feat 挂在一个「图包货架」变体下。

## 验证

```powershell
node tools\check-invariants.mjs .        # 结构不变量（必须 OK）
node tools\serve.cjs 4176                # 本地预览
npm run build                            # 改模板 / 构建脚本后
msedge --headless=new --dump-dom "http://127.0.0.1:4176/?selftest=1"   # 自检
```

调试参数：`?picker=<cardId>`、`&pick=<id,id>`、`?demo=variant`、`?hover=<cardId>`、`?selftest=1`、`?uitest=1`。

工具脚本（`tools/`）：

| 脚本 | 用途 |
|---|---|
| `check-invariants.mjs` | 只读检查：全变体、id 唯一、无失效/缺父选择 |
| `repair-selections.mjs` | 把 data.json 的缺父变体补上 |
| `migrate-variants-all.mjs` | v4.20 的全量切换（留档，勿重跑） |
| `merge-modules.mjs` | v4.21 的合并（留档，勿重跑） |
| `extract-test.mjs` | 从 `--dump-dom` 结果里抽自检文本 |

## 已知问题（历史遗留，非本版引入）

`?selftest=1` 有 10 条失败、`?uitest=1` 有 18 条失败，与 v4.19.0 基线完全一致（用 `git worktree` 对比过），是过期断言，需要单独一轮清理。

## 下次会话建议

> 读 docs/AI-REDO.md 和 docs/MERGE-REVIEW.md。下一步可选：清 selftest/uitest 历史失败；或继续按业务把剩下的原子变体归并。

## v4.22.0 之后待办

`docs/LIBRARY-AUDIT.md`（模组库 vs 功能清单审计）和 **`docs/TAG-REVIEW-v2.md`**（选项级标签，逐条人工标注，13 词表）已产出，**都还没执行**。旧的 `TAG-REVIEW.md` 已废弃（关键词规则那版）。

等确认后：

1. 按 AUDIT 的 A 类删/改名 9 个变体、按 B 类并 4 张卡
2. 按 TAG-REVIEW-v2 把 436 条 feat 标签换成 13 词表（`其他` 退役）

工具：`node tools/tag-plan-v2.mjs` 重新生成 TAG-REVIEW-v2（改 docs/data.json 后要重跑）。
