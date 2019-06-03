import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { arrayToString } from '../util';

/**
 * MemoryAdapter is the memory adapter for Casbin.
 * It can load policy from memory or save policy to memory.
 */
export class MemoryAdapter implements Adapter {
  private data: Array<string>;

  /**
   * MemoryAdapter is the constructor for MemoryAdapter.
   * @param {Array<string>} data filePath the path of the policy file.
   */
  constructor(data: Array<string>) {
    this.data = data;
  }

  public async loadPolicy(model: Model): Promise<void> {
    if (!this.data) {
      return;
    }

    const lines = this.data;

    lines.forEach((n: string) => {
      const line = n.trim();

      if (!line) {
        return;
      }

      Helper.loadPolicyLine(n, model);
    });
  }

  /**
   * savePolicy saves all policy rules to the storage.
   */
  public async savePolicy(model: Model): Promise<boolean> {
    if (!this.data) {
      return false;
    }

    let result: Array<string> = [];

    const pList = model.model.get('p');

    if (!pList) {
      return false;
    }

    pList.forEach(n => {
      n.policy.forEach(m => {
        const item = n.key + ', ' + arrayToString(m);
        result.push(item);
      });
    });

    const gList = model.model.get('g');

    if (!gList) {
      return false;
    }

    gList.forEach(n => {
      n.policy.forEach(m => {
        const item = n.key + ', ' + arrayToString(m);
        result.push(item);
      });
    });

    this.data = result;

    return true;
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
  public async removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<void> {
    throw new Error('not implemented');
  }
}
