import { Adapter } from './adapter';

// BatchAdapter is the interface for Casbin adapters with multiple add and remove policy functions.
export interface BatchAdapter extends Adapter {
  // AddPolicies adds policy rules to the storage.
  // This is part of the Auto-Save feature.
  AddPolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
  // RemovePolicies removes policy rules from the storage.
  // This is part of the Auto-Save feature.
  RemovePolicies(sec: string, ptype: string, rules: string[][]): Promise<void>;
}
