import { Valuate } from '../src/util';

test('jest', () => {
  console.log('hello jest');
});

test('Valuate', () => {
  let ast = Valuate.parse('1 + 1 === 2');
  expect(new Valuate().evaluate(ast)).toEqual(true);
  ast = Valuate.parse('1 + 1 !== 2');
  expect(new Valuate().evaluate(ast)).toEqual(false);
});
