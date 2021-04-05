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

import * as fs from 'fs';

// escapeAssertion escapes the dots in the assertion,
// because the expression evaluation doesn't support such variable names.
function escapeAssertion(s: string): string {
  s = s.replace(/r\./g, 'r_');
  s = s.replace(/p\./g, 'p_');
  return s;
}

// removeComments removes the comments starting with # in the text.
function removeComments(s: string): string {
  const pos = s.indexOf('#');
  return pos > -1 ? s.slice(0, pos).trim() : s;
}

// arrayEquals determines whether two string arrays are identical.
function arrayEquals(a: string[] = [], b: string[] = []): boolean {
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
function array2DEquals(a: string[][] = [], b: string[][] = []): boolean {
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
function arrayRemoveDuplicates(s: string[]): string[] {
  return [...new Set(s)];
}

// arrayToString gets a printable string for a string array.
function arrayToString(a: string[]): string {
  return a.join(', ');
}

// paramsToString gets a printable string for variable number of parameters.
function paramsToString(...v: string[]): string {
  return v.join(', ');
}

// setEquals determines whether two string sets are identical.
function setEquals(a: string[], b: string[]): boolean {
  return arrayEquals(a.sort(), b.sort());
}

// readFile return a promise for readFile.
function readFile(path: string, encoding?: string): any {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding || 'utf8', (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });
}

// writeFile return a promise for writeFile.
function writeFile(path: string, file: string, encoding?: string): any {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, file, encoding || 'utf8', (error) => {
      if (error) {
        reject(error);
      }
      resolve(true);
    });
  });
}

const evalReg = new RegExp(/\beval\(([^),]*)\)/g);

// hasEval determine whether matcher contains function eval
function hasEval(s: string): boolean {
  return evalReg.test(s);
}

// replaceEval replace function eval with the value of its parameters
function replaceEval(s: string, rule: string): string {
  return s.replace(evalReg, '(' + rule + ')');
}

// getEvalValue returns the parameters of function eval
function getEvalValue(s: string): string[] {
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
function generatorRunSync(iterator: Generator<any>): any {
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
async function generatorRunAsync(iterator: Generator<any>): Promise<any> {
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

function deepCopy(obj: Array<any> | any): any {
  // 只拷贝对象
  if (typeof obj !== 'object') return;
  // 根据obj的类型判断是新建一个数组还是一个对象
  const newObj: any = obj instanceof Array ? [] : {};
  for (const key in obj) {
    // 遍历obj,并且判断是obj的属性才拷贝
    if (obj.hasOwnProperty(key)) {
      // 判断属性值的类型，如果是对象递归调用深拷贝
      newObj[key] = typeof obj[key] === 'object' ? deepCopy(obj[key]) : obj[key];
    }
  }
  return newObj;
}

export {
  escapeAssertion,
  removeComments,
  arrayEquals,
  array2DEquals,
  arrayRemoveDuplicates,
  arrayToString,
  paramsToString,
  setEquals,
  readFile,
  writeFile,
  hasEval,
  replaceEval,
  getEvalValue,
  generatorRunSync,
  generatorRunAsync,
  deepCopy,
};
