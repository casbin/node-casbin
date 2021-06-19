// Copyright 2017 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// escapeAssertion escapes the dots in the assertion,
// because the expression evaluation doesn't support such variable names.
export function escapeAssertion(s: string): string {
  s = s.replace(/r\./g, 'r_');
  s = s.replace(/p\./g, 'p_');
  return s;
}

// removeComments removes the comments starting with # in the text.
export function removeComments(s: string): string {
  const pos = s.indexOf('#');
  return pos > -1 ? s.slice(0, pos).trim() : s;
}

// arrayEquals determines whether two string arrays are identical.
export function arrayEquals(a: string[] = [], b: string[] = []): boolean {
  const aLen = a.length;
  const bLen = b.length;
  if (aLen !== bLen) {
    return false;
  }

  for (let i = 0; i < aLen; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// array2DEquals determines whether two 2-dimensional string arrays are identical.
export function array2DEquals(a: string[][] = [], b: string[][] = []): boolean {
  const aLen = a.length;
  const bLen = a.length;
  if (aLen !== bLen) {
    return false;
  }

  for (let i = 0; i < aLen; i++) {
    if (!arrayEquals(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

// arrayRemoveDuplicates removes any duplicated elements in a string array.
export function arrayRemoveDuplicates(s: string[]): string[] {
  return [...new Set(s)];
}

// arrayToString gets a printable string for a string array.
export function arrayToString(a: string[]): string {
  return a.join(', ');
}

// paramsToString gets a printable string for variable number of parameters.
export function paramsToString(...v: string[]): string {
  return v.join(', ');
}

// setEquals determines whether two string sets are identical.
export function setEquals(a: string[], b: string[]): boolean {
  return arrayEquals(a.sort(), b.sort());
}

const evalReg = new RegExp(/\beval\(([^),]*)\)/g);

// hasEval determine whether matcher contains function eval
export function hasEval(s: string): boolean {
  return evalReg.test(s);
}

// replaceEval replace function eval with the value of its parameters
export function replaceEval(s: string, rule: string): string {
  return s.replace(evalReg, '(' + rule + ')');
}

// getEvalValue returns the parameters of function eval
export function getEvalValue(s: string): string[] {
  const subMatch = s.match(evalReg);
  const rules: string[] = [];
  if (!subMatch) {
    return [];
  }
  for (const rule of subMatch) {
    const index: number = rule.indexOf('(');
    rules.push(rule.slice(index + 1, -1));
  }
  return rules;
}

// generatorRunSync handle generator function in Sync model and return value which is not Promise
export function generatorRunSync(iterator: Generator<any>): any {
  let { value, done } = iterator.next();
  while (true) {
    if (value instanceof Promise) {
      throw new Error('cannot handle Promise in generatorRunSync, Please use generatorRunAsync');
    }
    if (!done) {
      const temp = value;
      ({ value, done } = iterator.next(temp));
    } else {
      return value;
    }
  }
}

// generatorRunAsync handle generator function in Async model and return Promise
export async function generatorRunAsync(iterator: Generator<any>): Promise<any> {
  let { value, done } = iterator.next();
  while (true) {
    if (!done) {
      const temp = await value;
      ({ value, done } = iterator.next(temp));
    } else {
      return value;
    }
  }
}

export function deepCopy(obj: Array<any> | any): any {
  if (typeof obj !== 'object') return;
  const newObj: any = obj instanceof Array ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = typeof obj[key] === 'object' ? deepCopy(obj[key]) : obj[key];
    }
  }
  return newObj;
}
