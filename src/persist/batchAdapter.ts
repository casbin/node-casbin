import { Adapter } from './adapter';

// BatchAdapter is the interface for Casbin adapters with multiple add and remove policy functions.
export interface BatchAdapter extends Adapter {
  // addPolicies adds policy rules to the storage.
  // This is part of the Auto-Save feature.
  addPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
  // removePolicies removes policy rules from the storage.
  // This is part of the Auto-Save feature.
  removePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
}
