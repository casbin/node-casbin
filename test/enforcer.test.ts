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
import { FileAdapter } from '../src/persist';

function testEnforce(e: Enforcer, sub: string, obj: string, act: string, res: boolean): void {
  expect(e.enforce(sub, obj, act)).toBe(res);
}

test('testKeyMatchModelInMemory', () => {
  const m = Enforcer.newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'r.sub == p.sub && keyMatch(r.obj, p.obj) && regexMatch(r.act, p.act)');

  const a = new FileAdapter('examples/keymatch_policy.csv');

  let e = Enforcer.newEnforcer(m, a);

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

  e = Enforcer.newEnforcer(m);
  a.loadPolicy(e.getModel());

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
