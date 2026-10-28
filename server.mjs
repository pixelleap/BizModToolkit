import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const thumbsDir = path.join(root, 'thumbs');
const distDir = path.join(root, 'dist');
const distFile = path.join(distDir, '商业化模块工具箱编辑器.html');
const buildScript = path.join(root, 'build.mjs');
const PORT = 4173;
const HOST = '127.0.0.1';

function log(...args) { console.log(...args); }
function writeJSON(file, value) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  fs.rmSync(file, { force: true });
  fs.renameSync(tmp, file);
}
function cleanId(id) {
  const s = String(id || '');
  if (!/^[a-z0-9_]+$/.test(s)) throw new Error('invalid id: ' + s);
  return s;
}
function writeState(state) {
  if (!state || !Array.isArray(state.cards) || !Array.isArray(state.projects)) {
    throw new Error('state 缺少 cards / projects');
  }
  if (!Array.isArray(state.categories) || !state.categories.length) throw new Error('state 缺少 categories');
  if (!Array.isArray(state.rows) || !state.rows.length) throw new Error('state 缺少 rows');
  const modules = state.cards.map((c, i) => ({
    id: cleanId(c.id),
    order: typeof c.order === 'number' ? c.order : i,
    title: String(c.title || '未命名模块'),
    rowId: String(c.rowId || ''),
    categoryId: String(c.categoryId || 'cat_none'),
    tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
    body: Array.isArray(c.body) ? c.body.map(String) : [],
    note: String(c.note || ''),
    desc: String(c.desc || '')
  })).sort((a, b) => a.order - b.order);
  const categories = state.categories.map((c, i) => ({
    id: String(c.id), name: String(c.name), color: String(c.color || '#94A3B8'), order: typeof c.order === 'number' ? c.order : i
  }));
  const rows = state.rows.map((r, i) => ({
    id: String(r.id), name: String(r.name), order: typeof r.order === 'number' ? r.order : i
  }));
  const games = state.projects.map((p, i) => ({
    id: String(p.id || ('prj_' + i)),
    name: String(p.name || '未命名游戏'),
    selected: Array.isArray(p.selected) ? p.selected.map(String) : [],
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString()
  }));
  writeJSON(path.join(dataDir, 'modules.json'), modules);
  writeJSON(path.join(dataDir, 'categories.json'), categories);
  writeJSON(path.join(dataDir, 'rows.json'), rows);
  writeJSON(path.join(dataDir, 'games.json'), games);
  return { modules: modules.length, games: games.length };
}
function writeImage(id, dataUrl) {
  const cid = cleanId(id);
  const m = String(dataUrl || '').match(/^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) throw new Error('image dataUrl 格式不支持');
  const ext = m[1] === 'image/webp' ? '.webp' : (m[1] === 'image/png' ? '.png' : '.jpg');
  for (const old of ['.webp', '.png', '.jpg', '.jpeg']) fs.rmSync(path.join(thumbsDir, cid + old), { force: true });
  fs.writeFileSync(path.join(thumbsDir, cid + ext), Buffer.from(m[2], 'base64'));
  return cid + ext;
}
function removeImage(id) {
  const cid = cleanId(id);
  for (const old of ['.webp', '.png', '.jpg', '.jpeg']) fs.rmSync(path.join(thumbsDir, cid + old), { force: true });
}
function runBuild() {
  try {
    execFileSync(process.execPath, [buildScript, root], { cwd: root, stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error('构建失败：' + (e && e.message ? e.message : e));
    return false;
  }
}
let buildTimer = null;
let building = false;
let buildPending = false;
function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(function () {
    if (building) { buildPending = true; return; }
    building = true;
    execFile(process.execPath, [buildScript, root], { cwd: root }, function (err) {
      building = false;
      if (err) console.error('自动构建失败：' + err.message);
      else log('已更新 dist/');
      if (buildPending) { buildPending = false; scheduleBuild(); }
    });
  }, 700);
}
function readBody(req, max) {
  return new Promise(function (resolve, reject) {
    let size = 0; const chunks = [];
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > max) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function serveFile(res, file) {
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(file));
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(thumbsDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
log('首次构建 dist ...');
if (!runBuild()) { log('初始构建失败，仍会启动服务；请检查 data/thumbs。'); }

const server = http.createServer(async function (req, res) {
  const url = new URL(req.url, 'http://' + HOST + ':' + PORT);
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      serveFile(res, distFile); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/health') {
      send(res, 200, { ok: true, root: root }); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/state') {
      const raw = await readBody(req, 5 * 1024 * 1024);
      const result = writeState(JSON.parse(raw));
      scheduleBuild();
      send(res, 200, { ok: true, ...result }); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/image') {
      const raw = await readBody(req, 20 * 1024 * 1024);
      const body = JSON.parse(raw);
      const file = writeImage(body.id, body.dataUrl);
      scheduleBuild();
      send(res, 200, { ok: true, file: file }); return;
    }
    if (req.method === 'DELETE' && url.pathname === '/api/image') {
      removeImage(url.searchParams.get('id'));
      scheduleBuild();
      send(res, 200, { ok: true }); return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (e) {
    console.error(e);
    send(res, 400, { ok: false, error: e && e.message ? e.message : String(e) });
  }
});
server.on('error', function (e) {
  if (e && e.code === 'EADDRINUSE') console.error('端口 4173 已被占用，请关掉旧的编辑服务。');
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, HOST, function () {
  const url = 'http://' + HOST + ':' + PORT;
  log('');
  log('==============================================');
  log('  商业化模块工具箱 · 本地编辑模式');
  log('  ' + url);
  log('  修改会自动写入 data/ 和 thumbs/');
  log('  在 VSCode 的源代码管理里提交/推送即可');
  log('  关闭此窗口 = 停止编辑服务');
  log('==============================================');
  log('');
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], function () {});
  }
});