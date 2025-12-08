import { newEnforcer, newModel } from '../src';
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

    // Inspect model structure
    const model = e.getModel();
    const pSection = model.model.get('p');
    console.log('\nPolicy section keys:', Array.from(pSection?.keys() || []));
    
    const pDef = pSection?.get('p');
    console.log('\np definition:');
    console.log('  tokens:', pDef?.tokens);
    console.log('  policy:', pDef?.policy);
    
    const p2Def = pSection?.get('p2');
    console.log('\np2 definition:');
    console.log('  tokens:', p2Def?.tokens);
    console.log('  policy:', p2Def?.policy);

    console.log('\nAll policies:', e.getPolicy());
    console.log('p policies:', e.getNamedPolicy('p'));
    console.log('p2 policies:', e.getNamedPolicy('p2'));

    // Test p policy
    const result1 = await e.enforce('alice', 'data1', 'read');
    console.log('Test 1 - alice, data1, read:', result1);
    expect(result1).toBe(true);

    // Test p2 policy  
    const result2 = await e.enforce('bob', 'data1', 'write-all-objects');
    console.log('Test 2 - bob, data1, write-all-objects:', result2);
    expect(result2).toBe(true);
  });
});
