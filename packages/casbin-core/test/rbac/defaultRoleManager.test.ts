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
