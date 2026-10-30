/* 一次性迁移：把奖励模块改成「变体 → feat」结构
 *
 * - 卡片加 variantMode: true，一级选项 = 变体，二级选项 = feat
 * - 变体补 desc（选中时显示在 picker 里）
 * - 「奖励形式」不删除，它的两个概念拆成 feat 并进两个奖励模块
 *
 * 用法：node tools/migrate-variants.mjs [root] [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const dry = process.argv.includes('--dry');

const VARIANT_DESC = {
  dir_card_reward_choice_0: '开局给出候选奖励，玩家选其中一个。常见做法是 3~4 个候选里选 1；广告 / VIP 用来加候选位或换更好的候选。',
  dir_card_reward_choice_1: '先给一次选择，再让玩家重抽一次。重抽可以挂在广告、VIP 或货币上，本质是把「不满意」变成一次变现机会。',
  dir_card_level_result_1: '结算时用宝箱开出候选奖励，再从里面选。候选数量、可选数量、能否全拿都可以做成付费点。',
  dir_card_level_result_0: '结算直接把奖励发给玩家，不做选择。适合把变现放在「翻倍 / 加成」上，而不是选择环节。',
  opt_0j3wimaz0b: '通关奖励按权重随机掉落，用不确定性制造惊喜。',
  opt_a1ury351jj: '通关固定发放指定奖励，给玩家稳定预期。'
};

function newFeat(id, title, desc, tags) {
  return { id, title, desc: desc || '', categoryId: 'cat_paid', tags: tags || [], image: null };
}

function ensureVariant(card, vid, title, desc) {
  card.options = Array.isArray(card.options) ? card.options : [];
  let v = card.options.find(o => o.id === vid);
  if (!v) {
    v = { id: vid, title, desc: desc || '', isGroup: true, options: [] };
    card.options.push(v);
  }
  v.isGroup = true;
  v.desc = desc || v.desc || '';
  v.options = Array.isArray(v.options) ? v.options : [];
  return v;
}

function addFeat(variant, feat) {
  if (variant.options.some(o => o.id === feat.id)) return false;
  variant.options.push(feat);
  return true;
}

function migrateCard(card, log) {
  if (card.id === 'card_reward_choice') {
    card.variantMode = true;
    const v0 = ensureVariant(card, 'dir_card_reward_choice_0', '4选1', VARIANT_DESC.dir_card_reward_choice_0);
    const v1 = ensureVariant(card, 'dir_card_reward_choice_1', '重抽', VARIANT_DESC.dir_card_reward_choice_1);
    if (addFeat(v0, newFeat('feat_reward_random', '随机出奖励', '候选奖励按权重随机生成，不是固定池。', ['其他']))) log.push('4选1 + feat 随机出奖励');
    if (addFeat(v1, newFeat('feat_reward_fixed', '固定奖励池', '重抽仍从固定池里出，不引入新的随机维度。', ['其他']))) log.push('重抽 + feat 固定奖励池');
  }
  if (card.id === 'card_level_result') {
    card.variantMode = true;
    const v1 = ensureVariant(card, 'dir_card_level_result_1', '宝箱奖励N选1', VARIANT_DESC.dir_card_level_result_1);
    const v0 = ensureVariant(card, 'dir_card_level_result_0', '直接奖励', VARIANT_DESC.dir_card_level_result_0);
    if (addFeat(v1, newFeat('feat_level_random', '随机出奖励', '宝箱里的候选按权重随机，可补保底。', ['其他']))) log.push('宝箱奖励N选1 + feat 随机出奖励');
    if (addFeat(v0, newFeat('feat_level_fixed', '固定发放', '结算固定发指定奖励，不做随机。', ['其他']))) log.push('直接奖励 + feat 固定发放');
  }
  if (card.id === 'card_random_reward') {
    card.variantMode = true;
    card.options = Array.isArray(card.options) ? card.options : [];
    card.options.forEach(o => {
      o.isGroup = true;
      o.options = Array.isArray(o.options) ? o.options : [];
      if (VARIANT_DESC[o.id]) o.desc = VARIANT_DESC[o.id];
    });
    card.desc = '【迁移中】随机 / 固定 已作为 feat 并入「游玩前奖励选择」和「结算时奖励方式」；确认无误后再删除本模块。';
  }
}

// docs/data.json（线上数据源）
let liveCards = null;
{
  const file = path.join(root, 'docs', 'data.json');
  const rawText = fs.readFileSync(file, 'utf8');
  const bom = rawText.charCodeAt(0) === 0xFEFF;
  const json = JSON.parse(rawText.replace(/^\uFEFF/, ''));
  const log = [];
  json.state.cards.forEach(c => migrateCard(c, log));
  liveCards = json.state.cards;
  console.log('[docs/data.json]', log.join(' | ') || 'no change');
  if (!dry) fs.writeFileSync(file, (bom ? '\uFEFF' : '') + JSON.stringify(json, null, 2) + '\n', 'utf8');
}

// data/modules.json（种子）：把这三张卡同步成线上结构，避免 --seed-data 回退
{
  const file = path.join(root, 'data', 'modules.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ids = ['card_reward_choice', 'card_level_result', 'card_random_reward'];
  const changed = [];
  ids.forEach(id => {
    const live = liveCards.find(c => c.id === id);
    const seed = json.find(c => c.id === id);
    if (!live || !seed) return;
    seed.title = live.title;
    seed.tags = live.tags.slice();
    seed.body = live.body.slice();
    seed.desc = live.desc;
    seed.variantMode = true;
    seed.options = JSON.parse(JSON.stringify(live.options));
    changed.push(id);
  });
  console.log('[data/modules.json] synced:', changed.join(', ') || 'none');
  if (!dry) fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

console.log(dry ? 'DRY RUN' : 'DONE');
