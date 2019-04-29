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

import * as rbac from '../rbac';
import * as _ from 'lodash';
import { logPrint } from '../log';

// Assertion represents an expression in a section of the model.
// For example: r = sub, obj, act
export class Assertion {
  public key: string;
  public value: string;
  public tokens: string[];
  public policy: string[][];
  public rm: rbac.RoleManager;

  /**
   * constructor is the constructor for Assertion.
   */
  constructor() {
    this.key = '';
    this.value = '';
    this.tokens = [];
    this.policy = [];
    this.rm = new rbac.DefaultRoleManager(0);
  }

  public async buildRoleLinks(rm: rbac.RoleManager): Promise<void> {
    this.rm = rm;
    const count = _.words(this.value, /_/g).length;
    for (const rule of this.policy) {
      if (count < 2) {
        throw new Error(
          'the number of "_" in role definition should be at least 2'
        );
      }

      if (rule.length < count) {
        throw new Error('grouping policy elements do not meet role definition');
      }

      if (count === 2) {
        // error intentionally ignored
        await this.rm.addLink(rule[0], rule[1]);
      } else if (count === 3) {
        // error intentionally ignored
        await this.rm.addLink(rule[0], rule[1], rule[2]);
      } else if (count === 4) {
        // error intentionally ignored
        await this.rm.addLink(rule[0], rule[1], rule[2], rule[3]);
      }
    }

    logPrint(`Role links for: ${this.key}`);
    await this.rm.printRoles();
  }
}
