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

import { newEnforcer, Enforcer } from '../src';
import { FileAdapter, BatchAdapter, UpdatableAdapter } from '../src/persist';
import { Model } from '../src/model';

// SpyAdapter to track if adapter methods are called
class SpyAdapter extends FileAdapter implements BatchAdapter, UpdatableAdapter {
  public addPolicyCalled = false;
  public removePolicyCalled = false;
  public updatePolicyCalled = false;
  public addPoliciesCalled = false;
  public removePoliciesCalled = false;
  public removeFilteredPolicyCalled = false;

  async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.addPolicyCalled = true;
  }

  async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.removePolicyCalled = true;
  }

  async updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void> {
    this.updatePolicyCalled = true;
  }

  async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.addPoliciesCalled = true;
  }

  async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.removePoliciesCalled = true;
  }

  async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    this.removeFilteredPolicyCalled = true;
  }

  resetFlags(): void {
    this.addPolicyCalled = false;
    this.removePolicyCalled = false;
    this.updatePolicyCalled = false;
    this.addPoliciesCalled = false;
    this.removePoliciesCalled = false;
    this.removeFilteredPolicyCalled = false;
  }
}

describe('Self Policy Methods', () => {
  let e: Enforcer;
  let adapter: SpyAdapter;

  beforeEach(async () => {
    adapter = new SpyAdapter('examples/rbac_policy.csv');
    e = await newEnforcer('examples/rbac_model.conf', adapter);
    e.enableAutoSave(true); // Enable autoSave to test that self* methods bypass it
    adapter.resetFlags();
  });

  test('selfAddPolicy should add policy without calling adapter', async () => {
    const result = await e.selfAddPolicy('p', 'p', ['alice', 'data3', 'read']);
    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(false);

    // Verify policy was added to enforcer
    const hasPolicy = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasPolicy).toBe(true);
  });

  test('selfAddPolicy should not add duplicate policy', async () => {
    await e.selfAddPolicy('p', 'p', ['alice', 'data1', 'read']);
    const result = await e.selfAddPolicy('p', 'p', ['alice', 'data1', 'read']);
    expect(result).toBe(false);
    expect(adapter.addPolicyCalled).toBe(false);
  });

  test('selfRemovePolicy should remove policy without calling adapter', async () => {
    // First add a policy using selfAddPolicy
    await e.selfAddPolicy('p', 'p', ['alice', 'data3', 'read']);
    adapter.resetFlags();

    const result = await e.selfRemovePolicy('p', 'p', ['alice', 'data3', 'read']);
    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);

    // Verify policy was removed
    const hasPolicy = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasPolicy).toBe(false);
  });

  test('selfRemovePolicy should return false for non-existent policy', async () => {
    const result = await e.selfRemovePolicy('p', 'p', ['alice', 'data999', 'read']);
    expect(result).toBe(false);
    expect(adapter.removePolicyCalled).toBe(false);
  });

  test('selfUpdatePolicy should update policy without calling adapter', async () => {
    await e.selfAddPolicy('p', 'p', ['alice', 'data3', 'read']);
    adapter.resetFlags();

    const result = await e.selfUpdatePolicy('p', 'p', ['alice', 'data3', 'read'], ['alice', 'data3', 'write']);
    expect(result).toBe(true);
    expect(adapter.updatePolicyCalled).toBe(false);

    // Verify old policy was removed and new policy was added
    const hasOldPolicy = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasOldPolicy).toBe(false);
    const hasNewPolicy = await e.hasPolicy('alice', 'data3', 'write');
    expect(hasNewPolicy).toBe(true);
  });

  test('selfUpdatePolicy should return false for non-existent policy', async () => {
    const result = await e.selfUpdatePolicy('p', 'p', ['alice', 'data999', 'read'], ['alice', 'data999', 'write']);
    expect(result).toBe(false);
    expect(adapter.updatePolicyCalled).toBe(false);
  });

  test('selfAddPolicies should add multiple policies without calling adapter', async () => {
    const rules = [
      ['alice', 'data3', 'read'],
      ['bob', 'data3', 'write'],
    ];
    const result = await e.selfAddPolicies('p', 'p', rules);
    expect(result).toBe(true);
    expect(adapter.addPoliciesCalled).toBe(false);

    // Verify policies were added
    const hasPolicy1 = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasPolicy1).toBe(true);
    const hasPolicy2 = await e.hasPolicy('bob', 'data3', 'write');
    expect(hasPolicy2).toBe(true);
  });

  test('selfAddPolicies should return false if any policy exists', async () => {
    const rules = [
      ['alice', 'data1', 'read'], // This one already exists
      ['bob', 'data3', 'write'],
    ];
    const result = await e.selfAddPolicies('p', 'p', rules);
    expect(result).toBe(false);
    expect(adapter.addPoliciesCalled).toBe(false);
  });

  test('selfRemovePolicies should remove multiple policies without calling adapter', async () => {
    await e.selfAddPolicies('p', 'p', [
      ['alice', 'data3', 'read'],
      ['bob', 'data3', 'write'],
    ]);
    adapter.resetFlags();

    const rules = [
      ['alice', 'data3', 'read'],
      ['bob', 'data3', 'write'],
    ];
    const result = await e.selfRemovePolicies('p', 'p', rules);
    expect(result).toBe(true);
    expect(adapter.removePoliciesCalled).toBe(false);

    // Verify policies were removed
    const hasPolicy1 = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasPolicy1).toBe(false);
    const hasPolicy2 = await e.hasPolicy('bob', 'data3', 'write');
    expect(hasPolicy2).toBe(false);
  });

  test('selfRemovePolicies should return false if any policy does not exist', async () => {
    const rules = [
      ['alice', 'data999', 'read'], // This one doesn't exist
      ['bob', 'data3', 'write'],
    ];
    const result = await e.selfRemovePolicies('p', 'p', rules);
    expect(result).toBe(false);
    expect(adapter.removePoliciesCalled).toBe(false);
  });

  test('selfRemoveFilteredPolicy should remove filtered policies without calling adapter', async () => {
    await e.selfAddPolicies('p', 'p', [
      ['alice', 'data3', 'read'],
      ['alice', 'data3', 'write'],
      ['alice', 'data4', 'read'],
    ]);
    adapter.resetFlags();

    const result = await e.selfRemoveFilteredPolicy('p', 'p', 0, ['alice', 'data3']);
    expect(result).toBe(true);
    expect(adapter.removeFilteredPolicyCalled).toBe(false);

    // Verify filtered policies were removed
    const hasPolicy1 = await e.hasPolicy('alice', 'data3', 'read');
    expect(hasPolicy1).toBe(false);
    const hasPolicy2 = await e.hasPolicy('alice', 'data3', 'write');
    expect(hasPolicy2).toBe(false);
    // But this one should still exist
    const hasPolicy3 = await e.hasPolicy('alice', 'data4', 'read');
    expect(hasPolicy3).toBe(true);
  });

  test('selfAddPolicy for grouping policies should work', async () => {
    const result = await e.selfAddPolicy('g', 'g', ['alice', 'admin']);
    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(false);

    const hasGroupingPolicy = await e.hasGroupingPolicy('alice', 'admin');
    expect(hasGroupingPolicy).toBe(true);
  });

  test('selfRemovePolicy for grouping policies should work', async () => {
    await e.selfAddPolicy('g', 'g', ['alice', 'admin']);
    adapter.resetFlags();

    const result = await e.selfRemovePolicy('g', 'g', ['alice', 'admin']);
    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(false);

    const hasGroupingPolicy = await e.hasGroupingPolicy('alice', 'admin');
    expect(hasGroupingPolicy).toBe(false);
  });

  test('regular addPolicy should still call adapter when autoSave is true', async () => {
    const result = await e.addPolicy('alice', 'data3', 'read');
    expect(result).toBe(true);
    expect(adapter.addPolicyCalled).toBe(true);
  });

  test('regular removePolicy should still call adapter when autoSave is true', async () => {
    await e.addPolicy('alice', 'data3', 'read');
    adapter.resetFlags();

    const result = await e.removePolicy('alice', 'data3', 'read');
    expect(result).toBe(true);
    expect(adapter.removePolicyCalled).toBe(true);
  });
});
