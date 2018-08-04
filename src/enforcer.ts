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

import {
  generateGFunction,
  getEnableLog,
  logPrint,
  setEnableLog,
  Valuate
} from './util';
import { FunctionMap, Model } from './model';
import { DefaultEffector, Effect, Effector } from './effect';

import * as _ from 'lodash';
import {
  Adapter,
  DefaultFilteredAdapter,
  FileAdapter,
  Filter,
  FilteredAdapter,
  Watcher
} from './persist';
import { DefaultRoleManager, RoleManager } from './rbac';

// Enforcer is the main interface for authorization enforcement and policy management.
export class Enforcer {
  public model: Model;
  private modelPath: string;
  private fm: Map<string, any>;
  public eft: Effector;

  private adapter: FilteredAdapter | Adapter;
  private watcher: Watcher | null = null;
  public rm: RoleManager;
  public enabled: boolean;
  private autoSave: boolean;
  private autoBuildRoleLinks: boolean;

  // constructor is the constructor for Enforcer.
  // It creates an enforcer via file or DB.
  // File:
  // e := NewEnforcer("path/to/basic_model.conf", "path/to/basic_policy.csv")
  // MySQL DB:
  // a := mysqladapter.NewDBAdapter("mysql", "mysql_username:mysql_password@tcp(127.0.0.1:3306)/")
  // e := casbin.NewEnforcer("path/to/basic_model.conf", a)
  constructor(...params: any[]) {
    this.rm = new DefaultRoleManager(10);
    this.eft = new DefaultEffector();

    let parsedParamLen = 0;
    if (params.length >= 1) {
      const enableLog = params[params.length - 1];
      if (typeof enableLog === 'boolean') {
        setEnableLog(enableLog);
        parsedParamLen++;
      }
    }

    if (params.length - parsedParamLen === 2) {
      if (typeof params[0] === 'string') {
        if (typeof params[1] === 'string') {
          this.initWithFile(params[0].toString(), params[1].toString());
        } else {
          this.initWithAdapter(params[0].toString(), params[1]);
        }
      } else {
        if (typeof params[1] === 'string') {
          throw new Error('Invalid parameters for enforcer.');
        } else {
          this.initWithModelAndAdapter(params[0], params[1]);
        }
      }
    } else if (params.length - parsedParamLen === 1) {
      if (typeof params[0] === 'string') {
        this.initWithFile(params[0].toString, '');
      } else {
        this.initWithModelAndAdapter(params[0], new FileAdapter(''));
      }
    } else if (params.length === parsedParamLen) {
      this.initWithFile('', '');
    } else {
      throw new Error('Invalid parameters for enforcer.');
    }
  }

  // initWithFile initializes an enforcer with a model file and a policy file.
  public initWithFile(modelPath: string, policyPath: string): void {
    const a = new FileAdapter(policyPath);
    this.initWithAdapter(modelPath, a);
  }

  // initWithAdapter initializes an enforcer with a database adapter.
  public initWithAdapter(modelPath: string, adapter: Adapter): void {
    const m = Enforcer.newModel(modelPath, '');
    this.initWithModelAndAdapter(m, adapter);

    this.modelPath = modelPath;
  }

  // initWithModelAndAdapter initializes an enforcer with a model and a database adapter.
  public initWithModelAndAdapter(m: Model, adapter: Adapter): void {
    this.adapter = adapter;
    this.watcher = null;

    this.model = m;
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();

    this.initialize();

    if (!this.adapter) {
      // error intentionally ignored
      this.loadPolicy();
    }
  }

  private initialize(): void {
    this.enabled = true;
    this.autoSave = true;
    this.autoBuildRoleLinks = true;
  }

  public static newModel(...text: string[]): Model {
    const m = new Model();

    if (text.length === 2) {
      if (text[0] !== '') {
        m.loadModel(text[0]);
      }
    } else if (text.length === 1) {
      m.loadModelFromText(text[0]);
    } else if (text.length !== 0) {
      throw new Error('Invalid parameters for model.');
    }

    return m;
  }

  // loadModel reloads the model from the model CONF file.
  // Because the policy is attached to a model,
  // so the policy is invalidated and needs to be reloaded by calling LoadPolicy().
  public loadModel(): void {
    this.model = Enforcer.newModel();
    this.model.loadModel(this.modelPath);
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();
  }

  // getModel gets the current model.
  public getModel(): Model {
    return this.model;
  }

  // setModel sets the current model.
  public setModel(m: Model): void {
    this.model = m;
    this.fm = FunctionMap.loadFunctionMap();
  }

  // getAdapter gets the current adapter.
  public getAdapter(): Adapter {
    return this.adapter;
  }

  // setAdapter sets the current adapter.
  public setAdapter(adapter: Adapter): void {
    this.adapter = adapter;
  }

  // setWatcher sets the current watcher.
  public setWatcher(watcher: Watcher): void {
    this.watcher = watcher;
    watcher.setUpdateCallback(() => this.loadPolicy());
  }

  // setRoleManager sets the current role manager.
  public setRoleManager(rm: RoleManager): void {
    this.rm = rm;
  }

  // setEffector sets the current effector.
  public setEffector(eft: Effector): void {
    this.eft = eft;
  }

  // clearPolicy clears all policy.
  public clearPolicy(): void {
    this.model.clearPolicy();
  }

  // loadPolicy reloads the policy from file/database.
  public loadPolicy(): boolean {
    this.model.clearPolicy();
    if (!this.adapter.loadPolicy(this.model)) {
      return false;
    }

    this.model.printPolicy();
    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return true;
  }

  // loadFilteredPolicy reloads a filtered policy from file/database.
  public loadFilteredPolicy(filter: Filter): boolean {
    this.model.clearPolicy();

    if ((this.adapter as FilteredAdapter).isFiltered) {
      (this.adapter as FilteredAdapter).loadFilteredPolicy(this.model, filter);
    } else {
      throw new Error('filtered policies are not supported by this adapter');
    }

    this.model.printPolicy();
    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return true;
  }

  // isFiltered returns true if the loaded policy has been filtered.
  public isFiltered(): boolean {
    if ((this.adapter as FilteredAdapter).isFiltered) {
      return (this.adapter as FilteredAdapter).isFiltered();
    }
    return false;
  }

  // savePolicy saves the current policy (usually after changed with Casbin API) back to file/databasthis.
  public savePolicy(): boolean {
    if (this.isFiltered()) {
      throw new Error('cannot save a filtered policy');
    }
    if (!this.adapter.savePolicy(this.model)) {
      return false;
    }
    if (this.watcher) {
      return this.watcher.update();
    }
    return true;
  }

  // enableEnforce changes the enforcing state of Casbin, when Casbin is disabled,
  // all access will be allowed by the Enforce() function.
  public enableEnforce(enable: boolean): void {
    this.enabled = enable;
  }

  // enableLog changes whether to print Casbin log to the standard output.
  public static enableLog(enable: boolean): void {
    setEnableLog(enable);
  }

  // enableAutoSave controls whether to save a policy rule automatically to
  // the adapter when it is added or removed.
  public enableAutoSave(autoSave: boolean): void {
    this.autoSave = autoSave;
  }

  // enableAutoBuildRoleLinks controls whether to rebuild the
  // role inheritance relations when a role is added or deleted.
  public enableAutoBuildRoleLinks(autoBuildRoleLinks: boolean): void {
    this.autoBuildRoleLinks = autoBuildRoleLinks;
  }

  // buildRoleLinks manually rebuild the role inheritance relations.
  public buildRoleLinks() {
    // error intentionally ignored
    this.rm.clear();
    this.model.buildRoleLinks(this.rm);
  }

  // Enforce decides whether a "subject" can access a "object" with the
  // operation "action", input parameters are usually: (sub, obj, act).
  public enforce(...rvals: any[]): boolean {
    if (!this.enabled) {
      return true;
    }

    const functions = new Map<string, any>();
    this.fm.forEach((value, key) => {
      functions.set(key, value);
    });

    const astMap = this.model.model.get('g');
    if (astMap) {
      astMap.forEach((value, key) => {
        const rm = value.rm;
        functions.set(key, generateGFunction(rm));
      });
    }

    // console.log('this.model.model: ', this.model.model);
    const astItem = [...(this.model.model.get('m') || [])].find(
      ([key]) => key === 'm'
    );
    if (!astItem) {
      throw new Error('Ast is undefined');
    }
    const [, ast] = astItem;

    const functionsForJs: { [key: string]: any } = {};
    functions.forEach((value, key) => {
      functionsForJs[key] = value;
    });

    const expression = Valuate.parse(ast.value);

    let result: boolean = false;

    let policyEffects: number[];
    let matcherResults: number[];
    const pRootValue = this.model.model.get('p');
    const { policy }: any = pRootValue && pRootValue.get('p');

    if (policy.length > 0) {
      policyEffects = new Array(policy.length);
      matcherResults = new Array(policy.length);

      for (let i = 0; i < policy.length; i++) {
        const pvals = policy[i];
        logPrint('Policy Rule: ', pvals);

        const rRootValue = this.model.model.get('r');
        const rValue = rRootValue && rRootValue.get('r');
        let tokens = rValue && rValue.tokens;
        if (!tokens) {
          throw new Error('tokens is undefined');
        }
        tokens.forEach((n, index) => {
          functionsForJs[n] = rvals[index];
        });

        const pValue = pRootValue && pRootValue.get('p');
        tokens = pValue && pValue.tokens;
        if (!tokens) {
          throw new Error('tokens is undefined');
        }
        tokens.forEach((n, index) => {
          functionsForJs[n] = rvals[index];
        });

        result = new Valuate().evaluate(expression, functionsForJs);
        logPrint(`Result: ${result}`);

        if (typeof result === 'boolean') {
          if (!result) {
            policyEffects[i] = Effect.Indeterminate;
          }
        } else if (typeof result === 'number') {
          if (result === 0) {
            policyEffects[i] = Effect.Indeterminate;
          } else {
            matcherResults[i] = result;
          }
        } else {
          throw new Error('matcher result should be bool, int or float');
        }

        if (_.has(functionsForJs, 'p_eft')) {
          const eft = _.get(functionsForJs, 'p_eft');
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
        const eRootMap = this.model.model.get('e');
        const eValue = eRootMap && eRootMap.get('e');
        if (eValue) {
          if (_.indexOf(['priority(p_eft)', 'deny'], eValue.value) > -1) {
            break;
          }
        }
      }
    } else {
      policyEffects = new Array(1);
      matcherResults = new Array(1);

      const rRootValue = this.model.model.get('r');
      const rValue = rRootValue && rRootValue.get('r');
      let tokens = rValue && rValue.tokens;
      if (!tokens) {
        throw new Error('tokens is undefined');
      }
      tokens.forEach((n, i) => {
        functionsForJs[n] = rvals[i];
      });

      const pValue = pRootValue && pRootValue.get('p');
      tokens = pValue && pValue.tokens;
      if (!tokens) {
        throw new Error('tokens is undefined');
      }
      tokens.forEach((n, i) => {
        functionsForJs[n] = rvals[i];
      });
      result = new Valuate().evaluate(expression, functionsForJs);
      logPrint(`Result: ${result}`);

      if (result) {
        policyEffects[0] = Effect.Allow;
      } else {
        policyEffects[0] = Effect.Indeterminate;
      }
    }

    logPrint(`Rule Results: ${policyEffects}`);

    const eRootMapValue = this.model.model.get('e');
    const eMap = eRootMapValue && eRootMapValue.get('e');
    if (eMap) {
      result = this.eft.mergeEffects(eMap.value, policyEffects, matcherResults);
    }

    // only generate the request --> result string if the message
    // is going to be logged.
    if (getEnableLog()) {
      let reqStr = 'Request: ';
      for (let i = 0; i < rvals.length; i++) {
        if (i + 1 !== rvals.length) {
          reqStr += `${rvals[i]}, `;
        } else {
          reqStr += rvals[i];
        }
      }
      reqStr += ` ---> ${result}`;
      logPrint(reqStr);
    }

    return result;
  }
}
