#!/usr/bin/env bash
set -e

echo "Running KaziAI Bench Doctor..."
node -e "
const cp = require('child_process');
const checks = [
  { name: 'Node.js', cmd: 'node -v' },
  { name: 'pnpm', cmd: 'pnpm -v' },
  { name: 'Git', cmd: 'git --version' },
  { name: 'Docker', cmd: 'docker --version' }
];

for (const check of checks) {
  try {
    const out = cp.execSync(check.cmd, { stdio: 'pipe' }).toString().trim();
    console.log('✓ ' + check.name + ': ' + out);
  } catch (e) {
    console.log('⚠ ' + check.name + ': not available or error');
  }
}
"
