import { newEnforcer, newModel, StringAdapter } from '../src';
import { FileAdapter } from '../src';

describe('Multiple policy types (p and p2)', () => {
  test('Model with both p and p2 definitions should work', async () => {
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('p', 'p2', 'sub, act');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == p2.sub && r.act == p2.act');

    const a = new FileAdapter('examples/test_multiple_p_policy.csv');
    const e = await newEnforcer(m, a);

    // Test p policy
    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);

    // Test p2 policy
    await expect(e.enforce('bob', 'data1', 'write-all-objects')).resolves.toBe(true);

    // Test non-matching cases
    await expect(e.enforce('alice', 'data2', 'write')).resolves.toBe(false);
    await expect(e.enforce('bob', 'data2', 'read')).resolves.toBe(false);
  });

  test('Original issue example from GitHub', async () => {
    // This is the exact example from the GitHub issue
    const modelText = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act
p2 = sub, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == p2.sub && r.act == p2.act
`;

    const policyText = `
p, alice, data1, read
p2, bob, write-all-objects
`;

    const m = newModel(modelText);
    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);

    // Both requests should return true as per the issue
    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);
    await expect(e.enforce('bob', 'data1', 'write-all-objects')).resolves.toBe(true);
  });

  test('Three policy types (p, p2, p3)', async () => {
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('p', 'p2', 'sub, act');
    m.addDef('p', 'p3', 'sub');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == p2.sub && r.act == p2.act || r.sub == p3.sub');

    const policyText = `
p, alice, data1, read
p2, bob, write
p3, charlie
`;

    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);

    // Test all three policy types
    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);
    await expect(e.enforce('bob', 'data1', 'write')).resolves.toBe(true);
    await expect(e.enforce('charlie', 'data1', 'read')).resolves.toBe(true);

    // Non-matching cases
    await expect(e.enforce('alice', 'data2', 'read')).resolves.toBe(false);
    await expect(e.enforce('bob', 'data1', 'read')).resolves.toBe(false);
  });

  test('enforceEx with multiple policy types', async () => {
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('p', 'p2', 'sub, act');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == p2.sub && r.act == p2.act');

    const a = new FileAdapter('examples/test_multiple_p_policy.csv');
    const e = await newEnforcer(m, a);

    // enforceEx should return the matched rule
    const [result1, explain1] = await e.enforceEx('alice', 'data1', 'read');
    expect(result1).toBe(true);
    expect(explain1).toEqual(['alice', 'data1', 'read']);

    const [result2, explain2] = await e.enforceEx('bob', 'data1', 'write-all-objects');
    expect(result2).toBe(true);
    expect(explain2).toEqual(['bob', 'write-all-objects']);
  });

  test('Backward compatibility: single policy type still works', async () => {
    // Ensure our changes don't break existing behavior with single policy type
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'r.sub == p.sub && r.obj == p.obj && r.act == p.act');

    const policyText = `
p, alice, data1, read
p, bob, data2, write
`;

    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);

    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);
    await expect(e.enforce('bob', 'data2', 'write')).resolves.toBe(true);
    await expect(e.enforce('alice', 'data2', 'write')).resolves.toBe(false);
  });

  test('Multiple policy types with explicit eft column', async () => {
    // Test that eft column works correctly with multiple policy types
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act, eft');
    m.addDef('p', 'p2', 'sub, act, eft');
    m.addDef('e', 'e', 'some(where (p.eft == allow)) && !some(where (p.eft == deny))');
    m.addDef('m', 'm', 'r.sub == p.sub && r.obj == p.obj && r.act == p.act || r.sub == p2.sub && r.act == p2.act');

    const policyText = `
p, alice, data1, read, allow
p, alice, data1, write, deny
p2, bob, write, allow
`;

    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);

    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);
    await expect(e.enforce('alice', 'data1', 'write')).resolves.toBe(false);
    await expect(e.enforce('bob', 'data1', 'write')).resolves.toBe(true);
  });
});
