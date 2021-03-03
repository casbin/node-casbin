import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { arrayToString, readFile, writeFile } from '../util';

/**
 * FileAdapter is the file adapter for Casbin.
 * It can load policy from file or save policy to file.
 */
export class FileAdapter implements Adapter {
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
      // throw new Error('invalid file path, file path cannot be empty');
      return;
    }
    await this.loadPolicyFile(model, Helper.loadPolicyLine);
  }

  private async loadPolicyFile(model: Model, handler: (line: string, model: Model) => void): Promise<void> {
    const bodyBuf = await readFile(this.filePath);
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
    if (!this.filePath) {
      // throw new Error('invalid file path, file path cannot be empty');
      return false;
    }
    let result = '';

    const pList = model.model.get('p');
    if (!pList) {
      return false;
    }
    pList.forEach((n) => {
      n.policy.forEach((m) => {
        result += n.key + ', ';
        result += arrayToString(m);
        result += '\n';
      });
    });

    const gList = model.model.get('g');
    if (!gList) {
      return false;
    }
    gList.forEach((n) => {
      n.policy.forEach((m) => {
        result += n.key + ', ';
        result += arrayToString(m);
        result += '\n';
      });
    });

    await this.savePolicyFile(result.trim());
    return true;
  }

  private async savePolicyFile(text: string): Promise<void> {
    await writeFile(this.filePath, text);
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
