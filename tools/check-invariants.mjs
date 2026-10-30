/* 只读不变量检查：docs/data.json 的变体结构是否自洽
 * 用法：node tools/check-invariants.mjs [root]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const file = path.join(root, 'docs', 'data.json');
const json = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const state = json.state;

const errors = [];
const cards = state.cards;
const byId = new Map(cards.map(c => [c.id, c]));

// 1) 全部变体模式
const notVariant = cards.filter(c => c.variantMode !== true);
if (notVariant.length) errors.push('未开启 variantMode：' + notVariant.map(c => c.id).join(', '));

// 2) 变体 id 全局唯一
const seen = new Set();
for (const c of cards) {
  for (const v of c.options || []) {
    if (seen.has(v.id)) errors.push('变体 id 重复：' + v.id);
    seen.add(v.id);
    for (const f of v.options || []) {
      if (seen.has(f.id)) errors.push('feat id 重复：' + f.id);
      seen.add(f.id);
    }
  }
}

// 3) 选择集合：不存在的 id、缺父变体
function checkMap(label, map) {
  for (const cid of Object.keys(map || {})) {
    const card = byId.get(cid);
    if (!card) { errors.push(label + ' 指向不存在的模块：' + cid); continue; }
    const ids = new Set(map[cid] || []);
    const valid = new Set();
    for (const v of card.options || []) {
      valid.add(v.id);
      const kids = (v.options || []).map(o => o.id);
      kids.forEach(k => valid.add(k));
      if (kids.some(k => ids.has(k)) && !ids.has(v.id)) {
        errors.push(label + ' 缺父变体：' + card.title + ' / ' + v.title);
      }
    }
    for (const id of ids) if (!valid.has(id)) errors.push(label + ' 含无效 id：' + card.title + ' / ' + id);
  }
}
checkMap('defaults', state.defaults.optionSelections);
for (const p of state.projects || []) checkMap('project:' + p.name, p.optionSelections);

// 4) 统计
let variants = 0, feats = 0, zeroFeat = 0;
for (const c of cards) {
  for (const v of c.options || []) {
    variants++;
    const n = (v.options || []).length;
    feats += n;
    if (!n) zeroFeat++;
  }
}

console.log('cards=' + cards.length + ' 变体=' + variants + ' feat=' + feats + ' 0-feat 变体=' + zeroFeat);
console.log('projects=' + (state.projects || []).length + ' 默认选中模块=' + (state.defaults.selected || []).length);
if (errors.length) {
  console.log('FAIL ' + errors.length);
  errors.slice(0, 40).forEach(e => console.log('  - ' + e));
  process.exitCode = 1;
} else {
  console.log('OK 不变量全部通过');
}
