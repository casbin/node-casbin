import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { BatchAdapter } from './batchAdapter';
import * as util from '../util';
import { arrayEquals } from '../util';

/**
 * StringAdapter is the string adapter for Casbin.
 * It can load policy from a string.
 */
export class StringAdapter implements Adapter, BatchAdapter {
  public policy: string;
  private policies: string[][] = [];

  /**
   * StringAdapter is the constructor for StringAdapter.
   * @param {string} policy policy formatted as a CSV string.
   */

  constructor(policy: string) {
    this.policy = policy;
  }

  /**
   * hasPolicy checks if specific policy exists in storage.
   */
  public hasPolicy(policy: string[]): boolean {
    return this.policies.some((prePolicy) => {
      return util.arrayEquals(prePolicy, policy);
    });
  }

  /**
   * loadPolicy loads data in adapter to model.
   * @param model
   */
  public async loadPolicy(model: Model): Promise<void> {
    if (!this.policy) {
      return;
    }
    await this.loadRules(model, Helper.loadPolicyLine);
  }

  private async loadRules(model: Model, handler: (line: string, model: Model) => void): Promise<void> {
    const rules = this.policy.split('\n');
    rules.forEach((n: string, index: number) => {
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
    this.policy = await this.getPolicy();
    return true;
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
    this.policies.filter((r) => !util.arrayEquals(ruleClone, r));
  }

  /**
   * getPolicy get the storage string
   */
  public async getPolicy(): Promise<string> {
    return this.policies
      .map((p) =>
        p
          .map((value) => {
            return '"' + value + '"';
          })
          .join(', ')
      )
      .join('\n');
  }

  /**
   * getPolicies get policies array
   */
  public async getPolicies(): Promise<string[][]> {
    return this.policies;
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
