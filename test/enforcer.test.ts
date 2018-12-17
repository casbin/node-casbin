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

import casbin, { Enforcer, FileAdapter, Util } from '../src/casbin';

function testEnforce(e: Enforcer, sub: string, obj: string, act: string, res: boolean): void {
  expect(e.enforce(sub, obj, act)).toBe(res);
}

function testGetPolicy(e: Enforcer, res: string[][]) {
  const myRes = e.getPolicy();
  console.log('Policy: ', myRes);

  expect(Util.array2DEquals(res, myRes)).toBe(true);
}

test('TestKeyMatchModelInMemory', async () => {
  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  let e = await casbin.newEnforcer(m, a);

  testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
  testEnforce(e, 'alice', '/alice_data/resource1', 'POST', true);
  testEnforce(e, 'alice', '/alice_data/resource2', 'GET', true);
  testEnforce(e, 'alice', '/alice_data/resource2', 'POST', false);
  testEnforce(e, 'alice', '/bob_data/resource1', 'GET', false);
  testEnforce(e, 'alice', '/bob_data/resource1', 'POST', false);
  testEnforce(e, 'alice', '/bob_data/resource2', 'GET', false);
  testEnforce(e, 'alice', '/bob_data/resource2', 'POST', false);

  testEnforce(e, 'bob', '/alice_data/resource1', 'GET', false);
  testEnforce(e, 'bob', '/alice_data/resource1', 'POST', false);
  testEnforce(e, 'bob', '/alice_data/resource2', 'GET', true);
  testEnforce(e, 'bob', '/alice_data/resource2', 'POST', false);
  testEnforce(e, 'bob', '/bob_data/resource1', 'GET', false);
  testEnforce(e, 'bob', '/bob_data/resource1', 'POST', true);
  testEnforce(e, 'bob', '/bob_data/resource2', 'GET', false);
  testEnforce(e, 'bob', '/bob_data/resource2', 'POST', true);

  testEnforce(e, 'cathy', '/cathy_data', 'GET', true);
  testEnforce(e, 'cathy', '/cathy_data', 'POST', true);
  testEnforce(e, 'cathy', '/cathy_data', 'DELETE', false);

  e = await casbin.newEnforcer(m);
  await a.loadPolicy(e.getModel());

  testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
  testEnforce(e, 'alice', '/alice_data/resource1', 'POST', true);
  testEnforce(e, 'alice', '/alice_data/resource2', 'GET', true);
  testEnforce(e, 'alice', '/alice_data/resource2', 'POST', false);
  testEnforce(e, 'alice', '/bob_data/resource1', 'GET', false);
  testEnforce(e, 'alice', '/bob_data/resource1', 'POST', false);
  testEnforce(e, 'alice', '/bob_data/resource2', 'GET', false);
  testEnforce(e, 'alice', '/bob_data/resource2', 'POST', false);

  testEnforce(e, 'bob', '/alice_data/resource1', 'GET', false);
  testEnforce(e, 'bob', '/alice_data/resource1', 'POST', false);
  testEnforce(e, 'bob', '/alice_data/resource2', 'GET', true);
  testEnforce(e, 'bob', '/alice_data/resource2', 'POST', false);
  testEnforce(e, 'bob', '/bob_data/resource1', 'GET', false);
  testEnforce(e, 'bob', '/bob_data/resource1', 'POST', true);
  testEnforce(e, 'bob', '/bob_data/resource2', 'GET', false);
  testEnforce(e, 'bob', '/bob_data/resource2', 'POST', true);

  testEnforce(e, 'cathy', '/cathy_data', 'GET', true);
  testEnforce(e, 'cathy', '/cathy_data', 'POST', true);
  testEnforce(e, 'cathy', '/cathy_data', 'DELETE', false);
});

test('TestKeyMatchModelInMemoryDeny', async () => {
  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', '!some(where (p.eft == deny))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  const e = await casbin.newEnforcer(m, a);

  testEnforce(e, 'alice', '/alice_data/resource2', 'POST', true);
});

test('TestRBACModelInMemoryIndeterminate', async () => {
  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await casbin.newEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'invalid');

  testEnforce(e, 'alice', 'data1', 'read', false);
});

test('TestRBACModelInMemory', async () => {
  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await casbin.newEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'read');
  await e.addPermissionForUser('bob', 'data2', 'write');
  await e.addPermissionForUser('data2_admin', 'data2', 'read');
  await e.addPermissionForUser('data2_admin', 'data2', 'write');
  await e.addRoleForUser('alice', 'data2_admin');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', true);
  testEnforce(e, 'alice', 'data2', 'write', true);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestRBACModelInMemory2', async () => {
  const text =
    `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`;
  const m = casbin.newModel(text);
  // The above is the same as:
  // const m = casbin.newModel();
  // m.loadModelFromText(text);

  const e = await casbin.newEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'read');
  await e.addPermissionForUser('bob', 'data2', 'write');
  await e.addPermissionForUser('data2_admin', 'data2', 'read');
  await e.addPermissionForUser('data2_admin', 'data2', 'write');
  await e.addRoleForUser('alice', 'data2_admin');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', true);
  testEnforce(e, 'alice', 'data2', 'write', true);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestNotUsedRBACModelInMemory', async () => {
  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await casbin.newEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'read');
  await e.addPermissionForUser('bob', 'data2', 'write');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestReloadPolicy', async () => {
  const e = await casbin.newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  await e.loadPolicy();
  testGetPolicy(e, [['alice', 'data1', 'read'], ['bob', 'data2', 'write'], ['data2_admin', 'data2', 'read'], ['data2_admin', 'data2', 'write']]);
});

test('TestSavePolicy', async () => {
  const e = await casbin.newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  await e.savePolicy();
});

test('TestClearPolicy', async () => {
  const e = await casbin.newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  e.clearPolicy();
});

test('TestEnableEnforce', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  e.enableEnforce(false);
  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', true);
  testEnforce(e, 'alice', 'data2', 'read', true);
  testEnforce(e, 'alice', 'data2', 'write', true);
  testEnforce(e, 'bob', 'data1', 'read', true);
  testEnforce(e, 'bob', 'data1', 'write', true);
  testEnforce(e, 'bob', 'data2', 'read', true);
  testEnforce(e, 'bob', 'data2', 'write', true);

  e.enableEnforce(true);
  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestEnableLog', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv', true);
  // The log is enabled by default, so the above is the same with:
  // const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);

  // The log can also be enabled or disabled at run-time.
  e.enableLog(false);
  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestEnableAutoSave', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  e.enableAutoSave(false);
  // Because AutoSave is disabled, the policy change only affects the policy in Casbin enforcer,
  // it doesn't affect the policy in the storage.
  await e.removePolicy('alice', 'data1', 'read');
  // Reload the policy from the storage to see the effect.
  await e.loadPolicy();
  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);

  e.enableAutoSave(true);
  // Because AutoSave is enabled, the policy change not only affects the policy in Casbin enforcer,
  // but also affects the policy in the storage.
  await e.removePolicy('alice', 'data1', 'read');

  // However, the file adapter doesn't implement the AutoSave feature, so enabling it has no effect at all here.

  // Reload the policy from the storage to see the effect.
  await e.loadPolicy();
  testEnforce(e, 'alice', 'data1', 'read', true); // Will not be false here.
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestInitWithAdapter', async () => {
  const adapter = new FileAdapter('examples/basic_policy.csv');
  const e = await casbin.newEnforcer('examples/basic_model.conf', adapter);

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestRoleLinks', async () => {
  const e = await casbin.newEnforcer('examples/rbac_model.conf');
  e.enableAutoBuildRoleLinks(false);
  e.buildRoleLinks();
  e.enforce('user501', 'data9', 'read');
});

test('TestGetAndSetModel', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');
  const e2 = await casbin.newEnforcer('examples/basic_with_root_model.conf', 'examples/basic_policy.csv');

  testEnforce(e, 'root', 'data1', 'read', false);

  e.setModel(e2.getModel());

  testEnforce(e, 'root', 'data1', 'read', true);
});

test('TestGetAndSetAdapterInMem', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');
  const e2 = await casbin.newEnforcer('examples/basic_model.conf', 'examples/basic_inverse_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);

  const a2 = e2.getAdapter();
  e.setAdapter(a2);
  await e.loadPolicy();

  testEnforce(e, 'alice', 'data1', 'read', false);
  testEnforce(e, 'alice', 'data1', 'write', true);
});

test('TestSetAdapterFromFile', async () => {
  const e = await casbin.newEnforcer('examples/basic_model.conf');

  testEnforce(e, 'alice', 'data1', 'read', false);

  const a = new FileAdapter('examples/basic_policy.csv');
  e.setAdapter(a);
  await e.loadPolicy();

  testEnforce(e, 'alice', 'data1', 'read', true);
});

test('TestInitEmpty', async () => {
  const e = await casbin.newEnforcer();

  const m = casbin.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  e.setModel(m);
  e.setAdapter(a);
  await e.loadPolicy();

  testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
});
