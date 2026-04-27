#!/usr/bin/env node

const { execSync } = require('child_process');
const semver = require('semver');

const args = process.argv.slice(2).filter(Boolean);

if (args.length < 2) {
  console.error('Usage: wv <package-name> <dependency-name>');
  process.exit(1);
}

const [pkgSpec, dep] = args;

const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'engines'];
for (const field of fields) {
  try {
    const out = execSync(`npm v "${pkgSpec}" ${field}.${dep} --json`, { stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim();
    if (out) {
      const result = JSON.parse(out);
      if (result !== null && result !== undefined) {
        let output = result;
        if (Array.isArray(result)) {
          output = [...new Set(result)].sort((a, b) => {
            const aValid = semver.valid(semver.coerce(a));
            const bValid = semver.valid(semver.coerce(b));
            if (aValid && bValid) return semver.compare(aValid, bValid);
            if (aValid) return -1;
            if (bValid) return 1;
            return String(a).localeCompare(String(b));
          });
        }
        console.log(JSON.stringify({ [dep]: output }));
        process.exit(0);
      }
    }
  } catch {
    // try next field
  }
}

console.log('{}');
process.exit(0);