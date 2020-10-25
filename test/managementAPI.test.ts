// Copyright 2019 The Casbin Authors. All Rights Reserved.
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

import { newEnforcer, Enforcer, Util } from '../src';
import { BatchFileAdapter } from '../src/persist';

let e = {} as Enforcer;

beforeEach(async () => {
  e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');
});

function testArrayEquals(value: string[], other: string[]): void {
  expect(Util.arrayEquals(value, other)).toBe(true);
}

function testArray2DEquals(value: string[][], other: string[][]): void {
  expect(Util.array2DEquals(value, other)).toBe(true);
}

test('getAllSubjects', async () => {
  const allSubjects = await e.getAllSubjects();
  expect(Util.arrayEquals(allSubjects, ['alice', 'bob', 'data2_admin']));
});

test('getAllNamedSubjects', async () => {
  const allNamedSubjects = await e.getAllNamedSubjects('p');
  expect(Util.arrayEquals(allNamedSubjects, ['alice', 'bob', 'data2_admin']));
});

test('getAllObjects', async () => {
  const allObjects = await e.getAllObjects();
  testArrayEquals(allObjects, ['data1', 'data2']);
});

test('getAllNamedObjects', async () => {
  let allNamedObjects = await e.getAllNamedObjects('p');
  testArrayEquals(allNamedObjects, ['data1', 'data2']);
  allNamedObjects = await e.getAllNamedObjects('p1');
  testArrayEquals(allNamedObjects, []);
});

test('getAllActions', async () => {
  const allActions = await e.getAllActions();
  testArrayEquals(allActions, ['read', 'write']);
});

test('getAllNamedActions', async () => {
  let allNamedActions = await e.getAllNamedActions('p');
  testArrayEquals(allNamedActions, ['read', 'write']);
  allNamedActions = await e.getAllNamedActions('p1');
  testArrayEquals(allNamedActions, []);
});

test('getAllRoles', async () => {
  const allRoles = await e.getAllRoles();
  testArrayEquals(allRoles, ['data2_admin']);
});

test('getAllNamedRoles', async () => {
  let allNamedRoles = await e.getAllNamedRoles('g');
  testArrayEquals(allNamedRoles, ['data2_admin']);
  allNamedRoles = await e.getAllNamedRoles('g1');
  testArrayEquals(allNamedRoles, []);
});

test('getPolicy', async () => {
  const policy = await e.getPolicy();
  testArray2DEquals(policy, [
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
});

test('getFilteredPolicy', async () => {
  let filteredPolicy = await e.getFilteredPolicy(0, 'alice');
  testArray2DEquals(filteredPolicy, [['alice', 'data1', 'read']]);
  filteredPolicy = await e.getFilteredPolicy(0, 'bob');
  testArray2DEquals(filteredPolicy, [['bob', 'data2', 'write']]);
});

test('getNamedPolicy', async () => {
  let namedPolicy = await e.getNamedPolicy('p');
  testArray2DEquals(namedPolicy, [
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
  namedPolicy = await e.getNamedPolicy('p1');
  testArray2DEquals(namedPolicy, []);
});

test('getFilteredNamedPolicy', async () => {
  const filteredNamedPolicy = await e.getFilteredNamedPolicy('p', 0, 'bob');
  testArray2DEquals(filteredNamedPolicy, [['bob', 'data2', 'write']]);
});

test('getGroupingPolicy', async () => {
  const groupingPolicy = await e.getGroupingPolicy();
  testArray2DEquals(groupingPolicy, [['alice', 'data2_admin']]);
});

test('getFilteredGroupingPolicy', async () => {
  const filteredGroupingPolicy = await e.getFilteredGroupingPolicy(0, 'alice');
  testArray2DEquals(filteredGroupingPolicy, [['alice', 'data2_admin']]);
});

test('getNamedGroupingPolicy', async () => {
  const namedGroupingPolicy = await e.getNamedGroupingPolicy('g');
  testArray2DEquals(namedGroupingPolicy, [['alice', 'data2_admin']]);
});

test('getFilteredNamedGroupingPolicy', async () => {
  const namedGroupingPolicy = await e.getFilteredNamedGroupingPolicy('g', 0, 'alice');
  testArray2DEquals(namedGroupingPolicy, [['alice', 'data2_admin']]);
});

test('hasPolicy', async () => {
  const hasPolicy = await e.hasPolicy('data2_admin', 'data2', 'read');
  expect(hasPolicy).toBe(true);
});

test('hasNamedPolicy', async () => {
  const hasNamedPolicy = await e.hasNamedPolicy('p', 'data2_admin', 'data2', 'read');
  expect(hasNamedPolicy).toBe(true);
});

test('addPolicy', async () => {
  const p = ['eve', 'data3', 'read'];
  const added = await e.addPolicy(...p);
  expect(added).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(true);
});

test('addPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const rules = [
    ['jack', 'data4', 'read'],
    ['katy', 'data4', 'write'],
    ['leyo', 'data4', 'read'],
    ['ham', 'data4', 'write'],
  ];
  const added = await e.addPolicies(rules);
  expect(added).toBe(true);
  for (const rule of rules) {
    expect(await e.hasPolicy(...rule)).toBe(true);
  }
});

test('addNamedPolicy', async () => {
  const p = ['eve', 'data3', 'read'];
  const added = await e.addNamedPolicy('p', ...p);
  expect(added).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(true);
});

test('addNamedPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const rules = [
    ['jack', 'data4', 'read'],
    ['katy', 'data4', 'write'],
    ['leyo', 'data4', 'read'],
    ['ham', 'data4', 'write'],
  ];
  const added = await e.addNamedPolicies('p', rules);
  expect(added).toBe(true);
  for (const rule of rules) {
    expect(await e.hasPolicy(...rule)).toBe(true);
  }
});

test('removePolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removePolicy(...p);
  expect(removed).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(false);
});

test('removePolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const rules = [
    ['jack', 'data4', 'read'],
    ['katy', 'data4', 'write'],
    ['leyo', 'data4', 'read'],
    ['ham', 'data4', 'write'],
  ];
  const added = await e.addPolicies(rules);
  expect(added).toBe(true);
  const removed = await e.removePolicies(rules);
  expect(removed).toBe(true);
  for (const rule of rules) {
    expect(await e.hasPolicy(...rule)).toBe(false);
  }
});

test('removeFilteredPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeFilteredPolicy(0, ...p);
  expect(removed).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(false);
});

test('removeNamedPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeNamedPolicy('p', ...p);
  expect(removed).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(false);
});

test('removeNamedPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const rules = [
    ['jack', 'data4', 'read'],
    ['katy', 'data4', 'write'],
    ['leyo', 'data4', 'read'],
    ['ham', 'data4', 'write'],
  ];
  const added = await e.addPolicies(rules);
  expect(added).toBe(true);
  const removed = await e.removeNamedPolicies('p', rules);
  expect(removed).toBe(true);
  for (const rule of rules) {
    expect(await e.hasPolicy(...rule)).toBe(false);
  }
});

test('removeFilteredNamedPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeFilteredNamedPolicy('p', 0, ...p);
  expect(removed).toBe(true);
  expect(await e.hasPolicy(...p)).toBe(false);
});

test('hasGroupingPolicy', async () => {
  const has = await e.hasGroupingPolicy('alice', 'data2_admin');
  expect(has).toBe(true);
});

test('hasNamedGroupingPolicy', async () => {
  const has = await e.hasNamedGroupingPolicy('g', 'alice', 'data2_admin');
  expect(has).toBe(true);
});

test('addGroupingPolicy', async () => {
  const added = await e.addGroupingPolicy('group1', 'data2_admin');
  expect(added).toBe(true);
});

test('addGroupingPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const groupingRules = [
    ['ham', 'data4_admin'],
    ['jack', 'data5_admin'],
  ];
  const added = await e.addGroupingPolicies(groupingRules);
  expect(added).toBe(true);
});

test('addNamedGroupingPolicy', async () => {
  const added = await e.addNamedGroupingPolicy('g', 'group1', 'data2_admin');
  expect(added).toBe(true);
});

test('addNamedGroupingPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const groupingRules = [
    ['ham', 'data4_admin'],
    ['jack', 'data5_admin'],
  ];
  const added = await e.addNamedGroupingPolicies('g', groupingRules);
  expect(added).toBe(true);
});

test('removeGroupingPolicy', async () => {
  const removed = await e.removeGroupingPolicy('alice', 'data2_admin');
  expect(removed).toBe(true);
});

test('removeGroupingPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const groupingRules = [
    ['ham', 'data4_admin'],
    ['jack', 'data5_admin'],
  ];
  const added = await e.addGroupingPolicies(groupingRules);
  expect(added).toBe(true);
  const removed = await e.removeGroupingPolicies(groupingRules);
  expect(removed).toBe(true);
});

test('removeFilteredGroupingPolicy', async () => {
  const removed = await e.removeFilteredGroupingPolicy(0, 'alice');
  expect(removed).toBe(true);
});

test('removeFilteredNamedGroupingPolicy', async () => {
  const removed = await e.removeFilteredNamedGroupingPolicy('g', 0, 'alice');
  expect(removed).toBe(true);
});

test('removeNamedGroupingPolicies', async () => {
  const a = new BatchFileAdapter('examples/rbac_policy.csv');
  e.setAdapter(a);
  const groupingRules = [
    ['ham', 'data4_admin'],
    ['jack', 'data5_admin'],
  ];
  const added = await e.addGroupingPolicies(groupingRules);
  expect(added).toBe(true);
  const removed = await e.removeNamedGroupingPolicies('g', groupingRules);
  expect(removed).toBe(true);
});
