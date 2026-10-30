/* v4.21.0 合并 / 清理（按 docs/MERGE-REVIEW.md 已确认项，A4 图包商店保留不动）
 *
 * A1 删「奖励形式」
 * A2 「小关卡结构」两个变体搬进「大关卡结构」，删卡
 * A3 「首页背景」两个变体降为 feat，挂到「建造与装饰」新增变体「首页展示」，删卡
 * B1 角色与外观：删 解锁角色 / 角色外观 / 角色属性
 * B2 相册与收藏：删 筛选功能 / 收藏功能
 * B3 内容下载：删 看广告 / 使用货币 / VIP权益
 * B4 迷你内容包：删 购买；任务 → 关卡包下的 feat「任务解锁内容」
 *
 * 用法：node tools/merge-modules.mjs [root] [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const dry = process.argv.includes('--dry');
const dataFile = path.join(root, 'docs', 'data.json');

const rawText = fs.readFileSync(dataFile, 'utf8');
const bom = rawText.charCodeAt(0) === 0xFEFF;
const json = JSON.parse(rawText.replace(/^\uFEFF/, ''));
const state = json.state;
const cards = state.cards;
const byId = new Map(cards.map(c => [c.id, c]));
const log = [];

function dropCard(id) {
  const c = byId.get(id);
  if (!c) return null;
  state.cards = state.cards.filter(x => x.id !== id);
  byId.delete(id);
  log.push('删除模块：' + c.title + '（' + id + '）');
  return c;
}
function dropVariant(cardId, variantId) {
  const c = byId.get(cardId);
  if (!c) return null;
  const v = (c.options || []).find(x => x.id === variantId);
  if (!v) return null;
  c.options = c.options.filter(x => x.id !== variantId);
  log.push('删除变体：' + c.title + ' / ' + v.title);
  return v;
}
function addVariants(cardId, list) {
  const c = byId.get(cardId);
  if (!c) throw new Error('目标模块不存在：' + cardId);
  c.options = (c.options || []).concat(list);
}

/* 选择数据：把某个模块的 key 搬到另一个模块 */
function moveSelectionKey(fromId, toId) {
  let moved = 0;
  const maps = [state.defaults.optionSelections].concat((state.projects || []).map(p => p.optionSelections));
  (state.projects || []).forEach((p, i) => {
    const map = maps[i + 1];
    if (!map || !Array.isArray(map[fromId])) return;
    map[toId] = Array.from(new Set([].concat(map[toId] || [], map[fromId])));
    delete map[fromId];
    moved++;
    const sel = new Set(p.selected || []);
    sel.add(toId);
    p.selected = Array.from(sel);
  });
  const dm = state.defaults.optionSelections;
  if (dm && Array.isArray(dm[fromId])) {
    dm[toId] = Array.from(new Set([].concat(dm[toId] || [], dm[fromId])));
    delete dm[fromId];
    moved++;
    const sel = new Set(state.defaults.selected || []);
    sel.add(toId);
    state.defaults.selected = Array.from(sel);
  }
  if (moved) log.push('选择迁移：' + fromId + ' → ' + toId + '（' + moved + ' 处）');
}

/* ---------- A1 奖励形式 ---------- */
{
  const c = dropCard('card_random_reward');
  if (c) {
    state.defaults.selected = (state.defaults.selected || []).filter(x => x !== c.id);
    (state.projects || []).forEach(p => { p.selected = (p.selected || []).filter(x => x !== c.id); });
    delete state.defaults.optionSelections[c.id];
    (state.projects || []).forEach(p => { delete p.optionSelections[c.id]; });
  }
}

/* ---------- A2 小关卡结构 → 大关卡结构 ---------- */
{
  const src = byId.get('card_n1owjv4amm');
  const host = byId.get('card_level_struct');
  if (src && host) {
    const moved = (src.options || []).slice();
    addVariants('card_level_struct', moved);
    moved.forEach(v => { v.isGroup = true; v.options = v.options || []; });
    dropCard('card_n1owjv4amm');
    moveSelectionKey('card_n1owjv4amm', 'card_level_struct');
    log.push('搬入变体：' + moved.map(v => v.title).join('、') + ' → 大关卡结构');
  }
}

/* ---------- A3 首页背景 → 建造与装饰 / 首页展示 ---------- */
{
  const src = byId.get('card_bg');
  if (src && byId.get('card_decor')) {
    const feats = (src.options || []).map(v => ({
      id: v.id,
      title: v.title,
      desc: String(v.desc || ''),
      categoryId: v.categoryId || src.categoryId || 'cat_none',
      tags: Array.isArray(v.tags) ? v.tags.slice() : [],
      image: null
    }));
    addVariants('card_decor', [{
      id: 'dir_card_decor_home',
      title: '首页展示',
      desc: '把玩家已有的内容放到首页：壁纸，或家园 / 装饰的成果展示。',
      isGroup: true,
      options: feats
    }]);
    dropCard('card_bg');
    moveSelectionKey('card_bg', 'card_decor');
    log.push('搬入 feat：' + feats.map(f => f.title).join('、') + ' → 建造与装饰 / 首页展示');
  }
}

/* ---------- B1 角色与外观 ---------- */
['opt_card_character_0', 'opt_card_character_1', 'opt_fqpt5uv39s'].forEach(id => dropVariant('card_character', id));

/* ---------- B2 相册与收藏 ---------- */
['opt_card_album_0', 'opt_dvvbc812gv'].forEach(id => dropVariant('card_album', id));

/* ---------- B3 内容下载 ---------- */
['opt_card_export_0', 'opt_card_export_1', 'opt_card_export_3'].forEach(id => dropVariant('card_export', id));

/* ---------- B4 迷你内容包 ---------- */
{
  const c = byId.get('card_content_unlock');
  if (c) {
    const task = (c.options || []).find(v => v.id === 'opt_card_content_unlock_0');
    const pkg = (c.options || []).find(v => v.id === 'dir_card_content_unlock_1');
    if (task && pkg) {
      pkg.options = (pkg.options || []).concat([{
        id: task.id,
        title: '任务解锁内容',
        desc: '通过任务进度解锁内容包，而不是直接购买。',
        categoryId: task.categoryId || c.categoryId,
        tags: Array.isArray(task.tags) ? task.tags.slice() : [],
        image: null
      }]);
      log.push('降级为 feat：迷你内容包 / 任务 → 关卡包 / 任务解锁内容');
    }
    dropVariant('card_content_unlock', 'opt_card_content_unlock_0');
  }
  dropVariant('card_content_unlock', 'opt_card_content_unlock_1');
}

/* ---------- 清掉指向已删对象的 id ---------- */
const valid = new Set();
for (const c of state.cards) {
  for (const v of c.options || []) {
    valid.add(v.id);
    for (const f of v.options || []) valid.add(f.id);
  }
}
const cardIds = new Set(state.cards.map(c => c.id));
let dropped = 0;
function clean(map) {
  for (const k of Object.keys(map || {})) {
    if (!cardIds.has(k)) { delete map[k]; continue; }
    const before = map[k].length;
    map[k] = map[k].filter(id => valid.has(id));
    dropped += before - map[k].length;
    if (!map[k].length) delete map[k];
  }
}
clean(state.defaults.optionSelections);
(state.projects || []).forEach(p => {
  clean(p.optionSelections);
  p.selected = (p.selected || []).filter(id => cardIds.has(id) && p.optionSelections[id]);
});
state.defaults.selected = (state.defaults.selected || []).filter(id => cardIds.has(id) && state.defaults.optionSelections[id]);
if (dropped) log.push('清理失效选择 id：' + dropped + ' 个');

log.forEach(l => console.log('· ' + l));
console.log('cards=' + state.cards.length + ' 变体=' + state.cards.reduce((n, c) => n + (c.options || []).length, 0) +
  ' feat=' + state.cards.reduce((n, c) => n + (c.options || []).reduce((m, v) => m + (v.options || []).length, 0), 0));

if (!dry) {
  json.revision = 'pending-rebuild';
  fs.writeFileSync(dataFile, (bom ? '\uFEFF' : '') + JSON.stringify(json, null, 2) + '\n', 'utf8');

  /* 种子同步：受影响模块的 options 直接取自线上结构，删掉的卡同步删 */
  const seedFile = path.join(root, 'data', 'modules.json');
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  const removedCards = ['card_random_reward', 'card_n1owjv4amm', 'card_bg'];
  const keep = seed.filter(c => !removedCards.includes(c.id));
  ['card_level_struct', 'card_decor', 'card_character', 'card_album', 'card_export', 'card_content_unlock'].forEach(id => {
    const live = state.cards.find(c => c.id === id);
    const s = keep.find(c => c.id === id);
    if (live && s) s.options = JSON.parse(JSON.stringify(live.options));
  });
  fs.writeFileSync(seedFile, JSON.stringify(keep, null, 2) + '\n', 'utf8');
  console.log('seed 同步：cards=' + keep.length);
}
console.log(dry ? 'DRY RUN' : 'DONE');
