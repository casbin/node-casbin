// Copyright 2020 The Casbin Authors. All Rights Reserved.
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

import { newEnforcer } from '../src/index';
import { casbinJsGetPermissionForUser } from '../src/frontend';

test('TestCasbinJsGetPermissionForUser', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
  let permStr = await casbinJsGetPermissionForUser(e, 'alice');
  let perm = JSON.parse(permStr);
  expect(perm['read']).toContain('data1');
  expect(perm['write']).toContain('data1');
  expect(perm['read']).toContain('data2');
  expect(perm['write']).toContain('data2');

  permStr = await casbinJsGetPermissionForUser(e, 'bob');
  perm = JSON.parse(permStr);
  expect(perm['write']).toContain('data2');
  expect(perm['write']).not.toContain('data1');
  expect(perm['read']).not.toBeNull;
  expect(perm['rm_rf']).toBeNull;
});
