/* 把 tools/tag-plan-v2.mjs 里人工标注的标签写进数据
 * - docs/data.json  436 条 feat 标签 + tagPresets + 卡片标签换词表
 * - data/modules.json 同步
 * - card_level_struct 改名「关卡结构」
 * 用法：node tools/apply-tags.mjs [--dry]
 */
import fs from 'node:fs';
import { M } from './tag-plan-v2.mjs';

const dry = process.argv.includes('--dry');
const VOCAB = ['广告', '付费', '免费', '货币', '消耗', '留存', '成长', '收集', '内容', '合规', '基础', '配置', '展示'];
const CARD_TAG_MAP = { 'VIP': '付费', '共用能力': '基础', '资源': '消耗' };
const RENAME = { card_level_struct: '关卡结构' };

function mapCardTags(tags) {
  const out = [];
  for (const t of tags || []) {
    if (t === '其他') continue;
    const v = CARD_TAG_MAP[t] || t;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function apply(cards, log) {
  let feats = 0, changed = 0, cardsRenamed = 0, cardTags = 0;
  for (const card of cards) {
    if (RENAME[card.id] && card.title !== RENAME[card.id]) {
      log.push('改名：' + card.title + ' → ' + RENAME[card.id]);
      card.title = RENAME[card.id];
      cardsRenamed++;
    }
    const before = (card.tags || []).join('|');
    card.tags = mapCardTags(card.tags);
    if ((card.tags || []).join('|') !== before) cardTags++;

    for (const v of card.options || []) {
      const map = M[card.id + '|' + v.title];
      for (const f of v.options || []) {
        feats++;
        const hit = map && map.find(x => x[0] === f.title);
        if (!hit) { log.push('! 未覆盖：' + card.id + ' / ' + v.title + ' / ' + f.title); continue; }
        const next = hit[1];
        if ((f.tags || []).slice().sort().join('|') !== next.slice().sort().join('|')) changed++;
        f.tags = next.slice();
      }
    }
  }
  return { feats, changed, cardsRenamed, cardTags };
}

/* docs/data.json */
{
  const file = 'docs/data.json';
  const raw = fs.readFileSync(file, 'utf8');
  const bom = raw.charCodeAt(0) === 0xFEFF;
  const json = JSON.parse(raw.replace(/^\uFEFF/, ''));
  const log = [];
  const r = apply(json.state.cards, log);
  const before = (json.state.tagPresets || []).join(',');
  json.state.tagPresets = VOCAB.slice();
  log.push('tagPresets: [' + before + '] → [' + VOCAB.join(',') + ']');
  log.forEach(l => console.log('· ' + l));
  console.log('[data.json] feat=' + r.feats + ' 标签变化=' + r.changed + ' 改名=' + r.cardsRenamed + ' 卡片标签变化=' + r.cardTags);
  if (!dry) fs.writeFileSync(file, (bom ? '\uFEFF' : '') + JSON.stringify(json, null, 2) + '\n', 'utf8');
}

/* data/modules.json */
{
  const file = 'data/modules.json';
  const cards = JSON.parse(fs.readFileSync(file, 'utf8'));
  const log = [];
  const r = apply(cards, log);
  console.log('[modules.json] feat=' + r.feats + ' 标签变化=' + r.changed + ' 改名=' + r.cardsRenamed + ' 卡片标签变化=' + r.cardTags);
  if (!dry) fs.writeFileSync(file, JSON.stringify(cards, null, 2) + '\n', 'utf8');
}

console.log(dry ? 'DRY RUN' : 'DONE');
