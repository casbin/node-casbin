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

import * as _ from 'lodash';
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
  return pos > -1 ? _.trim(s.slice(0, pos)) : s;
}

// arrayEquals determines whether two string arrays are identical.
function arrayEquals(a: string[], b: string[]): boolean {
  return _.isEqual(a, b);
}

// array2DEquals determines whether two 2-dimensional string arrays are identical.
function array2DEquals(a: [string[]], b: [string[]]): boolean {
  return _.isEqual(a, b);
}

// arrayRemoveDuplicates removes any duplicated elements in a string array.
function arrayRemoveDuplicates(s: string[]): string[] {
  return _.uniq(s);
}

// arrayToString gets a printable string for a string array.
function arrayToString(a: string[]): string {
  return _.join(a, ', ');
}

// paramsToString gets a printable string for variable number of parameters.
function paramsToString(...v: string[]): string {
  return _.join(v, ', ');
}

// setEquals determines whether two string sets are identical.
function setEquals(a: string[], b: string[]): boolean {
  return _.isEqual(_.sortedUniq(a), _.sortedUniq(b));
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
    fs.writeFile(path, file, encoding || 'utf8', (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });
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
  writeFile
};
