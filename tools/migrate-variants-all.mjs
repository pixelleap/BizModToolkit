/* v4.20.0 迁移：43 张卡全部开启变体模式 + 删除 23 个与真实变体重复的空壳变体
 *
 * 用法：node tools/migrate-variants-all.mjs [root] [--dry]
 *
 * 规则：
 * - 所有卡片 variantMode = true（一级 = 变体，二级 = feat）
 * - 删除清单按 (cardId, 变体标题) 精确匹配，只删「0 feat」的那条
 * - 同步清理 defaults / 各项目 optionSelections 里指向被删变体的 id
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const dry = process.argv.includes('--dry');

const DELETE = [
  ['card_noads', '移除指定广告类型'],
  ['card_energy', '看广告 / 使用金币补充'],
  ['card_energy', '自然恢复'],
  ['card_meta_growth', '属性升级 / 能力解锁'],
  ['card_meta_growth', '付费加速 / 成长基金'],
  ['card_meta_growth', '付费元素 / 属性'],
  ['card_decor', '家园 / 房间 / 地图修复'],
  ['card_decor', '阶段解锁 / 装饰收集'],
  ['card_economy', '固定 / 随机 / 权重奖励'],
  ['card_economy', '货币 / 库存 / 发奖校验'],
  ['card_ad_system', '激励 / 插屏 / 横幅'],
  ['card_ad_system', '频控 / 保护期 / 兜底'],
  ['card_payment', '商品目录 / 订单校验'],
  ['card_payment', '恢复购买 / 订阅状态'],
  ['card_condition', '时间 / 进度 / 人群条件'],
  ['card_condition', '任务计数 / 周期重置'],
  ['card_remote', '模块开关 / 参数 / 分群'],
  ['card_remote', 'A/B 测试 / 灰度发布'],
  ['card_data', '曝光 / 转化 / 收益 / 留存'],
  ['card_data', '实验结论 / 项目适配记录'],
  ['card_compliance', '语言 / 币种 / 时区'],
  ['card_compliance', '隐私 / 年龄 / 市场规则'],
  ['card_album', '进度 / 未解锁预览']
];

function findTarget(card, title) {
  const hits = (card.options || []).filter(function (v) {
    return String(v.title || '').trim() === title && !(v.options || []).length;
  });
  if (!hits.length) return null;
  // 同名的有多个时只删第一个（列表里没有重复项，保险）
  return hits[0];
}

function cleanSelections(map, deletedIds) {
  let removed = 0;
  Object.keys(map).forEach(function (cid) {
    const arr = map[cid];
    if (!Array.isArray(arr)) return;
    const next = arr.filter(function (id) { return !deletedIds.has(id); });
    removed += arr.length - next.length;
    if (next.length) map[cid] = next; else delete map[cid];
  });
  return removed;
}

/* ---------- docs/data.json（线上数据源） ---------- */
{
  const file = path.join(root, 'docs', 'data.json');
  const rawText = fs.readFileSync(file, 'utf8');
  const bom = rawText.charCodeAt(0) === 0xFEFF;
  const json = JSON.parse(rawText.replace(/^\uFEFF/, ''));
  const cards = json.state.cards;

  cards.forEach(function (c) { c.variantMode = true; });

  const deletedIds = new Set();
  const done = [];
  const miss = [];
  DELETE.forEach(function (pair) {
    const card = cards.find(function (c) { return c.id === pair[0]; });
    if (!card) { miss.push(pair.join(' / ') + ' (无此卡)'); return; }
    const v = findTarget(card, pair[1]);
    if (!v) { miss.push(pair.join(' / ') + ' (已不存在)'); return; }
    card.options = card.options.filter(function (x) { return x.id !== v.id; });
    deletedIds.add(v.id);
    done.push(pair[0] + ' / ' + pair[1]);
  });

  const removedDefault = cleanSelections(json.state.defaults.optionSelections || {}, deletedIds);
  let removedProject = 0;
  (json.state.projects || []).forEach(function (p) { removedProject += cleanSelections(p.optionSelections || {}, deletedIds); });

  console.log('[docs/data.json] cards=' + cards.length + ' 全量 variantMode');
  console.log('  删除变体 ' + done.length + '/' + DELETE.length + '，清理选择 defaults=' + removedDefault + ' projects=' + removedProject);
  if (miss.length) miss.forEach(function (m) { console.log('  ! ' + m); });
  if (!dry) fs.writeFileSync(file, (bom ? '\uFEFF' : '') + JSON.stringify(json, null, 2) + '\n', 'utf8');
}

/* ---------- data/modules.json（种子） ---------- */
{
  const file = path.join(root, 'data', 'modules.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.forEach(function (c) { c.variantMode = true; });
  let removed = 0;
  DELETE.forEach(function (pair) {
    const card = json.find(function (c) { return c.id === pair[0]; });
    if (!card) return;
    const v = (card.options || []).find(function (x) {
      return String(x.title || '').trim() === pair[1] && !(x.options || []).length;
    });
    if (!v) return;
    card.options = card.options.filter(function (x) { return x.id !== v.id; });
    removed++;
  });
  console.log('[data/modules.json] cards=' + json.length + ' 全量 variantMode，删除 ' + removed + ' 个变体');
  if (!dry) fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

console.log(dry ? 'DRY RUN' : 'DONE');
