/* 修 docs/data.json 里的选择：feat 选了但父变体没启用 → 补上父变体 id，并清掉无效 id
 * 用法：node tools/repair-selections.mjs [root] [--dry]
 * 与模板里的 repairVariantSelections() 同一条规则；日常数据由应用加载时自动修，
 * 这个脚本只是让仓库里的 data.json 自身也是干净的。
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const dry = process.argv.includes('--dry');
const file = path.join(root, 'docs', 'data.json');
const rawText = fs.readFileSync(file, 'utf8');
const bom = rawText.charCodeAt(0) === 0xFEFF;
const json = JSON.parse(rawText.replace(/^\uFEFF/, ''));
const cards = json.state.cards;

function repair(map) {
  let added = 0, dropped = 0;
  for (const cid of Object.keys(map || {})) {
    const card = cards.find(c => c.id === cid);
    if (!card) { delete map[cid]; continue; }
    const set = new Set(Array.isArray(map[cid]) ? map[cid] : []);
    const valid = new Set();
    for (const v of card.options || []) {
      valid.add(v.id);
      const kids = (v.options || []).map(o => o.id);
      kids.forEach(k => valid.add(k));
      if (kids.some(k => set.has(k)) && !set.has(v.id)) { set.add(v.id); added++; }
    }
    const out = [...set].filter(id => valid.has(id));
    dropped += set.size - out.length;
    if (out.length) map[cid] = out; else delete map[cid];
  }
  return { added, dropped };
}

const a = repair(json.state.defaults.optionSelections);
let b = { added: 0, dropped: 0 };
for (const p of json.state.projects || []) {
  const r = repair(p.optionSelections);
  b.added += r.added; b.dropped += r.dropped;
}
// projects.selected 补上有选择的模块
for (const p of json.state.projects || []) {
  const sel = new Set(p.selected || []);
  const before = sel.size;
  Object.keys(p.optionSelections || {}).forEach(cid => sel.add(cid));
  if (sel.size !== before) p.selected = [...sel];
}

console.log('defaults +' + a.added + ' -' + a.dropped + ' / projects +' + b.added + ' -' + b.dropped);
if (!dry) fs.writeFileSync(file, (bom ? '\uFEFF' : '') + JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(dry ? 'DRY RUN' : 'DONE');
