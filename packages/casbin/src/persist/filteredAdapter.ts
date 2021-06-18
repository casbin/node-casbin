import { Model } from '../model';
import { Adapter } from './adapter';

export interface FilteredAdapter extends Adapter {
  // loadFilteredPolicy loads only policy rules that match the filter.
  loadFilteredPolicy(model: Model, filter: any): Promise<void>;
  // isFiltered returns true if the loaded policy has been filtered.
  isFiltered(): boolean;
}
