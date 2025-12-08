// Copyright 2024 The Casbin Authors. All Rights Reserved.
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

import { newEnforcer, Enforcer, newModel, StringAdapter } from '../src';

let e = {} as Enforcer;

beforeEach(async () => {
  // Use StringAdapter to avoid modifying the example files
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const policyText = `
p, alice, data1, read
p, bob, data2, write
p, data2_admin, data2, read
p, data2_admin, data2, write
g, alice, data2_admin
`.trim();

  const adapter = new StringAdapter(policyText);
  e = await newEnforcer(m, adapter);
});

test('TestBatchMode', async () => {
  // Initial state check
  expect(await e.enforce('alice', 'data1', 'read')).toBe(true);
  expect(await e.enforce('bob', 'data2', 'write')).toBe(true);

  // Start batch mode
  e.startBatch();

  // Remove policies in batch mode
  await e.removePolicy('alice', 'data1', 'read');
  await e.removePolicy('bob', 'data2', 'write');

  // Policies should still work in-memory even though not saved yet
  expect(await e.enforce('alice', 'data1', 'read')).toBe(false);
  expect(await e.enforce('bob', 'data2', 'write')).toBe(false);

  // End batch mode - this saves everything
  await e.endBatch();

  // Verify policies are still removed after batch
  expect(await e.enforce('alice', 'data1', 'read')).toBe(false);
  expect(await e.enforce('bob', 'data2', 'write')).toBe(false);
});

test('TestBatchModeWithRoleLinks', async () => {
  // Initial state check
  expect(await e.enforce('alice', 'data2', 'read')).toBe(true);

  // Start batch mode
  e.startBatch();

  // Remove grouping policies in batch mode
  await e.removeGroupingPolicy('alice', 'data2_admin');

  // End batch mode - this rebuilds role links
  await e.endBatch();

  // Verify role link was removed
  expect(await e.enforce('alice', 'data2', 'read')).toBe(false);
});

test('TestBatchModeAddPolicies', async () => {
  // Initial state check
  expect(await e.enforce('charlie', 'data3', 'read')).toBe(false);

  // Start batch mode
  e.startBatch();

  // Add policies in batch mode
  await e.addPolicy('charlie', 'data3', 'read');
  await e.addPolicy('charlie', 'data3', 'write');

  // Policies should work in-memory
  expect(await e.enforce('charlie', 'data3', 'read')).toBe(true);
  expect(await e.enforce('charlie', 'data3', 'write')).toBe(true);

  // End batch mode
  await e.endBatch();

  // Verify policies persist after batch
  expect(await e.enforce('charlie', 'data3', 'read')).toBe(true);
  expect(await e.enforce('charlie', 'data3', 'write')).toBe(true);
});

test('TestBatchModeNested', async () => {
  // Starting batch mode twice should throw error
  e.startBatch();
  expect(() => e.startBatch()).toThrow('Batch mode is already enabled');
  await e.endBatch();
});

test('TestEndBatchWithoutStart', async () => {
  // Ending batch mode without starting should throw error
  await expect(e.endBatch()).rejects.toThrow('Batch mode is not enabled');
});

test('TestBatchModeMassOperations', async () => {
  // Simulate mass operations scenario from the issue
  e.startBatch();

  // Add many policies
  const policiesToAdd = [];
  for (let i = 0; i < 100; i++) {
    policiesToAdd.push(['user' + i, 'data' + i, 'read']);
  }

  for (const policy of policiesToAdd) {
    await e.addPolicy(...policy);
  }

  // Verify some policies work
  expect(await e.enforce('user0', 'data0', 'read')).toBe(true);
  expect(await e.enforce('user50', 'data50', 'read')).toBe(true);
  expect(await e.enforce('user99', 'data99', 'read')).toBe(true);

  // Now remove them all
  for (const policy of policiesToAdd) {
    await e.removePolicy(...policy);
  }

  // Verify removal
  expect(await e.enforce('user0', 'data0', 'read')).toBe(false);
  expect(await e.enforce('user50', 'data50', 'read')).toBe(false);

  // End batch - should save once
  await e.endBatch();

  // Verify state after batch
  expect(await e.enforce('user0', 'data0', 'read')).toBe(false);
});
