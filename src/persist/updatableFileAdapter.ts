import { FileAdapter } from './fileAdapter';
import { UpdatableAdapter } from './updatableAdapter';

/**
 * UpdatableFileAdapter is the file adapter for Casbin.
 * It can updates policy from file.
 */
export class UpdatableFileAdapter extends FileAdapter implements UpdatableAdapter {
  /**
   * FileAdapter is the constructor for FileAdapter.
   * @param {string} filePath filePath the path of the policy file.
   */
  constructor(filePath: string) {
    super(filePath);
  }

  // updatePolicy updates a policy rules to the storage.
  // This is part of the Auto-Save feature.
  updatePolicy(sec: string, ptype: string, oldRule: string[], newRule: string[]): Promise<void> {
    throw new Error('not implemented');
  }
}
