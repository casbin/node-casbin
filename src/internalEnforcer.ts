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
import { BatchAdapter } from './persist';
import { UpdatableAdapter } from './persist';
import { PolicyOp } from './model';

/**
 * InternalEnforcer = CoreEnforcer + Internal API.
 */
export class InternalEnforcer extends CoreEnforcer {
  /**
   * addPolicyInternal adds a rule to the current policy.
   */
  public async addPolicyInternal(sec: string, ptype: string, rule: string[]): Promise<boolean> {
    if (this.model.hasPolicy(sec, ptype, rule)) {
      return false;
    }

    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.addPolicy(sec, ptype, rule);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // error intentionally ignored
      this.watcher.update();
    }

    const ok = this.model.addPolicy(sec, ptype, rule);

    if (sec === 'g' && ok) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyAdd, ptype, [rule]);
    }
    return ok;
  }

  // addPolicies adds rules to the current policy.
  // removePolicies removes rules from the current policy.
  public async addPoliciesInternal(sec: string, ptype: string, rules: string[][]): Promise<boolean> {
    for (const rule of rules) {
      if (this.model.hasPolicy(sec, ptype, rule)) {
        return false;
      }
    }

    if (this.autoSave) {
      if ('addPolicies' in this.adapter) {
        try {
          await this.adapter.addPolicies(sec, ptype, rules);
        } catch (e) {
          if (e.message !== 'not implemented') {
            throw e;
          }
        }
      } else {
        throw new Error('cannot to save policy, the adapter does not implement the BatchAdapter');
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // error intentionally ignored
      this.watcher.update();
    }

    const [ok, effects] = await this.model.addPolicies(sec, ptype, rules);
    if (sec === 'g' && ok && effects?.length) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyAdd, ptype, effects);
    }
    return ok;
  }

  /**
   * updatePolicyInternal updates a rule from the current policy.
   */
  public async updatePolicyInternal(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<boolean> {
    if (!this.model.hasPolicy(sec, ptype, oldRule)) {
      return false;
    }

    if (this.autoSave) {
      if ('updatePolicy' in this.adapter) {
        try {
          await this.adapter.updatePolicy(sec, ptype, oldRule, newRule);
        } catch (e) {
          if (e.message !== 'not implemented') {
            throw e;
          }
        }
      } else {
        throw new Error('cannot to update policy, the adapter does not implement the UpdatableAdapter');
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // In fact I think it should wait for the respond, but they implement add_policy() like this
      // error intentionally ignored
      this.watcher.update();
    }

    const ok = this.model.updatePolicy(sec, ptype, oldRule, newRule);
    if (sec === 'g' && ok) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyRemove, ptype, [oldRule]);
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyAdd, ptype, [newRule]);
    }

    return ok;
  }

  /**
   * removePolicyInternal removes a rule from the current policy.
   */
  public async removePolicyInternal(sec: string, ptype: string, rule: string[]): Promise<boolean> {
    if (!this.model.hasPolicy(sec, ptype, rule)) {
      return false;
    }

    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.removePolicy(sec, ptype, rule);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // error intentionally ignored
      this.watcher.update();
    }

    const ok = await this.model.removePolicy(sec, ptype, rule);
    if (sec === 'g' && ok) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyRemove, ptype, [rule]);
    }
    return ok;
  }

  // removePolicies removes rules from the current policy.
  public async removePoliciesInternal(sec: string, ptype: string, rules: string[][]): Promise<boolean> {
    for (const rule of rules) {
      if (!this.model.hasPolicy(sec, ptype, rule)) {
        return false;
      }
    }

    if (this.autoSave) {
      if ('removePolicies' in this.adapter) {
        try {
          await this.adapter.removePolicies(sec, ptype, rules);
        } catch (e) {
          if (e.message !== 'not implemented') {
            throw e;
          }
        }
      } else {
        throw new Error('cannot to save policy, the adapter does not implement the BatchAdapter');
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // error intentionally ignored
      this.watcher.update();
    }

    const [ok, effects] = this.model.removePolicies(sec, ptype, rules);
    if (sec === 'g' && ok && effects?.length) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyRemove, ptype, effects);
    }
    return ok;
  }

  /**
   * removeFilteredPolicyInternal removes rules based on field filters from the current policy.
   */
  public async removeFilteredPolicyInternal(sec: string, ptype: string, fieldIndex: number, fieldValues: string[]): Promise<boolean> {
    if (this.adapter && this.autoSave) {
      try {
        await this.adapter.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues);
      } catch (e) {
        if (e.message !== 'not implemented') {
          throw e;
        }
      }
    }

    if (this.watcher && this.autoNotifyWatcher) {
      // error intentionally ignored
      this.watcher.update();
    }

    const [ok, effects] = this.model.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues);
    if (sec === 'g' && ok && effects?.length) {
      await this.buildIncrementalRoleLinks(PolicyOp.PolicyRemove, ptype, effects);
    }
    return ok;
  }
}
