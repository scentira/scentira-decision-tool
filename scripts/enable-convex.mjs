// Run only after comparing the current D1 state with this same backup.
import './verify-convex-backup.mjs';
import { readFile, writeFile } from 'node:fs/promises';
const original=await readFile('.dev.vars','utf8');
const updated=/^DATA_BACKEND=.*$/m.test(original)?original.replace(/^DATA_BACKEND=.*$/m,'DATA_BACKEND=convex'):`${original.trimEnd()}\nDATA_BACKEND=convex\n`;
await writeFile('.dev.vars',updated);
console.log('App configured for Convex. Original D1 database retained.');
