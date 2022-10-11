import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';

/**
 * StringAdapter is the string adapter for Casbin.
 * It can load policy from a string.
 */
export class StringAdapter implements Adapter {
  public readonly policy: string;

  /**
   * StringAdapter is the constructor for StringAdapter.
   * @param {string} policy policy formatted as a CSV string.
   */

  constructor(policy: string) {
    this.policy = policy;
  }

  public async loadPolicy(model: Model): Promise<void> {
    if (!this.policy) {
      throw new Error('Invalid policy, policy document cannot be false-y');
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
    throw new Error('not implemented');
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public async removePolicy(sec: string, ptype: string, rule: string[]): Promise<void> {
    throw new Error('not implemented');
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public async removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<void> {
    throw new Error('not implemented');
  }
}
