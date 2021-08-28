import { readFileSync } from 'fs';
import { Adapter, Enforcer, Model, newEnforcer, MemoryAdapter } from '../src';

export function path2Content(path: string): string {
  return readFileSync(path).toString().replace(new RegExp('\r\n', 'g'), '\n');
}

export async function getEnforcerWithPath(modelPath?: string | Model, policyPath?: string | Adapter, logOption = false): Promise<Enforcer> {
  if (!modelPath) {
    return await newEnforcer();
  }

  let m: Model;
  if (typeof modelPath === 'string') {
    m = new Model(path2Content(modelPath));
  } else {
    m = modelPath;
  }

  let a: Adapter | undefined;
  if (typeof policyPath === 'string') {
    a = new MemoryAdapter(path2Content(policyPath));
  } else {
    a = policyPath;
  }

  return await newEnforcer(m, a, logOption);
}

export function getStringAdapter(path: string): MemoryAdapter {
  return new MemoryAdapter(path2Content(path));
}
