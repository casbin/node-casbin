import { readFileSync } from 'fs';
import { Adapter, Enforcer, Model, newEnforcer, MemoryAdapter } from '../src';

export function path2Content(path: string): string {
  return readFileSync(path).toString().replace(new RegExp('\r\n', 'g'), '\n');
}

export async function getEnforcerWithPath(
  modelPath?: string | Model,
  policyPath?: string | Adapter,
  logOption?: boolean
): Promise<Enforcer> {
  if (!modelPath) {
    return await newEnforcer();
  }
  if (typeof modelPath === 'string') {
    modelPath = path2Content(modelPath);
  }
  if (!policyPath) {
    return await newEnforcer(modelPath);
  }
  if (typeof policyPath === 'string') {
    policyPath = path2Content(policyPath);
  }
  if (!logOption) {
    return await newEnforcer(modelPath, policyPath);
  }
  return await newEnforcer(modelPath, policyPath, logOption);
}

export function getStringAdapter(path: string): MemoryAdapter {
  return new MemoryAdapter(path2Content(path));
}
