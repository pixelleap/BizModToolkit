import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
const root = path.resolve(process.argv[3] || '.');
if (!input) {
  console.error('usage: node tools/import-state.mjs <exported.json> <collab-dir>');
  process.exit(1);
}
const state = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!state || !Array.isArray(state.cards) || !Array.isArray(state.projects)) {
  console.error('不是应用导出的 JSON：缺少 cards / projects');
  process.exit(1);
}
const dataDir = path.join(root, 'data');
const thumbsDir = path.join(root, 'thumbs');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(thumbsDir, { recursive: true });

const images = state.images && typeof state.images === 'object' ? state.images : {};
const extOf = { 'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg' };
const modules = [];
const warnings = [];
for (const c of state.cards) {
  const id = String(c.id || '');
  if (!/^[a-z0-9_]+$/.test(id)) throw new Error('非法模块 id: ' + id);
  const thumb = c.thumb && c.thumb.id ? images[c.thumb.id] : null;
  if (thumb && /^data:image\//.test(thumb)) {
    const m = thumb.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
    if (!m || !extOf[m[1]]) throw new Error(id + ' 缩略图格式不支持: ' + (m ? m[1] : 'unknown'));
    const ext = extOf[m[1]];
    for (const old of ['.webp', '.png', '.jpg', '.jpeg']) {
      const p = path.join(thumbsDir, id + old);
      if (fs.existsSync(p)) fs.rmSync(p);
    }
    fs.writeFileSync(path.join(thumbsDir, id + ext), Buffer.from(m[2], 'base64'));
  } else {
    const exists = ['.webp', '.png', '.jpg', '.jpeg'].some(ext => fs.existsSync(path.join(thumbsDir, id + ext)));
    if (!exists) warnings.push(id + ' 没有缩略图');
  }
  modules.push({
    id,
    order: typeof c.order === 'number' ? c.order : modules.length,
    title: String(c.title || '未命名模块'),
    rowId: String(c.rowId || ''),
    categoryId: String(c.categoryId || 'cat_none'),
    tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
    body: Array.isArray(c.body) ? c.body.map(String) : [],
    note: String(c.note || ''),
    desc: String(c.desc || '')
  });
}
modules.sort((a, b) => a.order - b.order);

const categories = Array.isArray(state.categories) ? state.categories.map((c, i) => ({
  id: String(c.id), name: String(c.name), color: String(c.color || '#94A3B8'), order: typeof c.order === 'number' ? c.order : i
})) : null;
const rows = Array.isArray(state.rows) ? state.rows.map((r, i) => ({
  id: String(r.id), name: String(r.name), order: typeof r.order === 'number' ? r.order : i
})) : null;
const games = state.projects.map((p, i) => ({
  id: String(p.id || ('prj_' + i)),
  name: String(p.name || '未命名游戏'),
  selected: Array.isArray(p.selected) ? p.selected.map(String) : [],
  createdAt: p.createdAt || new Date().toISOString(),
  updatedAt: p.updatedAt || new Date().toISOString()
}));

fs.writeFileSync(path.join(dataDir, 'modules.json'), JSON.stringify(modules, null, 2) + '\n', 'utf8');
if (categories) fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2) + '\n', 'utf8');
if (rows) fs.writeFileSync(path.join(dataDir, 'rows.json'), JSON.stringify(rows, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'games.json'), JSON.stringify(games, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(dataDir, 'meta.json'), JSON.stringify({
  name: '商业化模块工具箱',
  version: state.appVersion || '2.0.0',
  source: path.basename(input),
  importedAt: new Date().toISOString()
}, null, 2) + '\n', 'utf8');
console.log(`imported modules=${modules.length} games=${games.length} thumbs=${modules.length - warnings.length}`);
if (warnings.length) {
  console.warn('WARN:');
  for (const w of warnings) console.warn(' - ' + w);
}
console.log('NEXT: node build.mjs .');