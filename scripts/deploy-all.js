'use strict';
/**
 * End-to-end deploy: GitHub repo + push + Render service + optional custom domain.
 * Uses git credential helper for GitHub (no token printed).
 * Requires RENDER_API_KEY env var for Render steps.
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const REPO = 'shyam1-jpg/menu-creator';
const REPO_URL = `https://github.com/${REPO}.git`;
const SERVICE_NAME = 'menu-creator';
const CUSTOM_DOMAIN = 'menu.kiteline.uk';
const ROOT = path.join(__dirname, '..');

function log(msg) {
  console.log(msg);
}

function httpsJson(method, hostname, urlPath, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname,
        path: urlPath,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'menu-creator-deploy',
          ...(data
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          let parsed = raw;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            /* text */
          }
          resolve({ status: res.statusCode, body: parsed, raw });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function renderApi(method, urlPath, key, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.render.com',
        path: urlPath,
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
          ...(data
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => {
          raw += c;
        });
        res.on('end', () => {
          let parsed = raw;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            /* text */
          }
          if (res.statusCode >= 400) {
            reject(
              new Error(
                `Render API ${res.statusCode}: ${typeof parsed === 'object' ? JSON.stringify(parsed) : raw}`
              )
            );
          } else resolve(parsed);
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getGitHubToken() {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['credential', 'fill'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error('git credential fill failed'));
      const lines = out.split(/\r?\n/);
      let password = '';
      for (const line of lines) {
        const m = line.match(/^password=(.+)$/);
        if (m) password = m[1];
      }
      if (!password) return reject(new Error('No GitHub token in git credential store'));
      resolve(password);
    });
    child.stdin.write('protocol=https\nhost=github.com\n\n');
    child.stdin.end();
  });
}

async function ensureGitHubRepo(token) {
  const check = await httpsJson('GET', 'api.github.com', `/repos/${REPO}`, token);
  if (check.status === 200) {
    log(`GitHub repo exists: https://github.com/${REPO}`);
    return;
  }
  if (check.status !== 404) {
    throw new Error(`GitHub API ${check.status}: ${check.raw}`);
  }
  log('Creating GitHub repo menu-creator…');
  const create = await httpsJson('POST', 'api.github.com', '/user/repos', token, {
    name: 'menu-creator',
    description: 'Menu Creator PWA — printable restaurant menus (Kiteline ecosystem)',
    private: false,
    auto_init: false,
  });
  if (create.status !== 201) {
    throw new Error(`Create repo failed ${create.status}: ${create.raw}`);
  }
  log(`Created: https://github.com/${REPO}`);
}

function runGit(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', shell: true });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
  return r.stdout.trim();
}

async function pushToGitHub() {
  try {
    runGit(['remote', 'get-url', 'origin']);
  } catch {
    runGit(['remote', 'add', 'origin', REPO_URL]);
  }
  runGit(['branch', '-M', 'main']);
  log('Pushing to GitHub…');
  runGit(['push', '-u', 'origin', 'main']);
  log('Push complete.');
}

async function findRenderOwner(key) {
  const owners = await renderApi('GET', '/v1/owners?limit=20', key);
  const list = Array.isArray(owners) ? owners : owners.items || [];
  if (!list.length) throw new Error('No Render owners found');
  const owner = list.find((o) => o.email || o.name) || list[0];
  return owner.id || owner.owner?.id;
}

async function findRenderService(key) {
  const list = await renderApi('GET', '/v1/services?limit=100', key);
  const items = Array.isArray(list) ? list.map((x) => x.service || x) : list.items || [];
  return items.find((s) => (s.name || s.service?.name) === SERVICE_NAME);
}

async function deployRender(key) {
  let svc = await findRenderService(key);
  if (svc) {
    log(`Render service exists: ${svc.id}`);
    log('Triggering deploy…');
    await renderApi('POST', `/v1/services/${svc.id}/deploys`, key, { clearCache: 'do_not_clear' });
    return svc;
  }

  log('Creating Render service from GitHub repo…');
  const ownerId = await findRenderOwner(key);
  svc = await renderApi('POST', '/v1/services', key, {
    type: 'web_service',
    name: SERVICE_NAME,
    ownerId,
    repo: `https://github.com/${REPO}`,
    branch: 'main',
    autoDeploy: 'yes',
    runtime: 'node',
    plan: 'free',
    region: 'frankfurt',
    buildCommand: 'npm install && npm run build',
    startCommand: 'node server.js',
    healthCheckPath: '/',
    envVars: [{ key: 'NODE_ENV', value: 'production' }],
  });
  const created = svc.service || svc;
  log(`Created Render service: ${created.id}`);
  return created;
}

async function addCustomDomain(key, serviceId) {
  try {
    await renderApi('POST', `/v1/services/${serviceId}/custom-domains`, key, {
      name: CUSTOM_DOMAIN,
    });
    log(`Custom domain added: ${CUSTOM_DOMAIN}`);
    log('GoDaddy DNS: CNAME menu → menu-creator.onrender.com (if not already set)');
  } catch (e) {
    if (String(e.message).includes('409') || String(e.message).includes('already')) {
      log(`Custom domain already configured: ${CUSTOM_DOMAIN}`);
    } else {
      log(`Custom domain step skipped: ${e.message}`);
    }
  }
}

async function waitForLive(maxMs = 300000) {
  const url = `https://${SERVICE_NAME}.onrender.com/`;
  const start = Date.now();
  log(`Waiting for ${url} …`);
  while (Date.now() - start < maxMs) {
    try {
      const ok = await new Promise((resolve) => {
        const req = https.get(url, { timeout: 15000 }, (res) => {
          res.resume();
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
      });
      if (ok) {
        log('Service is live!');
        return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  return false;
}

async function main() {
  log('=== Menu Creator deploy ===\n');

  const token = await getGitHubToken();
  await ensureGitHubRepo(token);
  await pushToGitHub();

  const renderKey = process.env.RENDER_API_KEY;
  if (!renderKey) {
    log('\nRENDER_API_KEY not set — GitHub push done.');
    log('Set RENDER_API_KEY and re-run: node scripts/deploy-all.js');
    log('Get key: https://dashboard.render.com/u/settings#api-keys');
    process.exit(2);
  }

  const svc = await deployRender(renderKey);
  const serviceId = svc.id || svc.service?.id;
  if (serviceId) await addCustomDomain(renderKey, serviceId);

  const live = await waitForLive();
  log('\n=== URLs ===');
  log(`https://${SERVICE_NAME}.onrender.com/`);
  log(`https://${SERVICE_NAME}.onrender.com/install.html`);
  log(`https://${SERVICE_NAME}.onrender.com/manifest.json`);
  log(`https://${CUSTOM_DOMAIN}/ (after DNS propagates)`);
  if (!live) log('\nDeploy triggered — may take 2–3 min to go live.');
}

main().catch((e) => {
  console.error('Deploy failed:', e.message);
  process.exit(1);
});
