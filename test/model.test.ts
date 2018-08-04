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

function testEnforce(e: Enforcer, sub: string, obj: string, act: string, res: boolean): void {
  expect(e.enforce(sub, obj, act)).toBe(res);
}

function testEnforceWithoutUsers(e: Enforcer, obj: string, act: string, res: boolean): void {
  expect(e.enforce(obj, act)).toBe(res);
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
