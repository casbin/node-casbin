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

import { newEnforcer, Enforcer, Model } from '../src';
import { Adapter } from '../src';

// Mock adapter that tracks method calls
class MockAdapter implements Adapter {
  public addPolicyCalled = false;
  public removePolicyCalled = false;
  public addPoliciesCalled = false;
  public removePoliciesCalled = false;

  async loadPolicy(model: Model): Promise<void> {
    // No-op
  }

  async savePolicy(model: Model): Promise<boolean> {
    throw new Error('not implemented');
  }

  async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.addPolicyCalled = true;
  }

  async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.removePolicyCalled = true;
  }

  async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    throw new Error('not implemented');
  }
}

// Mock adapter that also implements BatchAdapter
class MockBatchAdapter extends MockAdapter {
  async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.addPoliciesCalled = true;
  }

  async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.removePoliciesCalled = true;
  }
}

describe('Self* methods should not call adapter', () => {
  let e: Enforcer;
  let adapter: MockBatchAdapter;

  beforeEach(async () => {
    adapter = new MockBatchAdapter();
    e = await newEnforcer('examples/rbac_model.conf', adapter);

    // Load initial policy manually
    await e.addPolicy('alice', 'data1', 'read');
    await e.addPolicy('bob', 'data2', 'write');

    // Reset flags after setup
    adapter.addPolicyCalled = false;
    adapter.removePolicyCalled = false;
    adapter.addPoliciesCalled = false;
    adapter.removePoliciesCalled = false;
  });

  test('selfAddPolicy should not call adapter', async () => {
    const result = await e.selfAddPolicy('p', 'p', ['charlie', 'data3', 'read']);

    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(false);

    // Verify the policy was added to the model
    const hasPolicy = await e.hasPolicy('charlie', 'data3', 'read');
    expect(hasPolicy).toBe(true);
  });

  test('selfRemovePolicy should not call adapter', async () => {
    const result = await e.selfRemovePolicy('p', 'p', ['alice', 'data1', 'read']);

    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);

    // Verify the policy was removed from the model
    const hasPolicy = await e.hasPolicy('alice', 'data1', 'read');
    expect(hasPolicy).toBe(false);
  });

  test('selfAddPolicies should not call adapter', async () => {
    const rules = [
      ['charlie', 'data3', 'read'],
      ['david', 'data4', 'write'],
    ];
    const result = await e.selfAddPolicies('p', 'p', rules);

    expect(result).toBe(true);
    expect(adapter.addPoliciesCalled).toBe(false);

    // Verify the policies were added to the model
    expect(await e.hasPolicy('charlie', 'data3', 'read')).toBe(true);
    expect(await e.hasPolicy('david', 'data4', 'write')).toBe(true);
  });

  test('selfRemovePolicies should not call adapter', async () => {
    const rules = [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
    ];
    const result = await e.selfRemovePolicies('p', 'p', rules);

    expect(result).toBe(true);
    expect(adapter.removePoliciesCalled).toBe(false);

    // Verify the policies were removed from the model
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('bob', 'data2', 'write')).toBe(false);
  });

  test('selfUpdatePolicy should not call adapter', async () => {
    const result = await e.selfUpdatePolicy('p', 'p', ['alice', 'data1', 'read'], ['alice', 'data1', 'write']);

    expect(result).toBe(true);
    // Note: updatePolicy is not in our basic MockAdapter, but we verify it doesn't call addPolicy or removePolicy
    expect(adapter.addPolicyCalled).toBe(false);
    expect(adapter.removePolicyCalled).toBe(false);

    // Verify the policy was updated in the model
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('alice', 'data1', 'write')).toBe(true);
  });

  test('selfRemoveFilteredPolicy should not call adapter', async () => {
    await e.addPolicy('alice', 'data2', 'read');
    adapter.addPolicyCalled = false;

    const result = await e.selfRemoveFilteredPolicy('p', 'p', 0, ['alice']);

    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);

    // Verify the filtered policies were removed from the model
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('alice', 'data2', 'read')).toBe(false);
  });

  test('regular addPolicy should call adapter with autoSave enabled', async () => {
    e.enableAutoSave(true);
    const result = await e.addPolicy('charlie', 'data3', 'read');

    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(true);
  });

  test('regular removePolicy should call adapter with autoSave enabled', async () => {
    e.enableAutoSave(true);
    const result = await e.removePolicy('alice', 'data1', 'read');

    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(true);
  });

  test('self* methods work correctly even when autoSave is disabled', async () => {
    e.enableAutoSave(false);

    const addResult = await e.selfAddPolicy('p', 'p', ['charlie', 'data3', 'read']);
    expect(addResult).toBe(true);
    expect(adapter.addPolicyCalled).toBe(false);
    expect(await e.hasPolicy('charlie', 'data3', 'read')).toBe(true);

    const removeResult = await e.selfRemovePolicy('p', 'p', ['charlie', 'data3', 'read']);
    expect(removeResult).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);
    expect(await e.hasPolicy('charlie', 'data3', 'read')).toBe(false);
  });
});

describe('Self* methods with RBAC', () => {
  let e: Enforcer;
  let adapter: MockBatchAdapter;

  beforeEach(async () => {
    adapter = new MockBatchAdapter();
    e = await newEnforcer('examples/rbac_model.conf', adapter);

    // Load initial policy manually
    await e.addGroupingPolicy('alice', 'admin');
    await e.addPolicy('admin', 'data1', 'read');

    // Reset flags after setup
    adapter.addPolicyCalled = false;
    adapter.removePolicyCalled = false;
    adapter.addPoliciesCalled = false;
    adapter.removePoliciesCalled = false;
  });

  test('selfAddPolicy with roles should not call adapter', async () => {
    const result = await e.selfAddPolicy('g', 'g', ['bob', 'admin']);

    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(false);

    // Verify the role was added
    const hasRole = await e.hasGroupingPolicy('bob', 'admin');
    expect(hasRole).toBe(true);

    // Verify role links work (bob should inherit admin permissions)
    const enforce = await e.enforce('bob', 'data1', 'read');
    expect(enforce).toBe(true);
  });

  test('selfRemovePolicy with roles should not call adapter', async () => {
    const result = await e.selfRemovePolicy('g', 'g', ['alice', 'admin']);

    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);

    // Verify the role was removed
    const hasRole = await e.hasGroupingPolicy('alice', 'admin');
    expect(hasRole).toBe(false);

    // Verify role links were updated (alice should no longer have admin permissions)
    const enforce = await e.enforce('alice', 'data1', 'read');
    expect(enforce).toBe(false);
  });
});
