import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');

const patterns = [
  /(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
  /(import\s+['"])(\.{1,2}\/[^'"]+)(['"])/g,
  /(import\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g,
];

const hasRuntimeExtension = (s) =>
  s.endsWith('.js') ||
  s.endsWith('.mjs') ||
  s.endsWith('.cjs') ||
  s.endsWith('.json') ||
  s.endsWith('.node');

const isBare = (s) => s.startsWith('.') && !hasRuntimeExtension(s);

const resolveSpecifier = (specifier, filePath) => {
  if (!isBare(specifier)) return specifier;
  const dir = path.dirname(filePath);
  const abs = path.resolve(dir, specifier);
  if (existsSync(`${abs}.js`)) return `${specifier}.js`;
  if (existsSync(path.join(abs, 'index.js'))) return `${specifier}/index.js`;
  return specifier;
};

const fixFile = async (filePath) => {
  const original = await readFile(filePath, 'utf8');
  let next = original;
  for (const rx of patterns) {
    next = next.replace(
      rx,
      (_m, a, spec, b) => `${a}${resolveSpecifier(spec, filePath)}${b}`
    );
  }
  if (next !== original) await writeFile(filePath, next, 'utf8');
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      if (e.isFile() && p.endsWith('.js')) return fixFile(p);
    })
  );
};

if (existsSync(root)) await walk(root);
