// Fails unless boundaries reports exactly the lines marked `// violation` in the fixtures (W-02).
import { ESLint } from 'eslint';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

const results = await new ESLint().lintFiles(['boundary-fixtures/projects']);
const key = (file, line) => `${relative(process.cwd(), file)}:${line}`;
const expected = new Set();
const reported = new Map();
for (const { filePath, messages } of results) {
  readFileSync(filePath, 'utf8').split('\n').forEach((text, i) => {
    if (text.trimEnd().endsWith('// violation')) expected.add(key(filePath, i + 1));
  });
  for (const m of messages) {
    if (m.fatal) throw new Error(`${key(filePath, m.line)} ${m.message}`);
    if (m.ruleId?.startsWith('boundaries/')) reported.set(key(filePath, m.line), m.message);
  }
}
const missed = [...expected].filter((k) => !reported.has(k));
const unexpected = [...reported].filter(([k]) => !expected.has(k));
for (const k of missed) console.error(`not reported: ${k}`);
for (const [k, m] of unexpected) console.error(`unexpected: ${k} ${m}`);
console.log(`${expected.size} planted violations, ${reported.size} reported, ${missed.length + unexpected.length} mismatches`);
process.exit(missed.length + unexpected.length || expected.size === 0 ? 1 : 0);
