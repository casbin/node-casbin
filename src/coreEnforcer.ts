// Copyright 2018 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { compileAsync, compile } from 'expression-eval';

import { DefaultEffector, Effect, Effector } from './effect';
import { FunctionMap, Model, newModel } from './model';
import { Adapter, Filter, FilteredAdapter, Watcher } from './persist';
import { DefaultRoleManager, RoleManager } from './rbac';
import { generateGFunction } from './util';
import { getLogger, logPrint } from './log';

/**
 * CoreEnforcer defines the core functionality of an enforcer.
 */
export class CoreEnforcer {
  protected modelPath: string;
  protected model: Model;
  protected fm: FunctionMap;
  private eft: Effector;
  private matcherMap: Map<string, ((context: object) => Promise<any>) | ((context: object) => any)>;

  protected adapter: FilteredAdapter | Adapter;
  protected watcher: Watcher | null = null;
  protected rm: RoleManager;

  private enabled: boolean;
  protected autoSave: boolean;
  protected autoBuildRoleLinks: boolean;

  public initialize(): void {
    this.rm = new DefaultRoleManager(10);
    this.eft = new DefaultEffector();
    this.matcherMap = new Map();
    this.watcher = null;

    this.enabled = true;
    this.autoSave = true;
    this.autoBuildRoleLinks = true;
  }

  /**
   * loadModel reloads the model from the model CONF file.
   * Because the policy is attached to a model,
   * so the policy is invalidated and needs to be reloaded by calling LoadPolicy().
   */
  public loadModel(): void {
    this.model = newModel();
    this.model.loadModel(this.modelPath);
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();
  }

  /**
   * getModel gets the current model.
   *
   * @return the model of the enforcer.
   */
  public getModel(): Model {
    return this.model;
  }

  /**
   * setModel sets the current model.
   *
   * @param m the model.
   */
  public setModel(m: Model): void {
    this.model = m;
    this.fm = FunctionMap.loadFunctionMap();
  }

  /**
   * getAdapter gets the current adapter.
   *
   * @return the adapter of the enforcer.
   */
  public getAdapter(): Adapter {
    return this.adapter;
  }

  /**
   * setAdapter sets the current adapter.
   *
   * @param adapter the adapter.
   */
  public setAdapter(adapter: Adapter): void {
    this.adapter = adapter;
  }

  /**
   * setWatcher sets the current watcher.
   *
   * @param watcher the watcher.
   */
  public setWatcher(watcher: Watcher): void {
    this.watcher = watcher;
    watcher.setUpdateCallback(async () => await this.loadPolicy());
  }

  /**
   * setRoleManager sets the current role manager.
   *
   * @param rm the role manager.
   */
  public setRoleManager(rm: RoleManager): void {
    this.rm = rm;
  }

  /**
   * setEffector sets the current effector.
   *
   * @param eft the effector.
   */
  public setEffector(eft: Effector): void {
    this.eft = eft;
  }

  /**
   * clearPolicy clears all policy.
   */
  public clearPolicy(): void {
    this.model.clearPolicy();
  }

  /**
   * loadPolicy reloads the policy from file/database.
   */
  public async loadPolicy(): Promise<void> {
    this.model.clearPolicy();
    await this.adapter.loadPolicy(this.model);

    this.model.printPolicy();
    if (this.autoBuildRoleLinks) {
      await this.buildRoleLinksInternal();
    }
  }

  /**
   * loadFilteredPolicy reloads a filtered policy from file/database.
   *
   * @param filter the filter used to specify which type of policy should be loaded.
   */
  public async loadFilteredPolicy(filter: Filter): Promise<boolean> {
    this.model.clearPolicy();

    if ((this.adapter as FilteredAdapter).isFiltered()) {
      await (this.adapter as FilteredAdapter).loadFilteredPolicy(this.model, filter);
    } else {
      throw new Error('filtered policies are not supported by this adapter');
    }

    this.model.printPolicy();
    if (this.autoBuildRoleLinks) {
      await this.buildRoleLinksInternal();
    }
    return true;
  }

  /**
   * isFiltered returns true if the loaded policy has been filtered.
   *
   * @return if the loaded policy has been filtered.
   */
  public isFiltered(): boolean {
    if ((this.adapter as FilteredAdapter).isFiltered) {
      return (this.adapter as FilteredAdapter).isFiltered();
    }
    return false;
  }

  /**
   * savePolicy saves the current policy (usually after changed with
   * Casbin API) back to file/database.
   */
  public async savePolicy(): Promise<boolean> {
    if (this.isFiltered()) {
      throw new Error('Cannot save a filtered policy');
    }
    const flag = await this.adapter.savePolicy(this.model);
    if (!flag) {
      return false;
    }
    if (this.watcher) {
      return await this.watcher.update();
    }
    return true;
  }

  /**
   * enableEnforce changes the enforcing state of Casbin, when Casbin is
   * disabled, all access will be allowed by the enforce() function.
   *
   * @param enable whether to enable the enforcer.
   */
  public enableEnforce(enable: boolean): void {
    this.enabled = enable;
  }

  /**
   * enableLog changes whether to print Casbin log to the standard output.
   *
   * @param enable whether to enable Casbin's log.
   */
  public enableLog(enable: boolean): void {
    getLogger().enableLog(enable);
  }

  /**
   * enableAutoSave controls whether to save a policy rule automatically to
   * the adapter when it is added or removed.
   *
   * @param autoSave whether to enable the AutoSave feature.
   */
  public enableAutoSave(autoSave: boolean): void {
    this.autoSave = autoSave;
  }

  /**
   * enableAutoBuildRoleLinks controls whether to save a policy rule
   * automatically to the adapter when it is added or removed.
   *
   * @param autoBuildRoleLinks whether to automatically build the role links.
   */
  public enableAutoBuildRoleLinks(autoBuildRoleLinks: boolean): void {
    this.autoBuildRoleLinks = autoBuildRoleLinks;
  }

  /**
   * buildRoleLinks manually rebuild the role inheritance relations.
   */
  public async buildRoleLinks(): Promise<void> {
    return this.buildRoleLinksInternal();
  }

  protected async buildRoleLinksInternal(): Promise<void> {
    await this.rm.clear();
    await this.model.buildRoleLinks(this.rm);
  }

  private async privateEnforce(asyncCompile = true, ...rvals: any[]): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    const functions: { [key: string]: any } = {};
    this.fm.getFunctions().forEach((value: any, key: string) => {
      functions[key] = value;
    });

    const astMap = this.model.model.get('g');

    astMap?.forEach((value, key) => {
      const rm = value.rm;
      functions[key] = generateGFunction(rm);
    });

    const expString = this.model.model.get('m')?.get('m')?.value;
    if (!expString) {
      throw new Error('Unable to find matchers in model');
    }

    const effect = this.model.model.get('e')?.get('e')?.value;
    if (!effect) {
      throw new Error('Unable to find policy_effect in model');
    }

    const matcherKey = `${asyncCompile ? 'ASYNC[' : 'SYNC['}${expString}]`;

    let expression = this.matcherMap.get(matcherKey);
    if (!expression) {
      expression = asyncCompile ? compileAsync(expString) : compile(expString);
      this.matcherMap.set(matcherKey, expression);
    }

    let policyEffects: Effect[];
    let matcherResults: number[];

    const p = this.model.model.get('p')?.get('p');
    const policyLen = p?.policy?.length;

    const rTokens = this.model.model.get('r')?.get('r')?.tokens;
    const rTokensLen = rTokens?.length;

    if (policyLen && policyLen !== 0) {
      policyEffects = new Array(policyLen);
      matcherResults = new Array(policyLen);

      for (let i = 0; i < policyLen; i++) {
        const parameters: { [key: string]: any } = {};

        if (rTokens?.length !== rvals.length) {
          throw new Error(`invalid request size: expected ${rTokensLen}, got ${rvals.length}, rvals: ${rvals}"`);
        }

        rTokens.forEach((token, j) => {
          parameters[token] = rvals[j];
        });

        p?.tokens.forEach((token, j) => {
          parameters[token] = p?.policy[i][j];
        });

        const context = { ...parameters, ...functions };
        const result = asyncCompile ? await expression(context) : expression(context);

        switch (typeof result) {
          case 'boolean':
            if (!result) {
              policyEffects[i] = Effect.Indeterminate;
              continue;
            }
            break;
          case 'number':
            if (result === 0) {
              policyEffects[i] = Effect.Indeterminate;
              continue;
            } else {
              matcherResults[i] = result;
            }
            break;
          default:
            throw new Error('matcher result should be boolean or number');
        }

        const eft = parameters['p_eft'];
        if (eft) {
          if (eft === 'allow') {
            policyEffects[i] = Effect.Allow;
          } else if (eft === 'deny') {
            policyEffects[i] = Effect.Deny;
          } else {
            policyEffects[i] = Effect.Indeterminate;
          }
        } else {
          policyEffects[i] = Effect.Allow;
        }

        if (effect === 'priority(p_eft) || deny') {
          break;
        }
      }
    } else {
      policyEffects = new Array(1);
      matcherResults = new Array(1);

      const parameters: { [key: string]: any } = {};

      rTokens?.forEach((token, j): void => {
        parameters[token] = rvals[j];
      });

      p?.tokens?.forEach(token => {
        parameters[token] = '';
      });

      const context = { ...parameters, ...functions };
      const result = asyncCompile ? await expression(context) : expression(context);

      if (result) {
        policyEffects[0] = Effect.Allow;
      } else {
        policyEffects[0] = Effect.Indeterminate;
      }
    }

    const res = this.eft.mergeEffects(effect, policyEffects, matcherResults);

    // only generate the request --> result string if the message
    // is going to be logged.
    if (getLogger().isEnable()) {
      let reqStr = 'Request: ';
      for (let i = 0; i < rvals.length; i++) {
        if (i !== rvals.length - 1) {
          reqStr += `${rvals[i]}, `;
        } else {
          reqStr += rvals[i];
        }
      }
      reqStr += ` ---> ${res}`;
      logPrint(reqStr);
    }

    return res;
  }

  /**
   * If the matchers does not contain an asynchronous method, call it faster.
   *
   * enforceWithSyncCompile decides whether a "subject" can access a "object" with
   * the operation "action", input parameters are usually: (sub, obj, act).
   *
   * @param rvals the request needs to be mediated, usually an array
   *              of strings, can be class instances if ABAC is used.
   * @return whether to allow the request.
   */
  public async enforceWithSyncCompile(...rvals: any[]): Promise<boolean> {
    return this.privateEnforce(false, ...rvals);
  }

  /**
   * enforce decides whether a "subject" can access a "object" with
   * the operation "action", input parameters are usually: (sub, obj, act).
   *
   * @param rvals the request needs to be mediated, usually an array
   *              of strings, can be class instances if ABAC is used.
   * @return whether to allow the request.
   */
  public async enforce(...rvals: any[]): Promise<boolean> {
    return this.privateEnforce(true, ...rvals);
  }
}
