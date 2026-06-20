'use strict';
/**
 * Repair Menu Creator on Render (no-server / 404 at onrender.com).
 * Requires RENDER_API_KEY from https://dashboard.render.com/u/settings#api-keys
 *
 * Usage:
 *   set RENDER_API_KEY=your_key
 *   node scripts/fix-render-deploy.js
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-d8oagn8k1i2s738d7fc0';
const SERVICE_NAME = 'menu-creator';
const REPO = 'https://github.com/shyam1-jpg/menu-creator';
const ROOT = path.join(__dirname, '..');

const STATIC_SITE_DETAILS = {
  plan: 'free',
  region: 'frankfurt',
  renderSubdomainPolicy: 'enabled',
  envSpecificDetails: {
    buildCommand: 'npm install && npm run build',
    publishPath: '_site',
  },
};

const WEB_SERVICE_DETAILS = {
  runtime: 'node',
  plan: 'free',
  region: 'frankfurt',
  healthCheckPath: '/',
  renderSubdomainPolicy: 'enabled',
  envSpecificDetails: {
    buildCommand: 'npm install && npm run build',
    startCommand: 'npm start',
  },
};

function log(msg) {
  console.log(msg);
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

function unwrapService(payload) {
  return payload?.service || payload || null;
}

function serviceUrl(name) {
  return `https://${name}.onrender.com/`;
}

async function waitForLive(url, maxMs = 300000) {
  const start = Date.now();
  log(`Waiting for ${url} …`);
  while (Date.now() - start < maxMs) {
    const ok = await new Promise((resolve) => {
      const req = https.get(url, { timeout: 15000 }, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          resolve(
            res.statusCode >= 200 &&
              res.statusCode < 400 &&
              /Menu Creator/i.test(body)
          );
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) {
      log('Service is live with Menu Creator HTML.');
      return true;
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  return false;
}

async function main() {
  const key =
    process.env.RENDER_API_KEY ||
    (fs.existsSync(path.join(ROOT, '.render-api-key'))
      ? fs.readFileSync(path.join(ROOT, '.render-api-key'), 'utf8').trim()
      : '');
  if (!key) {
    console.error('Set RENDER_API_KEY (Render → Account → API Keys).');
    process.exit(1);
  }

  log('=== Fix Menu Creator on Render ===\n');
  log(`Service ID: ${SERVICE_ID}`);

  let svc = unwrapService(await renderApi('GET', `/v1/services/${SERVICE_ID}`, key));
  if (!svc?.id) throw new Error(`Service ${SERVICE_ID} not found on your Render account`);

  log(`Current name: ${svc.name}`);
  log(`Current type: ${svc.type}`);
  log(`Current URL:  ${serviceUrl(svc.name)}`);

  const isStatic = svc.type === 'static_site';
  const isWeb = svc.type === 'web_service';
  if (!isStatic && !isWeb) {
    throw new Error(
      `Service type is "${svc.type}". Delete it and recreate via Blueprint (render.yaml uses Static Site).`
    );
  }

  log(`\nApplying repo + ${isStatic ? 'static publish' : 'build/start'} settings…`);
  svc = unwrapService(
    await renderApi('PATCH', `/v1/services/${SERVICE_ID}`, key, {
      name: SERVICE_NAME,
      repo: REPO,
      branch: 'main',
      autoDeploy: 'yes',
      serviceDetails: isStatic ? STATIC_SITE_DETAILS : WEB_SERVICE_DETAILS,
    })
  );

  log('Triggering deploy…');
  await renderApi('POST', `/v1/services/${SERVICE_ID}/deploys`, key, { clearCache: 'do_not_clear' });

  const url = serviceUrl(svc.name || SERVICE_NAME);
  log(`\nDeploy started. Target URL:\n  ${url}`);

  const live = await waitForLive(url);
  if (!live) {
    log('\nDeploy still running — check Render dashboard Events tab in 2–3 minutes.');
    process.exit(2);
  }

  log(`\nDone: ${url}`);
}

main().catch((e) => {
  console.error('Fix failed:', e.message);
  process.exit(1);
});
