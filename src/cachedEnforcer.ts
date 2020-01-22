import { Enforcer, newEnforcerWithClass } from './enforcer';

// CachedEnforcer wraps Enforcer and provides decision cache
export class CachedEnforcer extends Enforcer {
  private enableCache = true;
  private m = new Map<string, boolean>();

  // invalidateCache deletes all the existing cached decisions.
  public invalidateCache(): void {
    this.m = new Map<string, boolean>();
  }

  // setEnableCache determines whether to enable cache on e nforce(). When enableCache is enabled, cached result (true | false) will be returned for previous decisions.
  public setEnableCache(enableCache: boolean): void {
    this.enableCache = enableCache;
  }

  private static canCache(...rvals: any[]): boolean {
    return rvals.every(n => typeof n === 'string');
  }

  private static getCacheKey(...rvals: string[]): string {
    return rvals.join('$$');
  }

  private getCache(key: string): boolean | undefined {
    return this.m.get(key);
  }

  private setCache(key: string, value: boolean): void {
    this.m.set(key, value);
  }

  // enforce decides whether a "subject" can access a "object" with the operation "action", input parameters are usually: (sub, obj, act).
  // if rvals is not string , ingore the cache
  public async enforce(...rvals: any[]): Promise<boolean> {
    if (!this.enableCache) {
      return super.enforce(...rvals);
    }

    let key = '';
    const cache = CachedEnforcer.canCache(...rvals);

    if (cache) {
      key = CachedEnforcer.getCacheKey(...rvals);
      const res = this.getCache(key);

      if (res != undefined) {
        return res;
      }
    }

    const res = await super.enforce(...rvals);

    if (cache) {
      this.setCache(key, res);
    }

    return res;
  }
}

// newCachedEnforcer creates a cached enforcer via file or DB.
export async function newCachedEnforcer(...params: any[]): Promise<CachedEnforcer> {
  return newEnforcerWithClass(CachedEnforcer, ...params);
}
