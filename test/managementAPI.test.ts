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
  const allSubjects = e.getAllSubjects();
  expect(Util.arrayEquals(allSubjects, ['alice', 'bob', 'data2_admin']));
});

test('getAllNamedSubjects', async () => {
  const allNamedSubjects = e.getAllNamedSubjects('p');
  expect(Util.arrayEquals(allNamedSubjects, ['alice', 'bob', 'data2_admin']));
});

test('getAllObjects', async () => {
  const allObjects = e.getAllObjects();
  testArrayEquals(allObjects, ['data1', 'data2']);
});

test('getAllNamedObjects', async () => {
  let allNamedObjects = e.getAllNamedObjects('p');
  testArrayEquals(allNamedObjects, ['data1', 'data2']);
  allNamedObjects = e.getAllNamedObjects('p1');
  testArrayEquals(allNamedObjects, []);
});

test('getAllActions', async () => {
  const allActions = e.getAllActions();
  testArrayEquals(allActions, ['read', 'write']);
});

test('getAllNamedActions', async () => {
  let allNamedActions = e.getAllNamedActions('p');
  testArrayEquals(allNamedActions, ['read', 'write']);
  allNamedActions = e.getAllNamedActions('p1');
  testArrayEquals(allNamedActions, []);
});

test('getAllRoles', async () => {
  const allRoles = e.getAllRoles();
  testArrayEquals(allRoles, ['data2_admin']);
});

test('getAllNamedRoles', async () => {
  let allNamedRoles = e.getAllNamedRoles('g');
  testArrayEquals(allNamedRoles, ['data2_admin']);
  allNamedRoles = e.getAllNamedRoles('g1');
  testArrayEquals(allNamedRoles, []);
});

test('getPolicy', async () => {
  const policy = e.getPolicy();
  testArray2DEquals(policy, [
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write']
  ]);
});

test('getFilteredPolicy', async () => {
  let filteredPolicy = e.getFilteredPolicy(0, 'alice');
  testArray2DEquals(filteredPolicy, [['alice', 'data1', 'read']]);
  filteredPolicy = e.getFilteredPolicy(0, 'bob');
  testArray2DEquals(filteredPolicy, [['bob', 'data2', 'write']]);
});

test('getNamedPolicy', async () => {
  let namedPolicy = e.getNamedPolicy('p');
  testArray2DEquals(namedPolicy, [
    ['alice', 'data1', 'read'],
    ['bob', 'data2', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write']
  ]);
  namedPolicy = e.getNamedPolicy('p1');
  testArray2DEquals(namedPolicy, []);
});

test('getFilteredNamedPolicy', async () => {
  const filteredNamedPolicy = e.getFilteredNamedPolicy('p', 0, 'bob');
  testArray2DEquals(filteredNamedPolicy, [['bob', 'data2', 'write']]);
});

test('getGroupingPolicy', async () => {
  const groupingPolicy = e.getGroupingPolicy();
  testArray2DEquals(groupingPolicy, [['alice', 'data2_admin']]);
});

test('getFilteredGroupingPolicy', async () => {
  const filteredGroupingPolicy = e.getFilteredGroupingPolicy(0, 'alice');
  testArray2DEquals(filteredGroupingPolicy, [['alice', 'data2_admin']]);
});

test('getNamedGroupingPolicy', async () => {
  const namedGroupingPolicy = e.getNamedGroupingPolicy('g');
  testArray2DEquals(namedGroupingPolicy, [['alice', 'data2_admin']]);
});

test('getFilteredNamedGroupingPolicy', async () => {
  const namedGroupingPolicy = e.getFilteredNamedGroupingPolicy('g', 0, 'alice');
  testArray2DEquals(namedGroupingPolicy, [['alice', 'data2_admin']]);
});

test('hasPolicy', async () => {
  const hasPolicy = e.hasPolicy('data2_admin', 'data2', 'read');
  expect(hasPolicy).toBe(true);
});

test('hasNamedPolicy', async () => {
  const hasNamedPolicy = e.hasNamedPolicy('p', 'data2_admin', 'data2', 'read');
  expect(hasNamedPolicy).toBe(true);
});

test('addPolicy', async () => {
  const p = ['eve', 'data3', 'read'];
  const added = await e.addPolicy(...p);
  expect(added).toBe(true);
  expect(e.hasPolicy(...p)).toBe(true);
});

test('addNamedPolicy', async () => {
  const p = ['eve', 'data3', 'read'];
  const added = await e.addNamedPolicy('p', ...p);
  expect(added).toBe(true);
  expect(e.hasPolicy(...p)).toBe(true);
});

test('removePolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removePolicy(...p);
  expect(removed).toBe(true);
  expect(e.hasPolicy(...p)).toBe(false);
});

test('removeFilteredPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeFilteredPolicy(0, ...p);
  expect(removed).toBe(true);
  expect(e.hasPolicy(...p)).toBe(false);
});

test('removeNamedPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeNamedPolicy('p', ...p);
  expect(removed).toBe(true);
  expect(e.hasPolicy(...p)).toBe(false);
});

test('removeFilteredNamedPolicy', async () => {
  const p = ['alice', 'data1', 'read'];
  const removed = await e.removeFilteredNamedPolicy('p', 0, ...p);
  expect(removed).toBe(true);
  expect(e.hasPolicy(...p)).toBe(false);
});

test('hasGroupingPolicy', async () => {
  const has = e.hasGroupingPolicy('alice', 'data2_admin');
  expect(has).toBe(true);
});

test('hasNamedGroupingPolicy', async () => {
  const has = e.hasNamedGroupingPolicy('g', 'alice', 'data2_admin');
  expect(has).toBe(true);
});

test('addGroupingPolicy', async () => {
  const added = await e.addGroupingPolicy('group1', 'data2_admin');
  expect(added).toBe(true);
});

test('addNamedGroupingPolicy ', async () => {
  const added = await e.addNamedGroupingPolicy('g', 'group1', 'data2_admin');
  expect(added).toBe(true);
});

test('removeGroupingPolicy', async () => {
  const removed = await e.removeGroupingPolicy('alice', 'data2_admin');
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
