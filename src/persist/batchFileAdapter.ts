import { FileAdapter } from './fileAdapter';
import { BatchAdapter } from './batchAdapter';

/**
 * FileAdapter is the file adapter for Casbin.
 * It can load policy from file or save policy to file.
 */
export class BatchFileAdapter extends FileAdapter implements BatchAdapter {
  /**
   * FileAdapter is the constructor for FileAdapter.
   * @param {string} filePath filePath the path of the policy file.
   */
  constructor(filePath: string) {
    super(filePath);
  }

  // addPolicies adds policy rules to the storage.
  // This is part of the Auto-Save feature.
  public async addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    throw new Error('not implemented');
  }

  // removePolicies removes policy rules from the storage.
  // This is part of the Auto-Save feature.
  public async removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void> {
    throw new Error('not implemented');
  }
}
