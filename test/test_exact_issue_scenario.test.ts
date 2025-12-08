import { newModel, newEnforcer, StringAdapter } from '../src';

describe('Exact issue scenario', () => {
  test('Matcher only references p (not p2) - like issue screenshot', async () => {
    // This is the EXACT scenario from the issue screenshot
    // Matcher ONLY references p, not p2
    const modelText = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act
p2 = sub, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
`;

    const policyText = `
p, alice, data1, read
p2, bob, write-all-objects
`;

    const m = newModel(modelText);
    const a = new StringAdapter(policyText);
    const e = await newEnforcer(m, a);

    // Test 1: alice with p policy - should work
    await expect(e.enforce('alice', 'data1', 'read')).resolves.toBe(true);

    // Test 2: bob with p2 policy - won't work because matcher doesn't reference p2
    // This matches Go Casbin's behavior
    await expect(e.enforce('bob', 'data1', 'write-all-objects')).resolves.toBe(false);
  });
});
