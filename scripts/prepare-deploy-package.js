'use strict';
/**
 * Build _site and copy a Netlify Drop–ready folder to the Desktop.
 * Excludes node_modules, .git, server.js, and build tooling.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DESKTOP = path.join(process.env.USERPROFILE || '', 'Desktop');
const DEPLOY_DIR = path.join(DESKTOP, 'Menu-Creator-Deploy');
const ZIP_PATH = path.join(DESKTOP, 'Menu-Creator-Deploy.zip');

const NETLIFY_DROP_TOML = `# Static PWA — no build step for Netlify Drop

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"
`;

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

console.log('Building static site...');
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

const siteDir = path.join(ROOT, '_site');
if (!fs.existsSync(path.join(siteDir, 'index.html'))) {
  console.error('Build failed: _site/index.html missing');
  process.exit(1);
}

console.log('Preparing clean deploy folder...');
rmDir(DEPLOY_DIR);
copyDir(siteDir, DEPLOY_DIR);
fs.writeFileSync(path.join(DEPLOY_DIR, 'netlify.toml'), NETLIFY_DROP_TOML);
fs.writeFileSync(path.join(DEPLOY_DIR, '.nojekyll'), '');

const files = [];
function walk(dir, prefix = '') {
  for (const name of fs.readdirSync(dir)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, rel);
    else files.push(rel);
  }
}
walk(DEPLOY_DIR);

const totalBytes = files.reduce((sum, rel) => {
  return sum + fs.statSync(path.join(DEPLOY_DIR, rel)).size;
}, 0);

console.log('');
console.log('Deploy folder ready:');
console.log(`  ${DEPLOY_DIR}`);
console.log(`  ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KB total`);
console.log('');
console.log('Included:');
files.sort().forEach((f) => console.log(`  - ${f}`));

if (process.platform === 'win32') {
  rmDir(ZIP_PATH);
  const ps = [
    `$src='${DEPLOY_DIR.replace(/'/g, "''")}'`,
    `$zip='${ZIP_PATH.replace(/'/g, "''")}'`,
    'Compress-Archive -Path (Join-Path $src "*") -DestinationPath $zip -Force',
  ].join('; ');
  try {
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
    const zipKb = (fs.statSync(ZIP_PATH).size / 1024).toFixed(1);
    console.log('');
    console.log(`ZIP ready: ${ZIP_PATH} (${zipKb} KB)`);
  } catch (err) {
    console.warn('Could not create ZIP (folder deploy still works):', err.message);
  }
}

console.log('');
console.log('Netlify Drop: drag the FOLDER (not menu-creator root):');
console.log(`  ${DEPLOY_DIR}`);
