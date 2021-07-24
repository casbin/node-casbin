import { Enforcer, newEnforcer, newModel, newSyncedEnforcer } from '../src';

async function testEnforce(e: Enforcer, sub: any, obj: string, act: string, res: boolean): Promise<void> {
  expect(e.enforceSync(sub, obj, act)).toBe(res);
}

test('TestGFunctionInSyncedEnforcer', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await newSyncedEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'invalid');

  await testEnforce(e, 'alice', 'data1', 'read', false);
});
