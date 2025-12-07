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

import { newEnforcer, Enforcer, Util, Adapter, Model } from '../src';

let e = {} as Enforcer;

// Mock adapter that tracks calls
class MockAdapter implements Adapter {
  public addPolicyCalls: any[] = [];
  public removePolicyCalls: any[] = [];
  public updatePolicyCalls: any[] = [];
  public removeFilteredPolicyCalls: any[] = [];

  async loadPolicy(model: Model): Promise<void> {
    // Do nothing
  }

  async savePolicy(model: Model): Promise<boolean> {
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

  async updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void> {
    this.updatePolicyCalls.push({ sec, ptype, oldRule, newRule });
  }
}

// Mock watcher that tracks calls
class MockWatcher {
  public updateCalls = 0;

  setUpdateCallback(cb: () => void): void {
    // Do nothing
  }

  async update(): Promise<boolean> {
    this.updateCalls++;
    return true;
  }
}

beforeEach(async () => {
  e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_policy.csv');
});

function testArrayEquals(value: string[], other: string[]): void {
  expect(Util.arrayEquals(value, other)).toBe(true);
}

function testArray2DEquals(value: string[][], other: string[][]): void {
  expect(Util.array2DEquals(value, other)).toBe(true);
}

describe('Self Policy Management - Policies', () => {
  test('selfAddPolicy should add policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const added = await e.selfAddPolicy('eve', 'data3', 'read');
    expect(added).toBe(true);
    expect(await e.hasPolicy('eve', 'data3', 'read')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddNamedPolicy should add policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const added = await e.selfAddNamedPolicy('p', 'eve', 'data3', 'read');
    expect(added).toBe(true);
    expect(await e.hasNamedPolicy('p', 'eve', 'data3', 'read')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddPolicy should not add duplicate policy', async () => {
    const added = await e.selfAddPolicy('alice', 'data1', 'read');
    expect(added).toBe(false);
  });

  test('selfAddPolicies should add multiple policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const rules = [
      ['jack', 'data4', 'read'],
      ['katy', 'data4', 'write'],
    ];
    const added = await e.selfAddPolicies(rules);
    expect(added).toBe(true);
    expect(await e.hasPolicy('jack', 'data4', 'read')).toBe(true);
    expect(await e.hasPolicy('katy', 'data4', 'write')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddNamedPolicies should add multiple policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const rules = [
      ['jack', 'data4', 'read'],
      ['katy', 'data4', 'write'],
    ];
    const added = await e.selfAddNamedPolicies('p', rules);
    expect(added).toBe(true);
    expect(await e.hasPolicy('jack', 'data4', 'read')).toBe(true);
    expect(await e.hasPolicy('katy', 'data4', 'write')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfUpdatePolicy should update policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const oldRule = ['alice', 'data1', 'read'];
    const newRule = ['alice', 'data1', 'write'];
    const updated = await e.selfUpdatePolicy(oldRule, newRule);
    expect(updated).toBe(true);
    expect(await e.hasPolicy(...oldRule)).toBe(false);
    expect(await e.hasPolicy(...newRule)).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
  });

  test('selfUpdateNamedPolicy should update policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const oldRule = ['alice', 'data1', 'read'];
    const newRule = ['alice', 'data1', 'write'];
    const updated = await e.selfUpdateNamedPolicy('p', oldRule, newRule);
    expect(updated).toBe(true);
    expect(await e.hasPolicy(...oldRule)).toBe(false);
    expect(await e.hasPolicy(...newRule)).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
  });

  test('selfRemovePolicy should remove policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemovePolicy('alice', 'data1', 'read');
    expect(removed).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveNamedPolicy should remove policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveNamedPolicy('p', 'alice', 'data1', 'read');
    expect(removed).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemovePolicies should remove multiple policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    // First add the policies
    const rules = [
      ['jack', 'data4', 'read'],
      ['katy', 'data4', 'write'],
    ];
    await e.selfAddPolicies(rules);

    // Now remove them
    const removed = await e.selfRemovePolicies(rules);
    expect(removed).toBe(true);
    expect(await e.hasPolicy('jack', 'data4', 'read')).toBe(false);
    expect(await e.hasPolicy('katy', 'data4', 'write')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveNamedPolicies should remove multiple policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    // First add the policies
    const rules = [
      ['jack', 'data4', 'read'],
      ['katy', 'data4', 'write'],
    ];
    await e.selfAddNamedPolicies('p', rules);

    // Now remove them
    const removed = await e.selfRemoveNamedPolicies('p', rules);
    expect(removed).toBe(true);
    expect(await e.hasPolicy('jack', 'data4', 'read')).toBe(false);
    expect(await e.hasPolicy('katy', 'data4', 'write')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveFilteredPolicy should remove filtered policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveFilteredPolicy(0, 'alice');
    expect(removed).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
  });

  test('selfRemoveFilteredNamedPolicy should remove filtered policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveFilteredNamedPolicy('p', 0, 'alice');
    expect(removed).toBe(true);
    expect(await e.hasPolicy('alice', 'data1', 'read')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
  });
});

describe('Self Policy Management - Grouping Policies', () => {
  test('selfAddGroupingPolicy should add grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const added = await e.selfAddGroupingPolicy('eve', 'data_admin');
    expect(added).toBe(true);
    expect(await e.hasGroupingPolicy('eve', 'data_admin')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddNamedGroupingPolicy should add grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const added = await e.selfAddNamedGroupingPolicy('g', 'eve', 'data_admin');
    expect(added).toBe(true);
    expect(await e.hasGroupingPolicy('eve', 'data_admin')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddGroupingPolicies should add multiple grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const rules = [
      ['jack', 'data4_admin'],
      ['katy', 'data5_admin'],
    ];
    const added = await e.selfAddGroupingPolicies(rules);
    expect(added).toBe(true);
    expect(await e.hasGroupingPolicy('jack', 'data4_admin')).toBe(true);
    expect(await e.hasGroupingPolicy('katy', 'data5_admin')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfAddNamedGroupingPolicies should add multiple grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const rules = [
      ['jack', 'data4_admin'],
      ['katy', 'data5_admin'],
    ];
    const added = await e.selfAddNamedGroupingPolicies('g', rules);
    expect(added).toBe(true);
    expect(await e.hasGroupingPolicy('jack', 'data4_admin')).toBe(true);
    expect(await e.hasGroupingPolicy('katy', 'data5_admin')).toBe(true);
    expect(mockAdapter.addPolicyCalls.length).toBe(0);
  });

  test('selfUpdateGroupingPolicy should update grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const oldRule = ['alice', 'data2_admin'];
    const newRule = ['alice', 'data3_admin'];
    const updated = await e.selfUpdateGroupingPolicy(oldRule, newRule);
    expect(updated).toBe(true);
    expect(await e.hasGroupingPolicy(...oldRule)).toBe(false);
    expect(await e.hasGroupingPolicy(...newRule)).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
  });

  test('selfUpdateNamedGroupingPolicy should update grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const oldRule = ['alice', 'data2_admin'];
    const newRule = ['alice', 'data3_admin'];
    const updated = await e.selfUpdateNamedGroupingPolicy('g', oldRule, newRule);
    expect(updated).toBe(true);
    expect(await e.hasGroupingPolicy(...oldRule)).toBe(false);
    expect(await e.hasGroupingPolicy(...newRule)).toBe(true);
    expect(mockAdapter.updatePolicyCalls.length).toBe(0);
  });

  test('selfRemoveGroupingPolicy should remove grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveGroupingPolicy('alice', 'data2_admin');
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'data2_admin')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveNamedGroupingPolicy should remove grouping policy without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveNamedGroupingPolicy('g', 'alice', 'data2_admin');
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'data2_admin')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveGroupingPolicies should remove multiple grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    // First add the policies
    const rules = [
      ['jack', 'data4_admin'],
      ['katy', 'data5_admin'],
    ];
    await e.selfAddGroupingPolicies(rules);

    // Now remove them
    const removed = await e.selfRemoveGroupingPolicies(rules);
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('jack', 'data4_admin')).toBe(false);
    expect(await e.hasGroupingPolicy('katy', 'data5_admin')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveNamedGroupingPolicies should remove multiple grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    // First add the policies
    const rules = [
      ['jack', 'data4_admin'],
      ['katy', 'data5_admin'],
    ];
    await e.selfAddNamedGroupingPolicies('g', rules);

    // Now remove them
    const removed = await e.selfRemoveNamedGroupingPolicies('g', rules);
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('jack', 'data4_admin')).toBe(false);
    expect(await e.hasGroupingPolicy('katy', 'data5_admin')).toBe(false);
    expect(mockAdapter.removePolicyCalls.length).toBe(0);
  });

  test('selfRemoveFilteredGroupingPolicy should remove filtered grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveFilteredGroupingPolicy(0, 'alice');
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'data2_admin')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
  });

  test('selfRemoveFilteredNamedGroupingPolicy should remove filtered grouping policies without calling adapter', async () => {
    const mockAdapter = new MockAdapter();
    e.setAdapter(mockAdapter);
    e.enableAutoSave(true);

    const removed = await e.selfRemoveFilteredNamedGroupingPolicy('g', 0, 'alice');
    expect(removed).toBe(true);
    expect(await e.hasGroupingPolicy('alice', 'data2_admin')).toBe(false);
    expect(mockAdapter.removeFilteredPolicyCalls.length).toBe(0);
  });
});

describe('Self Policy Management - Watcher Not Called', () => {
  test('selfAddPolicy should not call watcher.update()', async () => {
    const mockWatcher = new MockWatcher();
    e.setWatcher(mockWatcher);
    e.enableAutoNotifyWatcher(true);

    await e.selfAddPolicy('eve', 'data3', 'read');
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('selfRemovePolicy should not call watcher.update()', async () => {
    const mockWatcher = new MockWatcher();
    e.setWatcher(mockWatcher);
    e.enableAutoNotifyWatcher(true);

    await e.selfRemovePolicy('alice', 'data1', 'read');
    expect(mockWatcher.updateCalls).toBe(0);
  });

  test('selfUpdatePolicy should not call watcher.update()', async () => {
    const mockWatcher = new MockWatcher();
    e.setWatcher(mockWatcher);
    e.enableAutoNotifyWatcher(true);

    const oldRule = ['alice', 'data1', 'read'];
    const newRule = ['alice', 'data1', 'write'];
    await e.selfUpdatePolicy(oldRule, newRule);
    expect(mockWatcher.updateCalls).toBe(0);
  });
});
