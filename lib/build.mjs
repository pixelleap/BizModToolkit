import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function build(rootArg = '.', options = {}) {
  const root = path.resolve(rootArg);
  const dataDir = path.join(root, 'data');
  const thumbsDir = path.join(root, 'thumbs');
  const templatePath = path.join(root, 'template', 'template.html');
  const docsDir = path.join(root, 'docs');
  const outPath = path.join(docsDir, 'index.html');
  const webDataPath = path.join(docsDir, 'data.json');

  function readJSON(name) {
    return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8'));
  }
  function readOptionalJSON(name) {
    try { return JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf8')); } catch { return null; }
  }
  function fail(msg) { throw new Error(msg); }
  function requireVersion(rootDir) {
    try { return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version || '3.0.0'; } catch { return '3.0.0'; }
  }
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
  const defaultsRaw = readOptionalJSON('defaults.json');

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
    // 缺少缩略图时允许构建，使用占位图；避免用户新增模块后整站无法更新。
  }
  const baseline = (defaultsRaw && typeof defaultsRaw === 'object' && !Array.isArray(defaultsRaw))
    ? defaultsRaw
    : (gamesRaw.find(function (g) { return g.name === '绝密行动'; }) || gamesRaw.slice().sort(function (a, b) { return (Array.isArray(b.selected) ? b.selected.length : 0) - (Array.isArray(a.selected) ? a.selected.length : 0); })[0] || {});
  const defaultSelection = {
    selected: (Array.isArray(baseline.selected) ? baseline.selected : []).filter(function (x) { return ids.has(x); }),
    optionSelections: (baseline.optionSelections && typeof baseline.optionSelections === 'object' && !Array.isArray(baseline.optionSelections)) ? baseline.optionSelections : {}
  };
  const games = gamesRaw.map((g, i) => {
    const id = String(g.id || ('prj_' + i));
    if (!isStr(g.name, 80)) fail(id + ' name 无效');
    return { id, name: g.name, selected: defaultSelection.selected.slice(), optionSelections: JSON.parse(JSON.stringify(defaultSelection.optionSelections)), createdAt: g.createdAt || new Date().toISOString(), updatedAt: g.updatedAt || new Date().toISOString() };
  });
  if (!games.length) fail('没有有效 game');

  const thumbData = {};
  const thumbParts = [];
  let thumbBytes = 0;
  for (const m of modules) {
    const file = findThumb(m.id);
    if (file) {
      const buf = fs.readFileSync(file);
      thumbBytes += buf.length;
      thumbData[m.id] = 'data:' + mimeOf(file) + ';base64,' + buf.toString('base64');
      thumbParts.push(buf);
    } else {
      const cat = categories.find(function (c) { return c.id === m.categoryId; }) || { name: '未分类', color: '#94A3B8' };
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="' + String(cat.color || '#D8DEE9') + '"/></linearGradient></defs>' +
        '<rect width="640" height="360" fill="url(#g)"/>' +
        '<text x="320" y="170" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="38" font-weight="700" fill="#334155">' + String(m.title || '').replace(/[<>&]/g, '') + '</text>' +
        '<text x="320" y="218" text-anchor="middle" font-family="Microsoft YaHei, Arial" font-size="18" fill="#64748B">' + String(cat.name || '').replace(/[<>&]/g, '') + ' · 待补充缩略图</text>' +
        '</svg>';
      const data = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
      thumbBytes += Buffer.byteLength(data);
      thumbData[m.id] = data;
      thumbParts.push(Buffer.from(data));
    }
  }

  const hash = crypto.createHash('sha1')
    .update(JSON.stringify(modules))
    .update(JSON.stringify(games))
    .update(JSON.stringify(categories))
    .update(JSON.stringify(rows))
    .update(Buffer.concat(thumbParts))
    .digest('hex').slice(0, 12);
  const seed = 'collab-' + hash;

  const categoriesCode = 'const CATEGORIES_DEFAULT = ' + js(categories) + ';';
  const rowsCode = 'const ROWS_DEFAULT = ' + js(rows) + ';';
  const cardIdsCode = 'const CARD_IDS = ' + js(modules.map(m => m.id)) + ';';
  const cardsCode = 'const CARDS_DEFAULT = [\n' + modules.map(m => {
    const obj = { row: m.rowId, order: m.order, title: m.title, cat: m.categoryId, note: m.note || '', tags: m.tags, body: m.body, options: Array.isArray(m.options) ? m.options : [] };
    return '  ' + js(obj);
  }).join(',\n') + '\n];';
  const descCode = 'const DEFAULT_DESC = ' + js(Object.fromEntries(modules.map(m => [m.id, m.desc || '']))) + ';';
  const thumbsCode = 'const BUILTIN_THUMBS = ' + js(thumbData) + ';';
  const demoCode = 'const DEMO_SELECTED = ' + js(games[0].selected) + ';';
  const defaultSelectionCode = 'const DEFAULT_SELECTION = ' + js(defaultSelection) + ';';
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
  replaceBlock('DEFAULT_SELECTION', defaultSelectionCode);
  replaceBlock('BOOT_PROJECTS', projectsCode);
  replaceBlock('BUILTIN_THUMB_SEED', seedCode);

  fs.mkdirSync(docsDir, { recursive: true });
  const imageMap = {};
  Object.keys(thumbData).forEach(function (id) { imageMap[id] = thumbData[id]; });
  fs.readdirSync(thumbsDir).forEach(function (name) {
    const ext = path.extname(name).toLowerCase();
    if (['.webp', '.png', '.jpg', '.jpeg'].indexOf(ext) < 0) return;
    const id = path.basename(name, ext);
    if (!imageMap[id]) imageMap[id] = 'data:' + mimeOf(name) + ';base64,' + fs.readFileSync(path.join(thumbsDir, name)).toString('base64');
  });
  const webState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: categories,
    rows: rows,
    cards: modules.map(function (m, i) {
      return {
        id: m.id, rowId: m.rowId, order: typeof m.order === 'number' ? m.order : i,
        title: m.title, body: Array.isArray(m.body) ? m.body : [], note: m.note || '',
        tags: Array.isArray(m.tags) ? m.tags : [], categoryId: m.categoryId, customColor: null,
        desc: m.desc || '', options: Array.isArray(m.options) ? m.options : [],
        optionsSeeded: true, shots: [], thumb: null, updatedAt: new Date().toISOString()
      };
    }),
    projects: games,
    defaults: defaultSelection,
    tagPresets: ['付费', '广告', 'VIP', '货币', '资源', '共用能力', '其他'],
    tagColors: {},
    meta: { editorName: '', lastEdit: null, editLog: [], shared: null, deletedCards: [], descSeed: 1, paletteVersion: 2 }
  };
  const revision = crypto.createHash('sha1').update(JSON.stringify(webState)).update(JSON.stringify(imageMap)).digest('hex').slice(0, 16);
  const webData = {
    format: 'module-board-web', schemaVersion: 1, appVersion: requireVersion(root), projectName: (games[0] && games[0].name) || '默认配置',
    revision: revision, exportedAt: new Date().toISOString(), state: webState, images: imageMap
  };
  const shouldWriteData = options.seedData === true || !fs.existsSync(webDataPath);
  if (shouldWriteData) fs.writeFileSync(webDataPath, JSON.stringify(webData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf8');
  fs.writeFileSync(outPath, html, 'utf8');
  return { root, modules: modules.length, games: games.length, thumbs: modules.length, thumbBytes, seed, outPath, dataPath: webDataPath, wroteData: shouldWriteData, dataRevision: revision };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const out = build(process.argv[2] || '.', { seedData: process.argv.includes('--seed-data') });
    const mb = (fs.statSync(out.outPath).size / 1048576).toFixed(2);
    console.log(`OK modules=${out.modules} games=${out.games} thumbs=${out.thumbs} (${(out.thumbBytes / 1048576).toFixed(2)} MB raw) seed=${out.seed}`);
    console.log(`OUT ${out.outPath} (${mb} MB)`);
  } catch (err) {
    console.error('BUILD FAILED: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}
