import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'jewellery-crm', 'src');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (exts.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

function stripConsoles(source) {
  // Remove single-line console calls entirely
  const singleLine = /^[ \t]*console\.(log|warn|error|info|debug)\s*\([^\n]*\);?[ \t]*\r?$/gm;

  // Remove console calls that are followed by comments on same line
  const endComment = /^[ \t]*console\.(log|warn|error|info|debug)\s*\([^\n]*\);?[ \t]*(\/\/.*)?\r?$/gm;

  // Remove multi-line console calls in a simple, cautious way: lines starting with console.(...) until a closing ');'
  // This is a heuristic; it avoids touching other code.
  const multiLine = /^[ \t]*console\.(log|warn|error|info|debug)\s*\([\s\S]*?\);?[ \t]*\r?$/gm;

  let updated = source;
  updated = updated.replace(endComment, '');
  updated = updated.replace(singleLine, '');
  updated = updated.replace(multiLine, '');

  // Clean up leftover blank lines from removals (collapse 3+ blank lines to 2, trim trailing spaces)
  updated = updated.replace(/[\t ]+$/gm, '');
  updated = updated.replace(/\n{3,}/g, '\n\n');

  return updated;
}

async function main() {
  let filesScanned = 0;
  let filesChanged = 0;
  let totalRemovals = 0;

  for await (const file of walk(ROOT)) {
    filesScanned += 1;
    const before = await fs.readFile(file, 'utf8');
    const after = stripConsoles(before);
    if (after !== before) {
      filesChanged += 1;
      // Count removals by diffing console occurrences
      const beforeCount = (before.match(/console\.(log|warn|error|info|debug)\s*\(/g) || []).length;
      const afterCount = (after.match(/console\.(log|warn|error|info|debug)\s*\(/g) || []).length;
      totalRemovals += Math.max(0, beforeCount - afterCount);
      await fs.writeFile(file, after, 'utf8');
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ filesScanned, filesChanged, totalRemovals }, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


