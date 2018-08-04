import { Adapter } from './adapter';
import { Model } from '../model';
import { Helper } from './helper';
import { readFileSync, writeFileSync } from 'fs';
import { arrayToString } from '../util';

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

  public loadPolicy(model: Model): void {
    if (!this.filePath) {
      // throw new Error('invalid file path, file path cannot be empty');
      return;
    }
    this.loadPolicyFile(model, Helper.loadPolicyLine);
  }

  private loadPolicyFile(model: Model, handler: (line: string, model: Model) => void
  ) {
    const bodyBuf = readFileSync(this.filePath);
    const lines = bodyBuf.toString().split('\n');
    lines.forEach((n, index) => {
      const line = n.trim();
      if (!line) {
        return;
      }
      handler(n, model);
    });
  }

  /**
   * addPolicy adds a policy rule to the storage.
   */
  public addPolicy(sec: string, ptype: string, rule: string[]): void {
    throw new Error('not implemented');
  }

  /**
   * savePolicy saves all policy rules to the storage.
   */
  public savePolicy(model: Model): void {
    if (!this.filePath) {
      // throw new Error('invalid file path, file path cannot be empty');
      return;
    }
    let result = '';

    const pList = model.model.get('p');
    if (!pList) {
      return;
    }
    pList.forEach(n => {
      n.policy.forEach(m => {
        result += n.key + ', ';
        result += arrayToString([...m.values()]);
        result += '\n';
      });
    });

    const gList = model.model.get('g');
    if (!gList) {
      return;
    }
    gList.forEach(n => {
      n.policy.forEach(m => {
        result += n.key + ', ';
        result += arrayToString([...m.values()]);
        result += '\n';
      });
    });

    this.savePolicyFile(result.trim());
  }

  private savePolicyFile(text: string) {
    writeFileSync(this.filePath, text);
  }

  /**
   * removePolicy removes a policy rule from the storage.
   */
  public removePolicy(sec: string, ptype: string, rule: string[]): void {
    throw new Error('not implemented');
  }

  /**
   * removeFilteredPolicy removes policy rules that match the filter from the storage.
   */
  public removeFilteredPolicy(sec: string, ptype: string, fieldIndex: number, ...fieldValues: string[]
  ): void {
    throw new Error('not implemented');
  }
}
