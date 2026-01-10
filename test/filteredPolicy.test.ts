// Copyright 2025 The Casbin Authors. All Rights Reserved.
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

import { newEnforcer, newFilteredEnforcer, Enforcer } from '../src';
import { DefaultFilteredAdapter, Filter } from '../src/persist';

describe('Filtered Policy Tests', () => {
  const modelPath = 'examples/rbac_with_domains_model.conf';
  const policyPath = 'examples/rbac_with_domains_policy.csv';

  test('should create filtered enforcer with newFilteredEnforcer', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],  // Filter by domain field (second field after policy type)
      g: ['', '', 'domain1']  // Filter by domain field (third field after grouping type)
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    expect(e).toBeInstanceOf(Enforcer);
    expect(e.isFiltered()).toBe(true);
  });

  test('filtered enforcer should only load filtered policies', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // Get all policies - should only have domain1 policies
    const policies = await e.getPolicy();
    
    // All policies should be for domain1
    for (const policy of policies) {
      // For rbac_with_domains, domain is the second field (index 1)
      expect(policy[1]).toBe('domain1');
    }
  });

  test('filtered enforcer should enforce correctly', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // Test enforcement for domain1 - should work
    const result1 = await e.enforce('alice', 'domain1', 'data1', 'read');
    expect(result1).toBe(true);

    // domain2 policies are not loaded, so this should fail
    const result2 = await e.enforce('bob', 'domain2', 'data2', 'read');
    expect(result2).toBe(false);
  });

  test('filtered enforcer should allow incremental policy changes', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // Should be able to add policy even when filtered
    const added = await e.addPolicy('alice', 'domain1', 'data3', 'write');
    expect(added).toBe(true);

    // Should be able to enforce the new policy
    const result = await e.enforce('alice', 'domain1', 'data3', 'write');
    expect(result).toBe(true);

    // Should be able to remove the policy
    const removed = await e.removePolicy('alice', 'domain1', 'data3', 'write');
    expect(removed).toBe(true);
  });

  test('filtered enforcer should throw error on savePolicy', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // savePolicy should throw an error for filtered enforcer
    await expect(e.savePolicy()).rejects.toThrow('Cannot save a filtered policy');
  });

  test('loadFilteredPolicy should mark enforcer as filtered', async () => {
    const e = await newEnforcer(modelPath, new DefaultFilteredAdapter(policyPath), true); // lazyLoad=true

    expect(e.isFiltered()).toBe(false);

    await e.loadFilteredPolicy({ p: ['', 'domain1'], g: ['', '', 'domain1'] });

    expect(e.isFiltered()).toBe(true);
  });

  test('filtered enforcer should work with RBAC API', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // Should be able to add role for user
    const added = await e.addRoleForUser('bob', 'admin', 'domain1');
    expect(added).toBe(true);

    // Should be able to check role
    const hasRole = await e.hasRoleForUser('bob', 'admin', 'domain1');
    expect(hasRole).toBe(true);

    // Should be able to get roles
    const roles = await e.getRolesForUser('bob', 'domain1');
    expect(roles).toContain('admin');

    // Should be able to delete role
    const removed = await e.deleteRoleForUser('bob', 'admin', 'domain1');
    expect(removed).toBe(true);
  });

  test('loadPolicy after loadFilteredPolicy should clear filtered flag', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const e = await newEnforcer(modelPath, adapter, true);

    // Load filtered policies
    await e.loadFilteredPolicy({ p: ['', 'domain1'], g: ['', '', 'domain1'] });
    expect(e.isFiltered()).toBe(true);

    // Load all policies
    await e.loadPolicy();
    expect(e.isFiltered()).toBe(false);

    // Now savePolicy should work
    await expect(e.savePolicy()).resolves.toBe(true);
  });

  test('multiple filtered enforcers should be independent', async () => {
    const adapter1 = new DefaultFilteredAdapter(policyPath);
    const adapter2 = new DefaultFilteredAdapter(policyPath);

    const e1 = await newFilteredEnforcer(modelPath, adapter1, { p: ['', 'domain1'], g: ['', '', 'domain1'] });
    const e2 = await newFilteredEnforcer(modelPath, adapter2, { p: ['', 'domain2'], g: ['', '', 'domain2'] });

    // Add policy to e1
    await e1.addPolicy('test_user', 'domain1', 'test_data', 'read');

    // e1 should have the policy
    const has1 = await e1.hasPolicy('test_user', 'domain1', 'test_data', 'read');
    expect(has1).toBe(true);

    // e2 should not have the policy
    const has2 = await e2.hasPolicy('test_user', 'domain1', 'test_data', 'read');
    expect(has2).toBe(false);
  });

  test('should get permissions for user with filtered enforcer', async () => {
    const adapter = new DefaultFilteredAdapter(policyPath);
    const filter: Filter = {
      p: ['', 'domain1'],
      g: ['', '', 'domain1']
    };

    const e = await newFilteredEnforcer(modelPath, adapter, filter);

    // Get permissions for admin role (which has direct permissions)
    const permissions = await e.getPermissionsForUser('admin');
    
    // Should have some permissions
    expect(permissions.length).toBeGreaterThan(0);
    
    // All permissions should be for domain1
    for (const perm of permissions) {
      expect(perm[1]).toBe('domain1'); // domain is at index 1
    }
    
    // Alice should have roles in domain1
    const roles = await e.getRolesForUser('alice', 'domain1');
    expect(roles).toContain('admin');
  });
});
