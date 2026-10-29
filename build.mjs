import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './lib/build.mjs';

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const out = build(process.argv[2] || '.', { seedData: process.argv.includes('--seed-data') });
    const mb = (fs.statSync(out.outPath).size / 1048576).toFixed(2);
    console.log(`OK modules=${out.modules} games=${out.games} thumbs=${out.thumbs} (${(out.thumbBytes / 1048576).toFixed(2)} MB raw) seed=${out.seed}`);
    console.log(`OUT ${out.outPath} (${mb} MB)`);
    console.log(`DATA ${out.dataPath} (${out.wroteData ? 'written' : 'kept'})`);
  } catch (err) {
    console.error('BUILD FAILED: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}