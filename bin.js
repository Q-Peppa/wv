#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');

const args = process.argv.slice(2).filter(Boolean);

if (args.length < 2) {
  console.error('Usage: wv <package-name> <dependency-name>');
  process.exit(1);
}

const [raw, dep] = args;

let pkg, version;
if (raw.includes('@')) {
  const idx = raw.indexOf('@');
  pkg = raw.slice(0, idx);
  const spec = raw.slice(idx + 1);
  try {
    const out = execSync(`npm view "${pkg}@${spec}" version --json 2>/dev/null`).toString().trim();
    const resolved = JSON.parse(out);
    version = Array.isArray(resolved) ? resolved[resolved.length - 1] : resolved;
  } catch {
    console.log('{}');
    process.exit(0);
  }
} else {
  pkg = raw;
  version = 'latest';
}

const REGISTRIES = [
  { base: 'https://registry.npmmirror.com', path: `${encodeURIComponent(pkg)}/${encodeURIComponent(version)}/files/package.json` },
  { base: 'https://registry.npmjs.org', path: `${encodeURIComponent(pkg)}/${encodeURIComponent(version)}` },
];

const DEPENDENCY_SOURCES = ['engines', 'dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies'];

function request(url, onSuccess) {
  https.get(url, { headers: { accept: 'application/json' } }, (res) => {
    if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
      request(new URL(res.headers.location, url).href, onSuccess);
      return;
    }

    let body = '';
    res.on('data', (chunk) => { body += chunk; });

    if (res.statusCode !== 200) {
      res.on('end', () => onSuccess(null));
      return;
    }

    res.on('end', () => {
      try {
        onSuccess(JSON.parse(body));
      } catch {
        onSuccess(null);
      }
    });
  }).on('error', () => onSuccess(null));
}

function tryRegistry(idx) {
  if (idx >= REGISTRIES.length) {
    console.log('{}');
    process.exit(0);
    return;
  }

  const { base, path } = REGISTRIES[idx];
  request(`${base}/${path}`, (data) => {
    if (!data) return tryRegistry(idx + 1);
    for (const type of DEPENDENCY_SOURCES) {
      if (data[type] && data[type][dep]) {
        console.log(`{"${dep}": "${data[type][dep]}"}`);
        process.exit(0);
        return;
      }
    }
    console.log('{}');
    process.exit(0);
  });
}

tryRegistry(0);
