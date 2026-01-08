#!/usr/bin/env node

// Script to extract JSON benchmark results from benchmark output

const fs = require('fs');

if (process.argv.length < 4) {
  console.error('Usage: extract-benchmark-results.js <input-file> <output-file>');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

try {
  const output = fs.readFileSync(inputFile, 'utf8');
  const jsonMatch = output.match(/--- Benchmark Results \(JSON\) ---\s*\n([\s\S]*?)\n--- Benchmarks Complete ---/);
  
  if (jsonMatch && jsonMatch[1]) {
    const results = JSON.parse(jsonMatch[1]);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`Successfully extracted ${results.length} benchmark results to ${outputFile}`);
  } else {
    console.warn('Could not extract JSON results from output, writing empty array');
    fs.writeFileSync(outputFile, '[]');
  }
} catch (error) {
  console.error('Error extracting benchmark results:', error.message);
  // Write empty array on error to prevent workflow failure
  fs.writeFileSync(outputFile, '[]');
  process.exit(0);
}
