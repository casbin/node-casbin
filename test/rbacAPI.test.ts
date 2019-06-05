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

import { newEnforcer } from '../src';

it('test getImplicitRolesForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitRolesForUser('bob')).toEqual([]);
  expect(await e.getImplicitRolesForUser('alice')).toEqual(['admin', 'data1_admin', 'data2_admin']);
});

it('test getImplicitRolesForUser with domain', async () => {
  const e = await newEnforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_hierarchy_with_domains_policy.csv');
  expect(await e.getImplicitRolesForUser('alice', 'domain1')).toEqual(['role:global_admin', 'role:reader', 'role:writer']);
});

it('test getImplicitPermissionsForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data1_admin', 'data1', 'read'],
    ['data1_admin', 'data1', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write']
  ]);
});
