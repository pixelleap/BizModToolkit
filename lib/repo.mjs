import fs from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';

export function validateId(id) {
  const s = String(id || '');
  if (!/^[a-z0-9_]+$/.test(s)) throw new Error('invalid id: ' + s);
  return s;
}
export function workspaceInfo(root) {
  const r = path.resolve(root);
  const required = ['data/modules.json', 'data/categories.json', 'data/rows.json', 'data/games.json', 'template/template.html', 'build.mjs'];
  const missing = required.filter(function (rel) { return !fs.existsSync(path.join(r, rel)); });
  return { root: r, valid: missing.length === 0, missing: missing };
}
function writeJSON(file, value) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.rmSync(file, { force: true });
  fs.renameSync(tmp, file);
}
export function writeState(root, state) {
  const r = path.resolve(root);
  if (!state || !Array.isArray(state.cards) || !Array.isArray(state.projects)) {
    throw new Error('state 缺少 cards / projects');
  }
  if (!Array.isArray(state.categories) || !state.categories.length) throw new Error('state 缺少 categories');
  if (!Array.isArray(state.rows) || !state.rows.length) throw new Error('state 缺少 rows');
  const modules = state.cards.map(function (c, i) {
    return {
      id: validateId(c.id),
      order: typeof c.order === 'number' ? c.order : i,
      title: String(c.title || '未命名模块'),
      rowId: String(c.rowId || ''),
      categoryId: String(c.categoryId || 'cat_none'),
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
      body: Array.isArray(c.body) ? c.body.map(String) : [],
      note: String(c.note || ''),
      desc: String(c.desc || ''),
      options: Array.isArray(c.options) ? c.options.map(function (o) {
        return {
          id: validateId(o.id),
          title: String(o.title || '未命名选项'),
          categoryId: String(o.categoryId || 'cat_none'),
          tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
          desc: String(o.desc || ''),
          image: (o.image && typeof o.image === 'object' && typeof o.image.id === 'string') ? {
            id: validateId(o.image.id),
            mime: String(o.image.mime || 'image/webp'),
            w: Math.max(0, Number(o.image.w) || 0),
            h: Math.max(0, Number(o.image.h) || 0),
            updatedAt: o.image.updatedAt || new Date().toISOString()
          } : null
        };
      }) : []
    };
  }).sort(function (a, b) { return a.order - b.order; });
  const categories = state.categories.map(function (c, i) {
    return { id: String(c.id), name: String(c.name), color: String(c.color || '#94A3B8'), order: typeof c.order === 'number' ? c.order : i };
  });
  const rows = state.rows.map(function (row, i) {
    return { id: String(row.id), name: String(row.name), order: typeof row.order === 'number' ? row.order : i };
  });
  const defaults = {
    selected: (state.defaults && Array.isArray(state.defaults.selected)) ? state.defaults.selected.map(String) : [],
    optionSelections: (state.defaults && state.defaults.optionSelections && typeof state.defaults.optionSelections === 'object' && !Array.isArray(state.defaults.optionSelections)) ? state.defaults.optionSelections : {}
  };
  const games = state.projects.map(function (p, i) {
    return {
      id: String(p.id || ('prj_' + i)),
      name: String(p.name || '未命名游戏'),
      selected: defaults.selected.slice(),
      optionSelections: JSON.parse(JSON.stringify(defaults.optionSelections)),
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString()
    };
  });
  writeJSON(path.join(r, 'data', 'modules.json'), modules);
  writeJSON(path.join(r, 'data', 'categories.json'), categories);
  writeJSON(path.join(r, 'data', 'rows.json'), rows);
  writeJSON(path.join(r, 'data', 'games.json'), games);
  writeJSON(path.join(r, 'data', 'defaults.json'), defaults);
  return { modules: modules.length, games: games.length };
}
export function writeImage(root, id, dataUrl) {
  const r = path.resolve(root);
  const cid = validateId(id);
  const m = String(dataUrl || '').match(/^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) throw new Error('image dataUrl 格式不支持');
  const ext = m[1] === 'image/webp' ? '.webp' : (m[1] === 'image/png' ? '.png' : '.jpg');
  const dir = path.join(r, 'thumbs');
  fs.mkdirSync(dir, { recursive: true });
  for (const old of ['.webp', '.png', '.jpg', '.jpeg']) fs.rmSync(path.join(dir, cid + old), { force: true });
  fs.writeFileSync(path.join(dir, cid + ext), Buffer.from(m[2], 'base64'));
  return cid + ext;
}
export function removeImage(root, id) {
  const r = path.resolve(root);
  const cid = validateId(id);
  for (const old of ['.webp', '.png', '.jpg', '.jpeg']) fs.rmSync(path.join(r, 'thumbs', cid + old), { force: true });
}
export function buildRepo(root) {
  return build(path.resolve(root));
}
