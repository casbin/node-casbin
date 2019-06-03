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

import { newModel, newEnforcer, Enforcer, FileAdapter, Util, newRBACOperator } from '../src';

async function testEnforce(e: Enforcer, sub: string, obj: string, act: string, res: boolean) {
  await expect(e.enforce(sub, obj, act)).resolves.toBe(res);
}

function testGetPolicy(e: Enforcer, res: string[][]) {
  const myRes = e.getPolicy();
  console.log('Policy: ', myRes);

  expect(Util.array2DEquals(res, myRes)).toBe(true);
}

test('TestKeyMatchModelInMemory', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  let e = await newEnforcer(m, a);

  await testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
  await testEnforce(e, 'alice', '/alice_data/resource1', 'POST', true);
  await testEnforce(e, 'alice', '/alice_data/resource2', 'GET', true);
  await testEnforce(e, 'alice', '/alice_data/resource2', 'POST', false);
  await testEnforce(e, 'alice', '/bob_data/resource1', 'GET', false);
  await testEnforce(e, 'alice', '/bob_data/resource1', 'POST', false);
  await testEnforce(e, 'alice', '/bob_data/resource2', 'GET', false);
  await testEnforce(e, 'alice', '/bob_data/resource2', 'POST', false);

  await testEnforce(e, 'bob', '/alice_data/resource1', 'GET', false);
  await testEnforce(e, 'bob', '/alice_data/resource1', 'POST', false);
  await testEnforce(e, 'bob', '/alice_data/resource2', 'GET', true);
  await testEnforce(e, 'bob', '/alice_data/resource2', 'POST', false);
  await testEnforce(e, 'bob', '/bob_data/resource1', 'GET', false);
  await testEnforce(e, 'bob', '/bob_data/resource1', 'POST', true);
  await testEnforce(e, 'bob', '/bob_data/resource2', 'GET', false);
  await testEnforce(e, 'bob', '/bob_data/resource2', 'POST', true);

  await testEnforce(e, 'cathy', '/cathy_data', 'GET', true);
  await testEnforce(e, 'cathy', '/cathy_data', 'POST', true);
  await testEnforce(e, 'cathy', '/cathy_data', 'DELETE', false);

  e = await newEnforcer(m);
  await a.loadPolicy(e.getModel());

  await testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
  await testEnforce(e, 'alice', '/alice_data/resource1', 'POST', true);
  await testEnforce(e, 'alice', '/alice_data/resource2', 'GET', true);
  await testEnforce(e, 'alice', '/alice_data/resource2', 'POST', false);
  await testEnforce(e, 'alice', '/bob_data/resource1', 'GET', false);
  await testEnforce(e, 'alice', '/bob_data/resource1', 'POST', false);
  await testEnforce(e, 'alice', '/bob_data/resource2', 'GET', false);
  await testEnforce(e, 'alice', '/bob_data/resource2', 'POST', false);

  await testEnforce(e, 'bob', '/alice_data/resource1', 'GET', false);
  await testEnforce(e, 'bob', '/alice_data/resource1', 'POST', false);
  await testEnforce(e, 'bob', '/alice_data/resource2', 'GET', true);
  await testEnforce(e, 'bob', '/alice_data/resource2', 'POST', false);
  await testEnforce(e, 'bob', '/bob_data/resource1', 'GET', false);
  await testEnforce(e, 'bob', '/bob_data/resource1', 'POST', true);
  await testEnforce(e, 'bob', '/bob_data/resource2', 'GET', false);
  await testEnforce(e, 'bob', '/bob_data/resource2', 'POST', true);

  await testEnforce(e, 'cathy', '/cathy_data', 'GET', true);
  await testEnforce(e, 'cathy', '/cathy_data', 'POST', true);
  await testEnforce(e, 'cathy', '/cathy_data', 'DELETE', false);
});

test('TestKeyMatchModelInMemoryDeny', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', '!some(where (p.eft == deny))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  const e = await newEnforcer(m, a);

  await testEnforce(e, 'alice', '/alice_data/resource2', 'POST', true);
});

test('TestRBACModelInMemoryIndeterminate', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await newEnforcer(m);

  await newRBACOperator(e).addPermissionForUser('alice', 'data1', 'invalid');

  await testEnforce(e, 'alice', 'data1', 'read', false);
});

test('TestRBACModelInMemory', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await newEnforcer(m);
  const operator = newRBACOperator(e);

  await operator.addPermissionForUser('alice', 'data1', 'read');
  await operator.addPermissionForUser('bob', 'data2', 'write');
  await operator.addPermissionForUser('data2_admin', 'data2', 'read');
  await operator.addPermissionForUser('data2_admin', 'data2', 'write');
  await operator.addRoleForUser('alice', 'data2_admin');

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', true);
  await testEnforce(e, 'alice', 'data2', 'write', true);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
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
  const m = newModel(text);
  // The above is the same as:
  // const m = newModel();
  // m.loadModelFromText(text);

  const e = await newEnforcer(m);
  const operator = newRBACOperator(e);

  await operator.addPermissionForUser('alice', 'data1', 'read');
  await operator.addPermissionForUser('bob', 'data2', 'write');
  await operator.addPermissionForUser('data2_admin', 'data2', 'read');
  await operator.addPermissionForUser('data2_admin', 'data2', 'write');
  await operator.addRoleForUser('alice', 'data2_admin');

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', true);
  await testEnforce(e, 'alice', 'data2', 'write', true);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestNotUsedRBACModelInMemory', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await newEnforcer(m);
  const operator = newRBACOperator(e);

  await operator.addPermissionForUser('alice', 'data1', 'read');
  await operator.addPermissionForUser('bob', 'data2', 'write');

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestReloadPolicy', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  await e.loadPolicy();
  testGetPolicy(e, [['alice', 'data1', 'read'], ['bob', 'data2', 'write'], ['data2_admin', 'data2', 'read'], ['data2_admin', 'data2', 'write']]);
});

test('TestSavePolicy', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  await e.savePolicy();
});

test('TestClearPolicy', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  e.clearPolicy();
});

test('TestEnableEnforce', async () => {
  const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  e.enableEnforce(false);
  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', true);
  await testEnforce(e, 'alice', 'data2', 'read', true);
  await testEnforce(e, 'alice', 'data2', 'write', true);
  await testEnforce(e, 'bob', 'data1', 'read', true);
  await testEnforce(e, 'bob', 'data1', 'write', true);
  await testEnforce(e, 'bob', 'data2', 'read', true);
  await testEnforce(e, 'bob', 'data2', 'write', true);

  e.enableEnforce(true);
  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestEnableLog', async () => {
  const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv', true);
  // The log is enabled by default, so the above is the same with:
  // const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);

  // The log can also be enabled or disabled at run-time.
  e.enableLog(false);
  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestEnableAutoSave', async () => {
  const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  e.enableAutoSave(false);
  // Because AutoSave is disabled, the policy change only affects the policy in Casbin enforcer,
  // it doesn't affect the policy in the storage.
  await e.removePolicy('alice', 'data1', 'read');
  // Reload the policy from the storage to see the effect.
  await e.loadPolicy();
  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);

  e.enableAutoSave(true);
  // TODO debug
  // Because AutoSave is enabled, the policy change not only affects the policy in Casbin enforcer,
  // but also affects the policy in the storage.
  // await e.removePolicy('alice', 'data1', 'read');

  // However, the file adapter doesn't implement the AutoSave feature, so enabling it has no effect at all here.

  // Reload the policy from the storage to see the effect.
  // await e.loadPolicy();
  await testEnforce(e, 'alice', 'data1', 'read', true); // Will not be false here.
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestInitWithAdapter', async () => {
  const adapter = new FileAdapter('examples/basic_policy.csv');
  const e = await newEnforcer('examples/basic_model.conf', adapter);

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);
  await testEnforce(e, 'alice', 'data2', 'read', false);
  await testEnforce(e, 'alice', 'data2', 'write', false);
  await testEnforce(e, 'bob', 'data1', 'read', false);
  await testEnforce(e, 'bob', 'data1', 'write', false);
  await testEnforce(e, 'bob', 'data2', 'read', false);
  await testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestRoleLinks', async () => {
  const e = await newEnforcer('examples/rbac_model.conf');
  e.enableAutoBuildRoleLinks(false);
  await e.buildRoleLinks();
  await e.enforce('user501', 'data9', 'read');
});

test('TestGetAndSetModel', async () => {
  const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');
  const e2 = await newEnforcer('examples/basic_with_root_model.conf', 'examples/basic_policy.csv');

  await testEnforce(e, 'root', 'data1', 'read', false);

  e.setModel(e2.getModel());

  await testEnforce(e, 'root', 'data1', 'read', true);
});

test('TestGetAndSetAdapterInMem', async () => {
  const e = await newEnforcer('examples/basic_model.conf', 'examples/basic_policy.csv');
  const e2 = await newEnforcer('examples/basic_model.conf', 'examples/basic_inverse_policy.csv');

  await testEnforce(e, 'alice', 'data1', 'read', true);
  await testEnforce(e, 'alice', 'data1', 'write', false);

  const a2 = e2.getAdapter();
  e.setAdapter(a2);
  await e.loadPolicy();
  await testEnforce(e, 'alice', 'data1', 'read', false);
  await testEnforce(e, 'alice', 'data1', 'write', true);
});

test('TestSetAdapterFromFile', async () => {
  const e = await newEnforcer('examples/basic_model.conf');

  await testEnforce(e, 'alice', 'data1', 'read', false);

  const a = new FileAdapter('examples/basic_policy.csv');
  e.setAdapter(a);
  await e.loadPolicy();

  await testEnforce(e, 'alice', 'data1', 'read', true);
});

test('TestInitEmpty', async () => {
  const e = await newEnforcer();

  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  e.setModel(m);
  e.setAdapter(a);
  await e.loadPolicy();

  await testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
});
