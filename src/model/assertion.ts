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
import { logPrint } from '../log';
import { PolicyOp } from './model';

// Assertion represents an expression in a section of the model.
// For example: r = sub, obj, act
export class Assertion {
  public key: string;
  public value: string;
  public tokens: string[];
  public policy: string[][];
  public rm: rbac.RoleManager;
  public fieldIndexMap: Map<string, number>;
  public policyIndexMap: Map<string, number[]>;

  /**
   * constructor is the constructor for Assertion.
   */
  constructor() {
    this.key = '';
    this.value = '';
    this.tokens = [];
    this.policy = [];
    this.rm = new rbac.DefaultRoleManager(10);
    this.fieldIndexMap = new Map<string, number>();
    this.policyIndexMap = new Map<string, number[]>();
  }

  /**
   * buildPolicyIndex builds an index for policies by subject (first field).
   * This improves performance when checking permissions with many policies.
   */
  public buildPolicyIndex(): void {
    this.policyIndexMap.clear();
    for (let i = 0; i < this.policy.length; i++) {
      const rule = this.policy[i];
      if (rule.length > 0) {
        const subject = rule[0];
        const indices = this.policyIndexMap.get(subject);
        if (indices) {
          indices.push(i);
        } else {
          this.policyIndexMap.set(subject, [i]);
        }
      }
    }
  }

  /**
   * addPolicyIndex adds an index entry for a newly added policy.
   */
  public addPolicyIndex(rule: string[], index: number): void {
    if (rule.length > 0) {
      const subject = rule[0];
      const indices = this.policyIndexMap.get(subject);
      if (indices) {
        indices.push(index);
      } else {
        this.policyIndexMap.set(subject, [index]);
      }
    }
  }

  /**
   * removePolicyIndex removes an index entry for a deleted policy.
   * Since we don't track exact indices, we rebuild the entire index for efficiency.
   */
  public removePolicyIndex(rule: string[]): void {
    // Simply rebuild the entire index
    // This is more efficient than trying to track and update individual indices
    this.buildPolicyIndex();
  }

  public async buildIncrementalRoleLinks(rm: rbac.RoleManager, op: PolicyOp, rules: string[][]): Promise<void> {
    this.rm = rm;
    const count = (this.value.match(/_/g) || []).length;
    if (count < 2) {
      throw new Error('the number of "_" in role definition should be at least 2');
    }
    for (let rule of rules) {
      if (rule.length < count) {
        throw new Error('grouping policy elements do not meet role definition');
      }
      if (rule.length > count) {
        rule = rule.slice(0, count);
      }
      switch (op) {
        case PolicyOp.PolicyAdd:
          await this.rm.addLink(rule[0], rule[1], ...rule.slice(2));
          break;
        case PolicyOp.PolicyRemove:
          await this.rm.deleteLink(rule[0], rule[1], ...rule.slice(2));
          break;
        default:
          throw new Error('unsupported operation');
      }
    }
  }

  public async buildRoleLinks(rm: rbac.RoleManager): Promise<void> {
    this.rm = rm;
    const count = (this.value.match(/_/g) || []).length;
    if (count < 2) {
      throw new Error('the number of "_" in role definition should be at least 2');
    }
    for (let rule of this.policy) {
      if (rule.length > count) {
        rule = rule.slice(0, count);
      }
      await this.rm.addLink(rule[0], rule[1], ...rule.slice(2));
    }
    logPrint(`Role links for: ${this.key}`);
    await this.rm.printRoles();
  }
}
