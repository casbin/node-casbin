// Copyright 2018 The Casbin Authors. All Rights Reserved.
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

import { ManagementEnforcer } from './managementEnforcer';
import { FunctionMap, Model, newModel } from './model';
import { Adapter, FileAdapter } from './persist';
import { getLogger } from './log';

/**
 * Enforcer = ManagementEnforcer + RBAC API.
 */
export class Enforcer extends ManagementEnforcer {
  /**
   * initWithFile initializes an enforcer with a model file and a policy file.
   * @param modelPath model file path
   * @param policyPath policy file path
   */
  public async initWithFile(modelPath: string, policyPath: string): Promise<void> {
    const a = new FileAdapter(policyPath);
    await this.initWithAdapter(modelPath, a);
  }

  /**
   * initWithAdapter initializes an enforcer with a database adapter.
   * @param modelPath model file path
   * @param adapter current adapter instance
   */
  public async initWithAdapter(modelPath: string, adapter: Adapter): Promise<void> {
    const m = newModel(modelPath, '');
    await this.initWithModelAndAdapter(m, adapter);

    this.modelPath = modelPath;
  }

  /**
   * initWithModelAndAdapter initializes an enforcer with a model and a database adapter.
   * @param m model instance
   * @param adapter current adapter instance
   */
  public async initWithModelAndAdapter(m: Model, adapter: Adapter): Promise<void> {
    if (adapter) {
      this.adapter = adapter;
    }

    this.model = m;
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();

    this.initialize();

    if (this.adapter) {
      // error intentionally ignored
      await this.loadPolicy();
    }
  }
}

/**
 * newEnforcer creates an enforcer via file or DB.
 *
 * File:
 * ```js
 * const e = new Enforcer('path/to/basic_model.conf', 'path/to/basic_policy.csv');
 * ```
 *
 * MySQL DB:
 * ```js
 * const a = new MySQLAdapter('mysql', 'mysql_username:mysql_password@tcp(127.0.0.1:3306)/');
 * const e = new Enforcer('path/to/basic_model.conf', a);
 * ```
 *
 * @param params
 */
export async function newEnforcer(...params: any[]): Promise<Enforcer> {
  const e = new Enforcer();

  let parsedParamLen = 0;
  if (params.length >= 1) {
    const enableLog = params[params.length - 1];
    if (typeof enableLog === 'boolean') {
      getLogger().enableLog(enableLog);
      parsedParamLen++;
    }
  }

  if (params.length - parsedParamLen === 2) {
    if (typeof params[0] === 'string') {
      if (typeof params[1] === 'string') {
        await e.initWithFile(params[0].toString(), params[1].toString());
      } else {
        await e.initWithAdapter(params[0].toString(), params[1]);
      }
    } else {
      if (typeof params[1] === 'string') {
        throw new Error('Invalid parameters for enforcer.');
      } else {
        await e.initWithModelAndAdapter(params[0], params[1]);
      }
    }
  } else if (params.length - parsedParamLen === 1) {
    if (typeof params[0] === 'string') {
      await e.initWithFile(params[0], '');
    } else {
      // @ts-ignore
      await e.initWithModelAndAdapter(params[0], null);
    }
  } else if (params.length === parsedParamLen) {
    await e.initWithFile('', '');
  } else {
    throw new Error('Invalid parameters for enforcer.');
  }

  return e;
}
