// Copyright 2021 The Casbin Authors. All Rights Reserved.
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

import {
  Adapter,
  Enforcer,
  Model,
  newEnforcer as newCasbinEnforcer,
  newModelFromString,
  StringAdapter,
  Helper,
  UpdatableAdapter,
} from '../src';
import { readFileSync } from 'fs';

export async function newEnforcer(model?: string | Model, adapter?: string | Adapter, enableLog = true): Promise<Enforcer> {
  let a: undefined | Adapter;
  if (typeof adapter === 'string') {
    const adapterBuf = readFileSync(adapter);
    a = new StringAdapter(adapterBuf.toString());
  } else {
    a = adapter;
  }

  let m: undefined | Model;
  if (typeof model === 'string') {
    const modelBuf = readFileSync(model);
    m = newModelFromString(modelBuf.toString());
  } else {
    m = model;
  }

  return newCasbinEnforcer(m, a, enableLog);
}

/**
 * FileAdapter is the file adapter for Casbin.
 */
export class FileAdapter implements UpdatableAdapter {
  public readonly filePath: string;

  /**
   * FileAdapter is the constructor for FileAdapter.
   * @param {string} filePath filePath the path of the policy file.
   */
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async loadPolicy(model: Model): Promise<void> {
    if (!this.filePath) {
      throw new Error('invalid file path, file path cannot be empty');
    }
    await this.loadPolicyFile(model, Helper.loadPolicyLine);
  }

  private async loadPolicyFile(model: Model, handler: (line: string, model: Model) => void): Promise<void> {
    const bodyBuf = await readFileSync(this.filePath);
    const lines = bodyBuf.toString().split('\n');
    lines.forEach((n: string, index: number) => {
      if (!n) {
        return;
      }
      handler(n, model);
    });
  }

  /**
   * savePolicy saves all policy rules to the storage.
   */
  public async savePolicy(model: Model): Promise<boolean> {
    throw new Error('not implemented');
  }

  /**
   * addPolicy adds a policy rule to the storage.
   */
  public async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    throw new Error('not implemented');
  }
  /**
   * addPolicies adds policy rules to the storage.
   This is part of the Auto-Save feature.
   */
  public async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * UpdatePolicy updates a policy rule from storage.
   * This is part of the Auto-Save feature.
   */
  updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * removePolicies removes policy rules from the storage.
   * This is part of the Auto-Save feature.
   */
  public async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    throw new Error('not implemented');
  }
}
