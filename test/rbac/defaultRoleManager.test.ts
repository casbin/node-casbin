import { DefaultRoleManager } from '../../src';
import { keyMatch2Func } from '../../src/util';

test('TestAllMatchingFunc', async () => {
  const rm = new DefaultRoleManager(10);
  await rm.addMatchingFunc(keyMatch2Func);
  await rm.addDomainMatchingFunc(keyMatch2Func);
  await rm.addLink('/book/:id', 'book_group', '*');
  // Current role inheritance tree after deleting the links:
  //  		*:book_group
  //				|
  // 			*:/book/:id
  expect(await rm.hasLink('/book/1', 'book_group', 'domain1')).toBe(true);
});

test('TestGetImplicitRoles', async () => {
  const rm = new DefaultRoleManager(10);
  await rm.addLink('alice', 'admin');
  await rm.addLink('admin', 'data1_admin');
  await rm.addLink('admin', 'data2_admin');

  expect(await rm.getRoles('alice')).toEqual(['admin']);
  expect(await rm.getImplicitRoles('alice')).toEqual(['admin', 'data1_admin', 'data2_admin']);
  expect(await rm.getImplicitRoles('bob')).toEqual([]);

  // A cycle terminates and never reports the subject as one of its own roles.
  await rm.addLink('data2_admin', 'alice');
  expect(await rm.getImplicitRoles('alice')).toEqual(['admin', 'data1_admin', 'data2_admin']);
});

test('TestGetImplicitRolesRespectsMaxHierarchyLevel', async () => {
  // role0 -> role1 -> ... -> role5
  const chain = async (rm: DefaultRoleManager): Promise<void> => {
    for (let i = 0; i < 5; i++) {
      await rm.addLink(`role${i}`, `role${i + 1}`);
    }
  };

  const rm = new DefaultRoleManager(10);
  await chain(rm);
  expect(await rm.getImplicitRoles('role0')).toEqual(['role1', 'role2', 'role3', 'role4', 'role5']);

  // Only maxHierarchyLevel hops are followed, so the tail of the chain is cut off.
  const shallow = new DefaultRoleManager(2);
  await chain(shallow);
  expect(await shallow.getImplicitRoles('role0')).toEqual(['role1', 'role2']);
});

test('TestGetImplicitRolesWithDomain', async () => {
  const rm = new DefaultRoleManager(10);
  await rm.addLink('alice', 'admin', 'domain1');
  await rm.addLink('admin', 'data1_admin', 'domain1');
  await rm.addLink('alice', 'guest', 'domain2');

  expect(await rm.getImplicitRoles('alice', 'domain1')).toEqual(['admin', 'data1_admin']);
  expect(await rm.getImplicitRoles('alice', 'domain2')).toEqual(['guest']);
  expect(await rm.getImplicitRoles('alice', 'domain3')).toEqual([]);
});
