# Benchmarks

This directory contains performance benchmarks for node-casbin.

## Running Benchmarks Locally

To run the benchmarks locally:

```bash
yarn benchmark
```

This will:
1. Build the CommonJS version of the library
2. Build the benchmark suite
3. Run all benchmarks and display results

## What is Benchmarked

The benchmark suite tests the performance of:

### RBAC Model
- `enforce()` (async) - both allow and deny cases
- `enforceSync()` - both allow and deny cases
- `getRolesForUser()` - get user roles
- `hasRoleForUser()` - check if user has a specific role

### ABAC Model
- `enforce()` (async) - attribute-based access control
- `enforceSync()` - attribute-based access control

### Basic Model
- `enforce()` (async) - basic access control
- `enforceSync()` - basic access control

### Policy Management
- `getPolicy()` - retrieve all policies
- `hasPolicy()` - check if policy exists
- `getFilteredPolicy()` - retrieve filtered policies

## Automated Benchmarking

The benchmark workflow automatically runs on every Pull Request:

1. **Runs benchmarks on PR branch** - measures performance of proposed changes
2. **Runs benchmarks on base branch** - establishes baseline performance
3. **Compares results** - calculates percentage changes
4. **Posts comment to PR** - displays results in an easy-to-read table

### Understanding Benchmark Results

The PR comment will show:
- **🚀** - Significant improvement (>5%)
- **✅** - Improvement (0-5%)
- **➖** - No significant change
- **⬇️** - Minor regression (0-5%)
- **⚠️** - Regression (>5%)

### What to Do About Regressions

If your PR shows performance regressions:

1. **Review the changes** - identify what might cause the slowdown
2. **Profile the code** - use Node.js profiling tools to find bottlenecks
3. **Consider alternatives** - can the same functionality be achieved more efficiently?
4. **Document trade-offs** - if the regression is unavoidable, document why the change is necessary

Small regressions (<5%) are generally acceptable if:
- The change adds important functionality
- The change improves code maintainability
- The change fixes a bug or security issue

## Adding New Benchmarks

To add new benchmarks, edit `benchmark/benchmark.ts`:

```typescript
// Create a new suite
const mySuite = createSuite('My Feature');

mySuite
  .add('My benchmark', {
    defer: true, // for async tests
    fn: async (deferred: Benchmark.Deferred) => {
      await myFunction();
      deferred.resolve();
    },
  })
  .on('complete', () => {
    resolve();
  })
  .run({ async: true });
```

For synchronous tests, omit the `defer` option:

```typescript
mySuite.add('My sync benchmark', () => {
  mySyncFunction();
});
```
