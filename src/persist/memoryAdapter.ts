import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { BatchAdapter } from './batchAdapter';
import { arrayEquals, policyArrayToString, policyStringToArray } from '../util';

/**
 * MemoryAdapter is the memory adapter for Casbin.
 * It can load policy from a string.
 */
export class MemoryAdapter implements Adapter, BatchAdapter {
  protected policies: string[][] = [];

  /**
   * MemoryAdapter is the constructor for MemoryAdapter.
   * @param policy - policy formatted as a CSV string, or policy array.
   */
  constructor(policy: string | string[][]) {
    if (!policy) {
      return;
    }
    if (typeof policy === 'string') {
      this.policies = policyStringToArray(policy);
    } else {
      this.policies = policy;
    }
  }

  /**
   * hasPolicy checks if specific policy exists in storage.
   */
  public hasPolicy(policy: string[]): boolean {
    return this.policies.some((prePolicy) => {
      return arrayEquals(prePolicy, policy);
    });
  }

  /**
   * loadPolicy loads data in adapter to model.
   * @param model
   */
  public async loadPolicy(model: Model): Promise<void> {
    this.policies.forEach((n: string[]) => {
      if (!n) {
        return;
      }
      Helper.loadPolicyLine(policyArrayToString(n), model);
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
    const policy = rule.slice();
    policy.unshift(ptype);
    if (!this.hasPolicy(rule)) {
      this.policies.push(policy);
    }
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    const ruleClone = rule.slice();
    ruleClone.unshift(ptype);
    this.policies = this.policies.filter((r) => !arrayEquals(ruleClone, r));
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * addPolicies adds policy rules to the storage.
   */
  public async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    for (const rule of rules) {
      if (!this.hasPolicy(rule)) {
        await this.addPolicy(sec, ptype, rule);
      }
    }
  }

  /**
   * removePolicies removes policy rules from the storage.
   * This is part of the Auto-Save feature.
   */
  public async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    this.policies = this.policies.filter((rule) => {
      return !rules.some((deleteRule) => arrayEquals(deleteRule, rule));
    });
  }
}
