/**
 * KaziAI Bench CI Action runner
 */
const { spawnSync } = require('child_process');
const path = require('path');

const suite = process.env.INPUT_SUITE || 'kazi-bench-core-v1';
const task = process.env.INPUT_TASK;
const agent = process.env.INPUT_AGENT || 'reference';
const model = process.env.INPUT_MODEL || 'gpt-4o';
const compareBaseline = process.env['INPUT_COMPARE-BASELINE'];

console.log(`[KaziAI Bench Action] Starting evaluation with agent: ${agent}, suite: ${suite}`);

const cliPath = path.resolve(__dirname, '../apps/cli/dist/index.js');
const args = task 
  ? [cliPath, 'run', task, '--agent', agent, '--model', model]
  : [cliPath, 'run-suite', suite, '--agent', agent, '--model', model];

const result = spawnSync('node', args, { stdio: 'inherit' });

if (compareBaseline) {
  console.log(`[KaziAI Bench Action] Comparing against baseline: ${compareBaseline}`);
  const compResult = spawnSync('node', [cliPath, 'compare', '--baseline', compareBaseline], { stdio: 'inherit' });
  if (compResult.status !== 0 && process.env['INPUT_FAIL-ON-REGRESSION'] === 'true') {
    console.error('Regression detected exceeding thresholds.');
    process.exit(1);
  }
}

process.exit(result.status || 0);
