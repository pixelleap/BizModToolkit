import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = process.argv[2];
const outDir = process.argv[3];
if (!htmlPath || !outDir) {
  console.error('usage: node extract.mjs <html> <collab-dir>');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');

function sliceConst(name, closer) {
  const start = html.indexOf(`const ${name} =`);
  if (start < 0) throw new Error(`missing const ${name}`);
  if (closer === ';') {
    const end = html.indexOf(';', start);
    if (end < 0) throw new Error(`missing end for ${name}`);
    return html.slice(start, end + 1);
  }
  const end = html.indexOf(`\n${closer}`, start);
  if (end < 0) throw new Error(`missing end for ${name}`);
  return html.slice(start, end + 1 + closer.length);
}
const blocks = [
  sliceConst('CATEGORIES_DEFAULT', '];'),
  sliceConst('ROWS_DEFAULT', '];'),
  sliceConst('CARD_IDS', '];'),
  sliceConst('CARDS_DEFAULT', '];'),
  sliceConst('DEFAULT_DESC', '};'),
  sliceConst('BUILTIN_THUMBS', '};'),
  sliceConst('DEMO_SELECTED', ';'),
  sliceConst('BOOT_PROJECTS', ';'),
  sliceConst('BUILTIN_THUMB_SEED', ';'),
];
const context = {};
vm.createContext(context);
const data = vm.runInContext(blocks.join('\n') + '\n;({CATEGORIES_DEFAULT,ROWS_DEFAULT,CARD_IDS,CARDS_DEFAULT,DEFAULT_DESC,BUILTIN_THUMBS,DEMO_SELECTED,BOOT_PROJECTS,BUILTIN_THUMB_SEED})', context);

const now = new Date().toISOString();
const modules = data.CARD_IDS.map((id, i) => {
  const c = data.CARDS_DEFAULT[i];
  return {
    id,
    order: i,
    title: c.title,
    rowId: c.row,
    categoryId: c.cat,
    tags: c.tags || [],
    body: c.body || [],
    note: c.note || '',
    desc: data.DEFAULT_DESC[id] || ''
  };
});
const categories = data.CATEGORIES_DEFAULT.map((c, i) => ({ id: c.id, name: c.name, color: c.color, order: i }));
const rows = data.ROWS_DEFAULT.map((r, i) => ({ id: r.id, name: r.name, order: i }));
const games = [{ id: 'prj_demo', name: '示例游戏', selected: data.DEMO_SELECTED.slice(), createdAt: now, updatedAt: now }];

const dataDir = path.join(outDir, 'data');
const thumbsDir = path.join(outDir, 'thumbs');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(thumbsDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'modules.json'), JSON.stringify(modules, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'rows.json'), JSON.stringify(rows, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'games.json'), JSON.stringify(games, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'meta.json'), JSON.stringify({
  name: '商业化模块工具箱',
  version: '2.0.0',
  source: '商业化模块工具箱编辑器.html',
  seed: data.BUILTIN_THUMB_SEED,
  exportedAt: now
}, null, 2) + '\n', 'utf8');

let count = 0;
for (const m of modules) {
  const url = data.BUILTIN_THUMBS[m.id];
  if (!url || !url.startsWith('data:image/')) throw new Error(`missing thumb ${m.id}`);
  const b64 = url.slice(url.indexOf(',') + 1);
  fs.writeFileSync(path.join(thumbsDir, m.id + '.webp'), Buffer.from(b64, 'base64'));
  count++;
}
console.log(`extracted modules=${modules.length} thumbs=${count} categories=${categories.length} rows=${rows.length}`);