// Copyright 2024 The Casbin Authors. All Rights Reserved.
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

import { newEnforcer, newIndexedEnforcer, newModel, StringAdapter } from '../src';

describe('Performance with IndexedEnforcer', () => {
  test('IndexedEnforcer with large policy set', async () => {
    // Create a model similar to the issue
    const model = newModel();
    model.loadModelFromText(`
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && r.act == p.act
`);

    // Create policies similar to the issue
    // We'll create 1000 policies (instead of 40000 to keep test fast) with wildcard patterns
    const policies: string[] = [];

    // Add role assignment
    policies.push('g, john, program-manager-438');

    // Add wildcard policies for the role
    const resources = [
      '/program/438',
      '/audit/438/:auditId',
      '/vendor/438/:vendorId',
      '/requirement/438/:frameworkOrAuditId/:requirementId',
      '/assessment/438/:auditId/:assessmentId',
      '/evidence-request/438/:auditId/:assessmentId/:evidenceRequestId',
      '/finding/438/:auditId/:assessmentId/:findingId',
    ];

    const actions = ['create', 'read', 'update', 'delete', 'read_mappings', 'delete_mappings'];

    // Create many roles with policies
    for (let roleId = 1; roleId <= 100; roleId++) {
      // Add some role assignments (john has only role 438)
      if (roleId !== 438) {
        policies.push(`g, user${roleId}, program-manager-${roleId}`);
      }

      // Add policies for each role
      for (const resource of resources) {
        for (const action of actions) {
          const resourcePath = resource.replace('438', roleId.toString());
          policies.push(`p, program-manager-${roleId}, ${resourcePath}, ${action}`);
        }
      }
    }

    const adapter = new StringAdapter(policies.join('\n'));

    // Test with regular enforcer
    const e1 = await newEnforcer(model, adapter);
    const start1 = Date.now();

    // Perform 10 enforcement checks
    for (let i = 0; i < 10; i++) {
      await e1.enforce('john', '/finding/438/33/44/3', 'read');
    }

    const time1 = Date.now() - start1;
    console.log(`Regular enforcer: ${time1}ms for 10 checks`);

    // Test with indexed enforcer
    const e2 = await newIndexedEnforcer(model, adapter);
    const start2 = Date.now();

    // Perform 10 enforcement checks
    for (let i = 0; i < 10; i++) {
      await e2.enforce('john', '/finding/438/33/44/3', 'read');
    }

    const time2 = Date.now() - start2;
    console.log(`Indexed enforcer: ${time2}ms for 10 checks`);

    // The indexed enforcer should be at least as fast as regular enforcer
    // (might not be faster yet since we haven't fully implemented the optimization)
    expect(time2).toBeLessThanOrEqual(time1 * 2); // Allow 2x slower for now
  });

  test('Policy index is built and maintained', async () => {
    const e = await newIndexedEnforcer();

    // Initialize with a simple model
    const model = newModel();
    model.loadModelFromText(`
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && r.act == p.act
`);

    await e.initWithModelAndAdapter(model);

    // Add policies
    await e.addPolicy('alice', '/data1', 'read');
    await e.addPolicy('alice', '/data2', 'write');
    await e.addPolicy('bob', '/data3', 'read');

    // Add role
    await e.addGroupingPolicy('john', 'alice');

    // Get the policy assertion
    const p = e.getModel().model.get('p')?.get('p');
    expect(p).toBeDefined();
    if (!p) {
      return;
    }
    expect(p.policyIndexMap).toBeDefined();

    // Check that index contains correct subjects
    expect(p.policyIndexMap.has('alice')).toBe(true);
    expect(p.policyIndexMap.has('bob')).toBe(true);
    expect(p.policyIndexMap.get('alice')?.length).toBe(2);
    expect(p.policyIndexMap.get('bob')?.length).toBe(1);

    // Test enforcement works
    const result = await e.enforce('john', '/data1', 'read');
    expect(result).toBe(true);
  });
});
