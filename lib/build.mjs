import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function build(rootArg = '.') {
  const root = path.resolve(rootArg);
  const dataDir = path.join(root, 'data');
  const thumbsDir = path.join(root, 'thumbs');
  const templatePath = path.join(root, 'template', 'template.html');
  const outPath = path.join(root, 'dist', '商业化模块工具箱编辑器.html');

  function readJSON(name) {
    return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
  }
  function fail(msg) { throw new Error(msg); }
  function isStr(v, max = 100000) { return typeof v === 'string' && v.length <= max; }
  function isStrArray(v) { return Array.isArray(v) && v.every(x => typeof x === 'string'); }
  function js(v) { return JSON.stringify(v).replace(/<\/script/gi, '<\\/script'); }
  function findThumb(id) {
    for (const ext of ['.webp', '.png', '.jpg', '.jpeg']) {
      const p = path.join(thumbsDir, id + ext);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
  function mimeOf(file) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.webp') return 'image/webp';
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    return '';
  }

  const modulesRaw = readJSON('modules.json');
  const categories = readJSON('categories.json');
  const rows = readJSON('rows.json');
  const gamesRaw = readJSON('games.json');

  if (!Array.isArray(modulesRaw) || !modulesRaw.length) fail('data/modules.json 必须是非空数组');
  if (!Array.isArray(categories) || !categories.length) fail('data/categories.json 必须是非空数组');
  if (!Array.isArray(rows) || !rows.length) fail('data/rows.json 必须是非空数组');
  if (!Array.isArray(gamesRaw) || !gamesRaw.length) fail('data/games.json 必须至少有一个 game');

  const catIds = new Set(categories.map(c => c.id));
  const rowIds = new Set(rows.map(r => r.id));
  const modules = modulesRaw.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const ids = new Set();
  for (const m of modules) {
    if (!isStr(m.id, 80) || !/^[a-z0-9_]+$/.test(m.id)) fail('模块 id 只能是小写字母/数字/下划线: ' + m.id);
    if (ids.has(m.id)) fail('模块 id 重复: ' + m.id); ids.add(m.id);
    if (!isStr(m.title, 80)) fail(m.id + ' title 无效');
    if (!catIds.has(m.categoryId)) fail(m.id + ' categoryId 不存在: ' + m.categoryId);
    if (!rowIds.has(m.rowId)) fail(m.id + ' rowId 不存在: ' + m.rowId);
    if (!isStrArray(m.tags)) fail(m.id + ' tags 必须是字符串数组');
    if (!isStrArray(m.body)) fail(m.id + ' body 必须是字符串数组');
    if (!isStr(m.desc || '', 2000)) fail(m.id + ' desc 过长');
    if (m.note != null && !isStr(m.note, 80)) fail(m.id + ' note 无效');
    const thumb = findThumb(m.id);
    if (!thumb) fail('缺少缩略图: thumbs/' + m.id + '.(webp|png|jpg)');
  }
  const games = gamesRaw.map((g, i) => {
    const id = String(g.id || ('prj_' + i));
    if (!isStr(g.name, 80)) fail(id + ' name 无效');
    const selected = (Array.isArray(g.selected) ? g.selected : []).filter(x => ids.has(x));
    return { id, name: g.name, selected, createdAt: g.createdAt || new Date().toISOString(), updatedAt: g.updatedAt || new Date().toISOString() };
  });
  if (!games.length) fail('没有有效 game');

  const thumbData = {};
  let thumbBytes = 0;
  for (const m of modules) {
    const file = findThumb(m.id);
    const buf = fs.readFileSync(file);
    thumbBytes += buf.length;
    thumbData[m.id] = 'data:' + mimeOf(file) + ';base64,' + buf.toString('base64');
  }

  const hash = crypto.createHash('sha1')
    .update(JSON.stringify(modules))
    .update(JSON.stringify(games))
    .update(JSON.stringify(categories))
    .update(JSON.stringify(rows))
    .update(Buffer.concat(modules.map(m => fs.readFileSync(findThumb(m.id)))))
    .digest('hex').slice(0, 12);
  const seed = 'collab-' + hash;

  const categoriesCode = 'const CATEGORIES_DEFAULT = ' + js(categories) + ';';
  const rowsCode = 'const ROWS_DEFAULT = ' + js(rows) + ';';
  const cardIdsCode = 'const CARD_IDS = ' + js(modules.map(m => m.id)) + ';';
  const cardsCode = 'const CARDS_DEFAULT = [\n' + modules.map(m => {
    const obj = { row: m.rowId, title: m.title, cat: m.categoryId, note: m.note || '', tags: m.tags, body: m.body };
    return '  ' + js(obj);
  }).join(',\n') + '\n];';
  const descCode = 'const DEFAULT_DESC = ' + js(Object.fromEntries(modules.map(m => [m.id, m.desc || '']))) + ';';
  const thumbsCode = 'const BUILTIN_THUMBS = ' + js(thumbData) + ';';
  const demoCode = 'const DEMO_SELECTED = ' + js(games[0].selected) + ';';
  const projectsCode = 'const BOOT_PROJECTS = ' + js(games) + ';';
  const seedCode = 'const BUILTIN_THUMB_SEED = ' + js(seed) + ';';

  let html = fs.readFileSync(templatePath, 'utf8');
  function replaceBlock(name, code) {
    const re = new RegExp('/\\* __MB_' + name + '_START__ \\*/[\\s\\S]*?/\\* __MB_' + name + '_END__ \\*/');
    if (!re.test(html)) fail('模板缺少标记 ' + name);
    html = html.replace(re, '/* __MB_' + name + '_START__ */\n' + code + '\n/* __MB_' + name + '_END__ */');
  }
  replaceBlock('CATEGORIES_DEFAULT', categoriesCode);
  replaceBlock('ROWS_DEFAULT', rowsCode);
  replaceBlock('CARD_IDS', cardIdsCode);
  replaceBlock('CARDS_DEFAULT', cardsCode);
  replaceBlock('DEFAULT_DESC', descCode);
  replaceBlock('BUILTIN_THUMBS', thumbsCode);
  replaceBlock('DEMO_SELECTED', demoCode);
  replaceBlock('BOOT_PROJECTS', projectsCode);
  replaceBlock('BUILTIN_THUMB_SEED', seedCode);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  return { root, modules: modules.length, games: games.length, thumbs: modules.length, thumbBytes, seed, outPath };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const out = build(process.argv[2] || '.');
    const mb = (fs.statSync(out.outPath).size / 1048576).toFixed(2);
    console.log(`OK modules=${out.modules} games=${out.games} thumbs=${out.thumbs} (${(out.thumbBytes / 1048576).toFixed(2)} MB raw) seed=${out.seed}`);
    console.log(`OUT ${out.outPath} (${mb} MB)`);
  } catch (err) {
    console.error('BUILD FAILED: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}
