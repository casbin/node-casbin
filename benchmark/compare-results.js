#!/usr/bin/env node

// Script to compare benchmark results and generate a PR comment

const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: node compare-results.js <base-results.json> <pr-results.json>');
  process.exit(1);
}

const baseFile = process.argv[2];
const prFile = process.argv[3];

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
}

function getPercentageChange(base, pr) {
  if (!base || base === 0) return 'N/A';
  const change = ((pr - base) / base) * 100;
  return change.toFixed(2);
}

function getChangeEmoji(change) {
  if (change === 'N/A') return '➖';
  const num = parseFloat(change);
  if (num > 5) return '🚀';
  if (num > 0) return '✅';
  if (num < -5) return '⚠️';
  if (num < 0) return '⬇️';
  return '➖';
}

try {
  const baseResults = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const prResults = JSON.parse(fs.readFileSync(prFile, 'utf8'));

  let comment = '## 📊 Benchmark Results\n\n';
  comment += 'Performance comparison between base branch and PR:\n\n';
  comment += '| Benchmark | Base (ops/sec) | PR (ops/sec) | Change | |\n';
  comment += '|-----------|----------------|--------------|--------|---|\n';

  // Create a map of base results
  const baseMap = new Map(baseResults.map((r) => [r.name, r]));

  if (prResults.length === 0) {
    comment += '\n⚠️ No benchmark results found for PR branch.\n';
  } else {
    prResults.forEach((pr) => {
      const base = baseMap.get(pr.name);
      const baseOps = base ? base.ops : 0;
      const change = getPercentageChange(baseOps, pr.ops);
      const emoji = getChangeEmoji(change);

      comment += `| ${pr.name} | ${formatNumber(baseOps)} | ${formatNumber(pr.ops)} | ${change}% | ${emoji} |\n`;
    });
  }

  comment += '\n---\n';
  comment += '**Legend:**\n';
  comment += '- 🚀 Significant improvement (>5%)\n';
  comment += '- ✅ Improvement (0-5%)\n';
  comment += '- ➖ No significant change\n';
  comment += '- ⬇️ Minor regression (0-5%)\n';
  comment += '- ⚠️ Regression (>5%)\n';

  console.log(comment);
} catch (error) {
  console.error('Error comparing benchmark results:', error.message);
  const fallbackComment =
    '## 📊 Benchmark Results\n\n⚠️ Failed to generate benchmark comparison. Please check the workflow logs for details.\n';
  console.log(fallbackComment);
  process.exit(0);
}
