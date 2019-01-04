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

function testStringList(e: Enforcer, title: string, f: () => string[], res: string[]) {
  const myRes = f.call(e);
  console.log(title + ': ', myRes);

  expect(Util.arrayEquals(res, myRes)).toBe(true);
}

test('TestGetList', async () => {
  const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');

  testStringList(e, 'Subjects', e.getAllSubjects, ['alice', 'bob', 'data2_admin']);
  testStringList(e, 'Objects', e.getAllObjects, ['data1', 'data2']);
  testStringList(e, 'Actions', e.getAllActions, ['read', 'write']);
  testStringList(e, 'Roles', e.getAllRoles, ['data2_admin']);
});
