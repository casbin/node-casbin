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

import { CoreEnforcer } from './coreEnforcer';

/**
 * InternalEnforcer = CoreEnforcer + Internal API.
 */
export class InternalEnforcer extends CoreEnforcer {
  /**
   * addPolicyInternal adds a rule to the current policy.
   */
  public async addPolicyInternal(sec: string, ptype: string, rule: string[]): Promise<boolean> {
    const ruleAdded = this.model.addPolicy(sec, ptype, rule);
    if (!ruleAdded) {
      return ruleAdded;
    }

    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.addPolicy(sec, ptype, rule);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }

      if (this.watcher) {
        // error intentionally ignored
        this.watcher.update();
      }
    }

    return ruleAdded;
  }

  /**
   * removePolicyInternal removes a rule from the current policy.
   */
  public async removePolicyInternal(sec: string, ptype: string, rule: string[]): Promise<boolean> {
    const ruleRemoved = this.model.removePolicy(sec, ptype, rule);
    if (!ruleRemoved) {
      return ruleRemoved;
    }

    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.removePolicy(sec, ptype, rule);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }

      if (this.watcher) {
        // error intentionally ignored
        this.watcher.update();
      }
    }

    return ruleRemoved;
  }

  /**
   * removeFilteredPolicyInternal removes rules based on field filters from the current policy.
   */
  public async removeFilteredPolicyInternal(sec: string, ptype: string, fieldIndex: number, fieldValues: string[]): Promise<boolean> {
    const ruleRemoved = this.model.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues);
    if (!ruleRemoved) {
      return ruleRemoved;
    }

    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }

      if (this.watcher) {
        // error intentionally ignored
        this.watcher.update();
      }
    }

    return ruleRemoved;
  }
}
