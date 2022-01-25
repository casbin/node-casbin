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

test('test getRolesForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getRolesForUser('alice')).toEqual(['admin']);
});

test('test getRolesForUser with domain', async () => {
  const e = await newEnforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_hierarchy_with_domains_policy.csv');
  expect(await e.getRolesForUser('alice', 'domain1')).toEqual(['role:global_admin']);
});

test('test add/deleteRoleForUSer with domain', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getRolesForUser('bob')).toEqual([]);
  expect(await e.addRoleForUser('bob', 'data1_admin')).toEqual(true);
  expect(await e.hasRoleForUser('bob', 'data1_admin')).toEqual(true);
  expect(await e.getUsersForRole('data1_admin')).toEqual(['admin', 'bob']);
  expect(await e.deleteRoleForUser('bob', 'data1_admin')).toEqual(true);
  expect(await e.hasRoleForUser('bob', 'role:global_admin')).toEqual(false);
  expect(await e.getUsersForRole('data1_admin')).toEqual(['admin']);
});

test('test add/deleteRoleForUSer with domain', async () => {
  const e = await newEnforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_hierarchy_with_domains_policy.csv');
  expect(await e.getRolesForUser('bob', 'domain1')).toEqual([]);
  expect(await e.addRoleForUser('bob', 'role:global_admin', 'domain1')).toEqual(true);
  expect(await e.hasRoleForUser('bob', 'role:global_admin', 'domain1')).toEqual(true);
  expect(await e.getUsersForRole('role:global_admin', 'domain1')).toEqual(['alice', 'bob']);
  expect(await e.deleteRoleForUser('bob', 'role:global_admin', 'domain1')).toEqual(true);
  expect(await e.hasRoleForUser('bob', 'role:global_admin', 'domain1')).toEqual(false);
  expect(await e.getUsersForRole('role:global_admin', 'domain1')).toEqual(['alice']);
});

test('test getImplicitRolesForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitRolesForUser('bob')).toEqual([]);
  expect(await e.getImplicitRolesForUser('alice')).toEqual(['admin', 'data1_admin', 'data2_admin']);
});

test('test getImplicitRolesForUser with domain', async () => {
  const e = await newEnforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_hierarchy_with_domains_policy.csv');
  expect(await e.getImplicitRolesForUser('alice', 'domain1')).toEqual(['role:global_admin', 'role:reader', 'role:writer']);
});

test('test getImplicitPermissionsForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.hasPermissionForUser('bob', 'data2', 'write')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.hasPermissionForUser('alice', 'data1', 'read')).toEqual(true);
  expect(await e.hasPermissionForUser('data1_admin', 'data1', 'read')).toEqual(true);
  expect(await e.hasPermissionForUser('data1_admin', 'data1', 'write')).toEqual(true);
  expect(await e.hasPermissionForUser('data2_admin', 'data2', 'read')).toEqual(true);
  expect(await e.hasPermissionForUser('data2_admin', 'data2', 'write')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data1_admin', 'data1', 'read'],
    ['data1_admin', 'data1', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
});

test('test deleteRolesForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.hasPermissionForUser('bob', 'data2', 'write')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data1_admin', 'data1', 'read'],
    ['data1_admin', 'data1', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
  expect(await e.deleteRolesForUser('alice')).toEqual(true);
  expect(await e.hasPermissionForUser('alice', 'data1', 'read')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([['alice', 'data1', 'read']]);
  expect(await e.hasPermissionForUser('bob', 'data2', 'write')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.deleteRolesForUser('bob')).toEqual(false);
  expect(await e.hasPermissionForUser('alice', 'data1', 'read')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([['alice', 'data1', 'read']]);
  expect(await e.hasPermissionForUser('bob', 'data2', 'write')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
});

test('test deleteRolesForUser with domain', async () => {
  const e = await newEnforcer('examples/rbac_with_domains_model.conf', 'examples/rbac_with_domains_policy.csv');
  expect(await e.getImplicitRolesForUser('alice', 'domain1')).toEqual(['admin']);
  expect(await e.getImplicitPermissionsForUser('alice', 'domain1')).toEqual([
    ['admin', 'domain1', 'data1', 'read'],
    ['admin', 'domain1', 'data1', 'write'],
  ]);
  expect(await e.getImplicitPermissionsForUser('bob', 'domain2')).toEqual([
    ['admin', 'domain2', 'data2', 'read'],
    ['admin', 'domain2', 'data2', 'write'],
  ]);
  expect(await e.deleteRolesForUser('alice', 'domain1')).toEqual(true);
  expect(await e.getImplicitRolesForUser('alice', 'domain1')).toEqual([]);
  expect(await e.getImplicitPermissionsForUser('alice', 'domain2')).toEqual([]);
  expect(await e.getImplicitPermissionsForUser('bob', 'domain2')).toEqual([
    ['admin', 'domain2', 'data2', 'read'],
    ['admin', 'domain2', 'data2', 'write'],
  ]);
  expect(await e.deleteRolesForUser('bob', 'domain1')).toEqual(false);
  expect(await e.getImplicitPermissionsForUser('alice', 'domain2')).toEqual([]);
  expect(await e.getImplicitPermissionsForUser('bob', 'domain1')).toEqual([]);
});

test('test deleteRole', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data1_admin', 'data1', 'read'],
    ['data1_admin', 'data1', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
  expect(await e.deleteRole('data1_admin')).toEqual(true);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
  await e.deleteRole('data2_admin');
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([['alice', 'data1', 'read']]);
});

test('test deleteUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([
    ['alice', 'data1', 'read'],
    ['data1_admin', 'data1', 'read'],
    ['data1_admin', 'data1', 'write'],
    ['data2_admin', 'data2', 'read'],
    ['data2_admin', 'data2', 'write'],
  ]);
  await e.deleteUser('alice');
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([]);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([['bob', 'data2', 'write']]);
  await e.deleteRole('bob');
  expect(await e.getImplicitPermissionsForUser('alice')).toEqual([]);
  expect(await e.getImplicitPermissionsForUser('bob')).toEqual([]);
});

test('test getImplicitUsersForPermission', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitUsersForPermission('data1', 'read')).toEqual(['alice']);
  expect(await e.getImplicitUsersForPermission('data1', 'write')).toEqual(['alice']);
  expect(await e.getImplicitUsersForPermission('data2', 'read')).toEqual(['alice']);
  expect(await e.getImplicitUsersForPermission('data2', 'write')).toEqual(['alice', 'bob']);

  e.clearPolicy();

  await e.addPolicy('admin', 'data1', 'read');
  await e.addPolicy('bob', 'data1', 'read');
  await e.addGroupingPolicy('alice', 'admin');

  expect(await e.getImplicitUsersForPermission('data1', 'read')).toEqual(['bob', 'alice']);
});

test('test getImplicitUsersForRole', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  expect(await e.getImplicitUsersForRole('admin')).toEqual(['alice']);
  expect(await e.getImplicitUsersForRole('data1_admin')).toEqual(['admin', 'alice']);
});
