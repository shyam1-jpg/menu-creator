'use strict';
/**
 * Copy PWA assets into _site/ for Render, Netlify, and GitHub Pages.
 * Keeps node_modules and server.js out of the published bundle.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_site');

const FILES = [
  'index.html',
  'install.html',
  'manifest.json',
  'service-worker.js',
  '_redirects',
];

const DIRS = ['icons'];

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT, { recursive: true });

for (const name of FILES) {
  const src = path.join(ROOT, name);
  if (fs.existsSync(src)) copyFile(src, path.join(OUT, name));
}

for (const name of DIRS) {
  const src = path.join(ROOT, name);
  if (fs.existsSync(src)) copyDir(src, path.join(OUT, name));
}

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('Static site ready: _site/');
