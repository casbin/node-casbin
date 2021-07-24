import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { BatchAdapter } from './batchAdapter';
import * as util from '../util';

/**
 * StringAdapter is the string adapter for Casbin.
 * It can load policy from a string.
 */
export class StringAdapter implements Adapter, BatchAdapter {
  public policy: string;
  private policies: string[][] = new Array<Array<string>>();

  /**
   * StringAdapter is the constructor for StringAdapter.
   * @param {string} policy policy formatted as a CSV string.
   */

  constructor(policy: string) {
    this.policy = policy;
  }

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
    throw new Error('not implemented');
  }

  /**
   * addPolicy adds a policy rule to the storage.
   */
  public async addPolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    const ruleClone = rule.slice();
    ruleClone.unshift(ptype);
    this.policies.push(ruleClone);
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    const ruleClone = rule.slice();
    ruleClone.unshift(ptype);
    this.policies = this.policies.filter((r) => !util.arrayEquals(ruleClone, r));
  }

  public async getPolicy(): Promise<string> {
    return this.policies.map((p) => p.join(', ')).join('\n');
  }

  public async getPolicies(): Promise<string[][]> {
    return this.policies;
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    throw new Error('not implemented');
  }

  public async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    rules.forEach((rule) => {
      this.addPolicy(sec, ptype, rule);
    });
  }

  public async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    rules.forEach((rule) => {
      this.removePolicy(sec, ptype, rule);
    });
  }
}
