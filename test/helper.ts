import { Adapter, Enforcer, Model, newEnforcer as newEnforcerWithModelAndAdapter, newModelFromString } from '../src';
import { readFileSync } from 'fs';
import { FileAdapter } from '../src/adapter/node';

export function newEnforcer(m?: string | Model, a?: string | Adapter, enableLog = false): Promise<Enforcer> {
  let model: Model | undefined;
  let adapter: Adapter | undefined;

  if (typeof m === 'string') {
    model = newModelFromString(readFileSync(m).toString());
  } else {
    model = m;
  }

  if (typeof a === 'string') {
    adapter = new FileAdapter(a);
  } else {
    adapter = a;
  }

  return newEnforcerWithModelAndAdapter(model, adapter, enableLog);
}
