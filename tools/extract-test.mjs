/* 从 Edge --dump-dom 的 HTML 里抽出 <pre id="selftestOut|uitestOut"> 文本，写到 UTF-8 文件 */
import fs from 'node:fs';

const src = process.argv[2];
const out = process.argv[3];
const html = fs.readFileSync(src, 'utf8');
const m = html.match(/<pre id="(selftestOut|uitestOut)"[^>]*>([\s\S]*?)<\/pre>/);
if (!m) { console.log('NOT FOUND'); process.exit(1); }
const text = m[2]
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');
fs.writeFileSync(out, text, 'utf8');
const lines = text.split('\n');
const fails = lines.filter(l => /FAIL/.test(l));
console.log('lines=' + lines.length + ' fail=' + fails.length);
console.log(fails.join('\n'));
