import { FilteredAdapter } from './filteredAdapter';
import { Model } from '../model';
import { Helper } from './helper';
import { MemoryAdapter } from './memoryAdapter';
import { policyArrayToString, policyStringToArray } from '../util';

export class Filter {
  public g: string[] = [];
  public p: string[] = [];
}

export class DefaultFilteredAdapter extends MemoryAdapter implements FilteredAdapter {
  private filtered: boolean;

  constructor(policy: string) {
    super(policy);
    this.filtered = false;
  }

  // loadPolicy loads all policy rules from the storage.
  public async loadPolicy(model: Model): Promise<void> {
    this.filtered = false;
    await super.loadPolicy(model);
  }

  public async loadFilteredPolicy(model: Model, filter: Filter): Promise<void> {
    if (!filter) {
      await this.loadPolicy(model);
      return;
    }

    await this.loadFilteredPolicyFile(model, filter, Helper.loadPolicyLine);
    this.filtered = true;
  }

  private async loadFilteredPolicyFile(model: Model, filter: Filter, handler: (line: string, model: Model) => void): Promise<void> {
    this.policies.forEach((n: string[]) => {
      const line = policyArrayToString(n);
      if (!line || DefaultFilteredAdapter.filterLine(line, filter)) {
        return;
      }
      handler(line, model);
    });
  }

  public isFiltered(): boolean {
    return this.filtered;
  }

  public async savePolicy(model: Model): Promise<boolean> {
    if (this.filtered) {
      throw new Error('cannot save a filtered policy');
    }
    await super.savePolicy(model);
    return true;
  }

  private static filterLine(line: string, filter: Filter): boolean {
    if (!filter) {
      return false;
    }
    const p = line.split(',');
    if (p.length === 0) {
      return true;
    }
    let filterSlice: string[] = [];
    switch (p[0].trim()) {
      case 'p':
        filterSlice = filter.p;
        break;
      case 'g':
        filterSlice = filter.g;
        break;
    }

    return DefaultFilteredAdapter.filterWords(p, filterSlice);
  }

  private static filterWords(line: string[], filter: string[]): boolean {
    if (line.length < filter.length + 1) {
      return true;
    }
    let skipLine = false;
    for (let i = 0; i < filter.length; i++) {
      if (filter[i] && filter[i] !== filter[i + 1]) {
        skipLine = true;
        break;
      }
    }
    return skipLine;
  }
}
