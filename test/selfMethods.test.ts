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

/**
 * MockAdapter tracks calls to adapter methods to verify they're not being called
 * when using self* methods.
 */
class MockAdapter {
  public addPolicyCalls: any[] = [];
  public removePolicyCalls: any[] = [];
  public updatePolicyCalls: any[] = [];
  public addPoliciesCalls: any[] = [];
  public removePoliciesCalls: any[] = [];
  public removeFilteredPolicyCalls: any[] = [];

  async loadPolicy(): Promise<void> {
    // No-op
  }

  async savePolicy(): Promise<boolean> {
    return true;
  }

  async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.addPolicyCalls.push({ sec, ptype, rule });
  }

  async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    this.removePolicyCalls.push({ sec, ptype, rule });
  }

  async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    this.removeFilteredPolicyCalls.push({ sec, ptype, fieldIndex, fieldValues });
  }

  async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.addPoliciesCalls.push({ sec, ptype, rules });
  }

  async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.removePoliciesCalls.push({ sec, ptype, rules });
  }

  async updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void> {
    this.updatePolicyCalls.push({ sec, ptype, oldRule, newRule });
  }

  resetCalls(): void {
    this.addPolicyCalls = [];
    this.removePolicyCalls = [];
    this.updatePolicyCalls = [];
    this.addPoliciesCalls = [];
    this.removePoliciesCalls = [];
    this.removeFilteredPolicyCalls = [];
  }
}

/**
 * MockWatcher tracks calls to watcher methods to verify they're not being called
 * when using self* methods.
 */
class MockWatcher {
  public updateCalls = 0;

  setUpdateCallback(): void {
    // No-op
  }

  async update(): Promise<boolean> {
    this.updateCalls++;
    return true;
  }

  resetCalls(): void {
    this.updateCalls = 0;
  }
}

let e: Enforcer;
let mockAdapter: MockAdapter;
let mockWatcher: MockWatcher;

beforeEach(async () => {
  // Create enforcer with mock adapter
  mockAdapter = new MockAdapter();
  mockWatcher = new MockWatcher();

  e = await newEnforcer('examples/rbac_model.conf', mockAdapter);
  e.setWatcher(mockWatcher);
  e.enableAutoSave(true); // Ensure autoSave is enabled
  e.enableAutoNotifyWatcher(true); // Ensure autoNotifyWatcher is enabled
});

describe('selfAddPolicy', () => {
  test('should add policy to memory without calling adapter', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfAddPolicy('p', 'p', ['alice', 'data1', 'read']);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should add grouping policy to memory without calling adapter', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfAddPolicy('g', 'g', ['alice', 'admin']);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('selfRemovePolicy', () => {
  test('should remove policy from memory without calling adapter', async () => {
    // Add policy first using regular method to set up test
    await e.addPolicy('alice', 'data1', 'read');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemovePolicy('p', 'p', ['alice', 'data1', 'read']);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should remove grouping policy from memory without calling adapter', async () => {
    // Add grouping policy first
    await e.addGroupingPolicy('alice', 'admin');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemovePolicy('g', 'g', ['alice', 'admin']);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('selfUpdatePolicy', () => {
  test('should update policy in memory without calling adapter', async () => {
    // Add policy first
    await e.addPolicy('alice', 'data1', 'read');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfUpdatePolicy('p', 'p', ['alice', 'data1', 'read'], ['alice', 'data1', 'write']);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('alice', 'data1', 'write')).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should update grouping policy in memory without calling adapter', async () => {
    // Add grouping policy first
    await e.addGroupingPolicy('alice', 'admin');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfUpdatePolicy('g', 'g', ['alice', 'admin'], ['alice', 'superadmin']);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(false);
    expect(await e.hasGroupingPolicy('alice', 'superadmin')).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('selfAddPolicies', () => {
  test('should add multiple policies to memory without calling adapter', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const rules = [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
    ];
    const result = await e.selfAddPolicies('p', 'p', rules);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(true);
    expect(await e.hasPolicy('bob', 'data2', 'write')).toBe(true);
    expect(mockAdapter.addPoliciesCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should add multiple grouping policies to memory without calling adapter', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const rules = [
      ['alice', 'admin'],
      ['bob', 'user'],
    ];
    const result = await e.selfAddPolicies('g', 'g', rules);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(true);
    expect(await e.hasGroupingPolicy('bob', 'user')).toBe(true);
    expect(mockAdapter.addPoliciesCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('selfRemovePolicies', () => {
  test('should remove multiple policies from memory without calling adapter', async () => {
    // Add policies first
    const rules = [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
    ];
    await e.addPolicies(rules);
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemovePolicies('p', 'p', rules);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('bob', 'data2', 'write')).toBe(false);
    expect(mockAdapter.removePoliciesCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should remove multiple grouping policies from memory without calling adapter', async () => {
    // Add grouping policies first
    const rules = [
      ['alice', 'admin'],
      ['bob', 'user'],
    ];
    await e.addGroupingPolicies(rules);
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemovePolicies('g', 'g', rules);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(false);
    expect(await e.hasGroupingPolicy('bob', 'user')).toBe(false);
    expect(mockAdapter.removePoliciesCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('selfRemoveFilteredPolicy', () => {
  test('should remove filtered policies from memory without calling adapter', async () => {
    // Add policies first
    await e.addPolicy('alice', 'data1', 'read');
    await e.addPolicy('alice', 'data2', 'write');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemoveFilteredPolicy('p', 'p', 0, ['alice']);

    expect(result).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(await e.hasPolicy('alice', 'data2', 'write')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('should remove filtered grouping policies from memory without calling adapter', async () => {
    // Add grouping policies first
    await e.addGroupingPolicy('alice', 'admin');
    await e.addGroupingPolicy('alice', 'user');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.selfRemoveFilteredPolicy('g', 'g', 0, ['alice']);

    expect(result).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'admin')).toBe(false);
    expect(await e.hasGroupingPolicy('alice', 'user')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});

describe('Regular methods should still call adapter and watcher', () => {
  test('addPolicy should call adapter and watcher', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.addPolicy('alice', 'data1', 'read');

    expect(result).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(1);
    expect(mockWatcher.updateCalls).toBe(1);
  });

  test('removePolicy should call adapter and watcher', async () => {
    await e.addPolicy('alice', 'data1', 'read');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.removePolicy('alice', 'data1', 'read');

    expect(result).toBe(true);
    expect(mockAdapter.removePolicyCalls.length).toBe(1);
    expect(mockWatcher.updateCalls).toBe(1);
  });

  test('updatePolicy should call adapter and watcher', async () => {
    await e.addPolicy('alice', 'data1', 'read');
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.updatePolicy(['alice', 'data1', 'read'], ['alice', 'data1', 'write']);

    expect(result).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(1);
    expect(mockWatcher.updateCalls).toBe(1);
  });

  test('addPolicies should call adapter and watcher', async () => {
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const rules = [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
    ];
    const result = await e.addPolicies(rules);

    expect(result).toBe(true);
    expect(mockAdapter.addPoliciesCalls.length).toBe(1);
    expect(mockWatcher.updateCalls).toBe(1);
  });

  test('removePolicies should call adapter and watcher', async () => {
    const rules = [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
    ];
    await e.addPolicies(rules);
    mockAdapter.resetCalls();
    mockWatcher.resetCalls();

    const result = await e.removePolicies(rules);

    expect(result).toBe(true);
    expect(mockAdapter.removePoliciesCalls.length).toBe(1);
    expect(mockWatcher.updateCalls).toBe(1);
  });
});
