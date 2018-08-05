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

import { Enforcer } from '../src/enforcer';

function testEnforce(e: Enforcer, sub: string, obj: any, act: string, res: boolean): void {
  expect(e.enforce(sub, obj, act)).toBe(res);
}

function testEnforceWithoutUsers(e: Enforcer, obj: string, act: string, res: boolean): void {
  expect(e.enforce(obj, act)).toBe(res);
}

function testDomainEnforce(e: Enforcer, sub: string, dom: string, obj: string, act: string, res: boolean): void {
  expect(e.enforce(sub, dom, obj, act)).toBe(res);
}

test('TestBasicModel', () => {
  const e = new Enforcer('examples/basic_model.conf', 'examples/basic_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestBasicModelNoPolicy', () => {
  const e = new Enforcer('examples/basic_model.conf');

  testEnforce(e, 'alice', 'data1', 'read', false);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', false);
});

test('TestBasicModelWithRoot', () => {
  const e = new Enforcer('examples/basic_with_root_model.conf', 'examples/basic_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
  testEnforce(e, 'root', 'data1', 'read', true);
  testEnforce(e, 'root', 'data1', 'write', true);
  testEnforce(e, 'root', 'data2', 'read', true);
  testEnforce(e, 'root', 'data2', 'write', true);
});

test('TestBasicModelWithRootNoPolicy', () => {
  const e = new Enforcer('examples/basic_with_root_model.conf');

  testEnforce(e, 'alice', 'data1', 'read', false);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', false);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', false);
  testEnforce(e, 'root', 'data1', 'read', true);
  testEnforce(e, 'root', 'data1', 'write', true);
  testEnforce(e, 'root', 'data2', 'read', true);
  testEnforce(e, 'root', 'data2', 'write', true);
});

test('TestBasicModelWithoutUsers', () => {
  const e = new Enforcer('examples/basic_without_users_model.conf', 'examples/basic_without_users_policy.csv');

  testEnforceWithoutUsers(e, 'data1', 'read', true);
  testEnforceWithoutUsers(e, 'data1', 'write', false);
  testEnforceWithoutUsers(e, 'data2', 'read', false);
  testEnforceWithoutUsers(e, 'data2', 'write', true);
});

test('TestBasicModelWithoutResources', () => {
  const e = new Enforcer('examples/basic_without_resources_model.conf', 'examples/basic_without_resources_policy.csv');

  testEnforceWithoutUsers(e, 'alice', 'read', true);
  testEnforceWithoutUsers(e, 'alice', 'write', false);
  testEnforceWithoutUsers(e, 'bob', 'read', false);
  testEnforceWithoutUsers(e, 'bob', 'write', true);
});

test('TestRBACModel', () => {
  const e = new Enforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', false);
  testEnforce(e, 'alice', 'data2', 'read', true);
  testEnforce(e, 'alice', 'data2', 'write', true);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestRBACModelWithResourceRoles', () => {
  const e = new Enforcer('examples/rbac_with_resource_roles_model.conf', 'examples/rbac_with_resource_roles_policy.csv');

  testEnforce(e, 'alice', 'data1', 'read', true);
  testEnforce(e, 'alice', 'data1', 'write', true);
  testEnforce(e, 'alice', 'data2', 'read', false);
  testEnforce(e, 'alice', 'data2', 'write', true);
  testEnforce(e, 'bob', 'data1', 'read', false);
  testEnforce(e, 'bob', 'data1', 'write', false);
  testEnforce(e, 'bob', 'data2', 'read', false);
  testEnforce(e, 'bob', 'data2', 'write', true);
});

test('TestRBACModelWithDomains', () => {
  const e = new Enforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_domains_policy.csv');

  testDomainEnforce(e, 'alice', 'domain1', 'data1', 'read', true);
  testDomainEnforce(e, 'alice', 'domain1', 'data1', 'write', true);
  testDomainEnforce(e, 'alice', 'domain1', 'data2', 'read', false);
  testDomainEnforce(e, 'alice', 'domain1', 'data2', 'write', false);
  testDomainEnforce(e, 'bob', 'domain2', 'data1', 'read', false);
  testDomainEnforce(e, 'bob', 'domain2', 'data1', 'write', false);
  testDomainEnforce(e, 'bob', 'domain2', 'data2', 'read', true);
  testDomainEnforce(e, 'bob', 'domain2', 'data2', 'write', true);
});

class TestResource {
  public Name: string;
  public Owner: string;

  constructor(name: string, owner: string) {
    this.Name = name;
    this.Owner = owner;
  }
}

test('TestABACModel', () => {
  const e = new Enforcer('examples/abac_model.conf');

  const data1 = new TestResource('data1', 'alice');
  const data2 = new TestResource('data2', 'bob');

  testEnforce(e, 'alice', data1, 'read', true);
  testEnforce(e, 'alice', data1, 'write', true);
  testEnforce(e, 'alice', data2, 'read', false);
  testEnforce(e, 'alice', data2, 'write', false);
  testEnforce(e, 'bob', data1, 'read', false);
  testEnforce(e, 'bob', data1, 'write', false);
  testEnforce(e, 'bob', data2, 'read', true);
  testEnforce(e, 'bob', data2, 'write', true);
});

test('TestKeyMatchModel', () => {
  const e = new Enforcer('examples/keymatch_model.conf', 'examples/keymatch_policy.csv');

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

test('TestKeyMatch2Model', () => {
  const e = new Enforcer('examples/keymatch2_model.conf', 'examples/keymatch2_policy.csv');

  testEnforce(e, 'alice', '/alice_data', 'GET', false);
  testEnforce(e, 'alice', '/alice_data/resource1', 'GET', true);
  testEnforce(e, 'alice', '/alice_data2/myid', 'GET', false);
  testEnforce(e, 'alice', '/alice_data2/myid/using/res_id', 'GET', true);
});

function customFunction(key1: string, key2: string): boolean {
  if (key1 === '/alice_data2/myid/using/res_id' && key2 === '/alice_data/:resource') {
    return true;
  } else if (key1 === '/alice_data2/myid/using/res_id' && key2 === '/alice_data2/:id/using/:resId') {
    return true;
  } else {
    return false;
  }
}

function customFunctionWrapper(...args: any[]): boolean {
  const name1: string = _.toString(args[0]);
  const name2: string = _.toString(args[1]);

  return customFunction(name1, name2);
}

test('TestKeyMatchCustomModel', () => {
  const e = new Enforcer('examples/keymatch_custom_model.conf', 'examples/keymatch2_policy.csv');

  // e.addFunction('keyMatchCustom', customFunctionWrapper);

  testEnforce(e, 'alice', '/alice_data2/myid', 'GET', false);
  testEnforce(e, 'alice', '/alice_data2/myid/using/res_id', 'GET', true);
});

test('TestIPMatchModel', () => {
  const e = new Enforcer('examples/ipmatch_model.conf', 'examples/ipmatch_policy.csv');

  testEnforce(e, '192.168.2.123', 'data1', 'read', true);
  testEnforce(e, '192.168.2.123', 'data1', 'write', false);
  testEnforce(e, '192.168.2.123', 'data2', 'read', false);
  testEnforce(e, '192.168.2.123', 'data2', 'write', false);

  testEnforce(e, '192.168.0.123', 'data1', 'read', false);
  testEnforce(e, '192.168.0.123', 'data1', 'write', false);
  testEnforce(e, '192.168.0.123', 'data2', 'read', false);
  testEnforce(e, '192.168.0.123', 'data2', 'write', false);

  testEnforce(e, '10.0.0.5', 'data1', 'read', false);
  testEnforce(e, '10.0.0.5', 'data1', 'write', false);
  testEnforce(e, '10.0.0.5', 'data2', 'read', false);
  testEnforce(e, '10.0.0.5', 'data2', 'write', true);

  testEnforce(e, '192.168.0.1', 'data1', 'read', false);
  testEnforce(e, '192.168.0.1', 'data1', 'write', false);
  testEnforce(e, '192.168.0.1', 'data2', 'read', false);
  testEnforce(e, '192.168.0.1', 'data2', 'write', false);
});
