// Copyright 2018 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Benchmark from 'benchmark';

// Use CommonJS require to import from built library
// eslint-disable-next-line @typescript-eslint/no-var-requires
const casbin = require('../cjs');
const { newEnforcer } = casbin;

interface BenchmarkResult {
  name: string;
  ops: number;
  margin: number;
  samples: number;
}

const results: BenchmarkResult[] = [];

async function setupEnforcers(): Promise<{
  rbacEnforcer: any;
  abacEnforcer: any;
  basicEnforcer: any;
}> {
  const rbacEnforcer = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');
  const abacEnforcer = await newEnforcer('examples/abac_model.conf');
  const basicEnforcer = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  return { rbacEnforcer, abacEnforcer, basicEnforcer };
}

function createSuite(name: string): Benchmark.Suite {
  const suite = new Benchmark.Suite(name);

  suite.on('cycle', (event: Benchmark.Event) => {
    const benchmark = event.target;
    console.log(String(benchmark));

    results.push({
      name: benchmark.name || 'Unknown',
      ops: benchmark.hz || 0,
      margin: benchmark.stats ? benchmark.stats.rme : 0,
      samples: benchmark.stats ? benchmark.stats.sample.length : 0,
    });
  });

  suite.on('error', (event: Benchmark.Event) => {
    console.error('Error in benchmark:', event.target);
  });

  return suite;
}

async function runBenchmarks(): Promise<void> {
  console.log('Setting up enforcers...');
  const { rbacEnforcer, abacEnforcer, basicEnforcer } = await setupEnforcers();

  console.log('\n--- Starting Benchmarks ---\n');

  // RBAC Model Benchmarks
  console.log('RBAC Model Benchmarks:');
  await new Promise<void>((resolve) => {
    const rbacSuite = createSuite('RBAC');

    rbacSuite
      .add('RBAC - enforce (allow)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await rbacEnforcer.enforce('alice', 'data1', 'read');
          deferred.resolve();
        },
      })
      .add('RBAC - enforce (deny)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await rbacEnforcer.enforce('bob', 'data2', 'write');
          deferred.resolve();
        },
      })
      .add('RBAC - enforceSync (allow)', () => {
        rbacEnforcer.enforceSync('alice', 'data1', 'read');
      })
      .add('RBAC - enforceSync (deny)', () => {
        rbacEnforcer.enforceSync('bob', 'data2', 'write');
      })
      .add('RBAC - getRolesForUser', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await rbacEnforcer.getRolesForUser('alice');
          deferred.resolve();
        },
      })
      .add('RBAC - hasRoleForUser', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await rbacEnforcer.hasRoleForUser('alice', 'data2_admin');
          deferred.resolve();
        },
      })
      .on('complete', () => {
        resolve();
      })
      .run({ async: true });
  });

  // ABAC Model Benchmarks
  console.log('\nABAC Model Benchmarks:');
  await new Promise<void>((resolve) => {
    const abacSuite = createSuite('ABAC');

    abacSuite
      .add('ABAC - enforce (allow)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await abacEnforcer.enforce({ name: 'alice', age: 16 }, '/data1', 'read');
          deferred.resolve();
        },
      })
      .add('ABAC - enforce (deny)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await abacEnforcer.enforce({ name: 'bob', age: 30 }, '/data1', 'read');
          deferred.resolve();
        },
      })
      .add('ABAC - enforceSync (allow)', () => {
        abacEnforcer.enforceSync({ name: 'alice', age: 16 }, '/data1', 'read');
      })
      .add('ABAC - enforceSync (deny)', () => {
        abacEnforcer.enforceSync({ name: 'bob', age: 30 }, '/data1', 'read');
      })
      .on('complete', () => {
        resolve();
      })
      .run({ async: true });
  });

  // Basic Model Benchmarks
  console.log('\nBasic Model Benchmarks:');
  await new Promise<void>((resolve) => {
    const basicSuite = createSuite('Basic');

    basicSuite
      .add('Basic - enforce (allow)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await basicEnforcer.enforce('alice', 'data1', 'read');
          deferred.resolve();
        },
      })
      .add('Basic - enforce (deny)', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await basicEnforcer.enforce('alice', 'data1', 'write');
          deferred.resolve();
        },
      })
      .add('Basic - enforceSync (allow)', () => {
        basicEnforcer.enforceSync('alice', 'data1', 'read');
      })
      .add('Basic - enforceSync (deny)', () => {
        basicEnforcer.enforceSync('alice', 'data1', 'write');
      })
      .on('complete', () => {
        resolve();
      })
      .run({ async: true });
  });

  // Policy Management Benchmarks
  console.log('\nPolicy Management Benchmarks:');
  await new Promise<void>((resolve) => {
    const policyEnforcer = basicEnforcer;
    const policySuite = createSuite('Policy Management');

    policySuite
      .add('getPolicy', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await policyEnforcer.getPolicy();
          deferred.resolve();
        },
      })
      .add('hasPolicy', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await policyEnforcer.hasPolicy('alice', 'data1', 'read');
          deferred.resolve();
        },
      })
      .add('getFilteredPolicy', {
        defer: true,
        fn: async (deferred: Benchmark.Deferred) => {
          await policyEnforcer.getFilteredPolicy(0, 'alice');
          deferred.resolve();
        },
      })
      .on('complete', () => {
        resolve();
      })
      .run({ async: true });
  });

  // Output results as JSON for CI
  console.log('\n--- Benchmark Results (JSON) ---');
  console.log(JSON.stringify(results, null, 2));
}

runBenchmarks()
  .then(() => {
    console.log('\n--- Benchmarks Complete ---');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Benchmark error:', error);
    process.exit(1);
  });
