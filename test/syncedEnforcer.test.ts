import { newModel, newSyncedEnforcer } from '../src';

test('TestGFunctionInSyncedEnforcerWithRoles', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, obj, act');
  m.addDef('p', 'p', 'sub, obj, act');
  m.addDef('g', 'g', '_, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

  const e = await newSyncedEnforcer(m);

  await e.addPermissionForUser('alice', 'data1', 'read');
  await e.addPermissionForUser('bob', 'data2', 'write');
  await e.addPermissionForUser('data2_admin', 'data2', 'read');
  await e.addPermissionForUser('data2_admin', 'data2', 'write');

  // Synced enforcer should not fail to recognize subject
  expect(e.enforceSync('alice', 'data1', 'read')).toBe(true);
  expect(e.enforceSync('alice', 'data2', 'read')).toBe(false);
  expect(e.enforceSync('alice', 'data2', 'write')).toBe(false);
  expect(e.enforceSync('bob', 'data1', 'read')).toBe(false);
  expect(e.enforceSync('bob', 'data2', 'write')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data2', 'read')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data2', 'write')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data1', 'read')).toBe(false);

  await e.addRoleForUser('alice', 'data2_admin');

  // Synced enforcer should not fail to recognize subject
  expect(e.enforceSync('alice', 'data1', 'read')).toBe(true);
  expect(e.enforceSync('alice', 'data2', 'read')).toBe(true);
  expect(e.enforceSync('alice', 'data2', 'write')).toBe(true);
  expect(e.enforceSync('bob', 'data1', 'read')).toBe(false);
  expect(e.enforceSync('bob', 'data2', 'write')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data2', 'read')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data2', 'write')).toBe(true);
  expect(e.enforceSync('data2_admin', 'data1', 'read')).toBe(false);
});

test('TestGFunctionInSyncedEnforcerWithDomains', async () => {
  const m = newModel();
  m.addDef('r', 'r', 'sub, dom, obj, act');
  m.addDef('p', 'p', 'sub, dom, obj, act');
  m.addDef('g', 'g', '_, _, _');
  m.addDef('e', 'e', 'some(where (p.eft == allow))');
  m.addDef('m', 'm', 'g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act');

  const e = await newSyncedEnforcer(m);

  await e.addPermissionForUser('admin', 'domain1', 'data1', 'read');
  await e.addPermissionForUser('admin', 'domain1', 'data1', 'write');
  await e.addPermissionForUser('admin', 'domain2', 'data2', 'read');
  await e.addPermissionForUser('admin', 'domain2', 'data2', 'write');

  // Alice and Bob should not have rights
  expect(e.enforceSync('alice', 'domain1', 'data1', 'read')).toBe(false);
  expect(e.enforceSync('alice', 'domain1', 'data1', 'write')).toBe(false);
  expect(e.enforceSync('bob', 'domain2', 'data2', 'read')).toBe(false);
  expect(e.enforceSync('bob', 'domain2', 'data2', 'write')).toBe(false);

  await e.addRoleForUser('alice', 'admin', 'domain1');
  await e.addRoleForUser('bob', 'admin', 'domain2');

  // Alice and Bob should have rights
  expect(e.enforceSync('alice', 'domain1', 'data1', 'read')).toBe(true);
  expect(e.enforceSync('alice', 'domain1', 'data1', 'write')).toBe(true);
  expect(e.enforceSync('bob', 'domain2', 'data2', 'read')).toBe(true);
  expect(e.enforceSync('bob', 'domain2', 'data2', 'write')).toBe(true);

  // Alice and Bob should not have rights
  expect(e.enforceSync('alice', 'domain2', 'data2', 'read')).toBe(false);
  expect(e.enforceSync('alice', 'domain2', 'data2', 'write')).toBe(false);
  expect(e.enforceSync('bob', 'domain1', 'data2', 'read')).toBe(false);
  expect(e.enforceSync('bob', 'domain1', 'data2', 'write')).toBe(false);

  // Domains should be respected
  expect(e.enforceSync('alice', 'domain2', 'data1', 'read')).toBe(false);
  expect(e.enforceSync('alice', 'domain2', 'data1', 'write')).toBe(false);
  expect(e.enforceSync('bob', 'domain1', 'data2', 'read')).toBe(false);
  expect(e.enforceSync('bob', 'domain1', 'data2', 'write')).toBe(false);
});
