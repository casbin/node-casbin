import { StringAdapter } from '../../src/persist';

test('addPolicy', async () => {
  const e = new StringAdapter('');
  const p = ['eve', 'data3', 'read'];
  await e.addPolicy('p', 'p', p);
  expect(await e.getPolicy()).toBe('p, eve, data3, read');

  await e.removePolicy('p', 'p', p);
  expect(await e.getPolicy()).toBe('');
});

test('addPolicies', async () => {
  const e = new StringAdapter('');
  const p = [
    ['eve', 'data3', 'read'],
    ['eve', 'data4', 'read'],
  ];
  await e.addPolicies('p', 'p', p);
  expect(await e.getPolicy()).toBe('p, eve, data3, read' + '\n' + 'p, eve, data4, read');

  await e.removePolicies('p', 'p', p);
  expect(await e.getPolicy()).toBe('');
});
