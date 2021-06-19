// Copyright 2017 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as util from '../util';

export type MatchingFunction = (...arg: any[]) => boolean | number | Promise<boolean> | Promise<number>;

// FunctionMap represents the collection of Function.
export class FunctionMap {
  private functions: Map<string, any>;

  /**
   * constructor is the constructor for FunctionMap.
   */
  constructor() {
    this.functions = new Map<string, any>();
  }

  // loadFunctionMap loads an initial function map.
  public static loadFunctionMap(): FunctionMap {
    const fm = new FunctionMap();

    fm.addFunction('keyMatch', util.keyMatchFunc);
    fm.addFunction('keyMatch2', util.keyMatch2Func);
    fm.addFunction('keyMatch3', util.keyMatch3Func);
    fm.addFunction('keyMatch4', util.keyMatch4Func);
    fm.addFunction('regexMatch', util.regexMatchFunc);
    fm.addFunction('ipMatch', util.ipMatchFunc);
    fm.addFunction('globMatch', util.globMatch);

    return fm;
  }

  // addFunction adds an expression function.
  public addFunction(name: string, func: MatchingFunction): void {
    if (!this.functions.get(name)) {
      this.functions.set(name, func);
    }
  }

  // getFunctions return all functions.
  public getFunctions(): any {
    return this.functions;
  }
}
