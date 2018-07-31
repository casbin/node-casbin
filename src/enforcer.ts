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

import { generateGFunction, setEnableLog } from './util';
import { FunctionMap, Model } from './model';
import { DefaultEffector, Effect, Effector } from './effect';
import {
  Adapter,
  DefaultFilteredAdapter,
  FileAdapter,
  Filter,
  FilteredAdapter,
  Watcher
} from './persist';
import { DefaultRoleManager, RoleManager } from './rbac';
import { Parser } from 'expr-eval';

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

  /**
   * constructor is the constructor for Enforcer.
   */
  constructor() {
    this.modelPath = '';
    this.model = new Model();
    this.fm = new Map<string, any>();
    this.eft = new DefaultEffector();

    this.adapter = new DefaultFilteredAdapter('');
    this.rm = new DefaultRoleManager(0);

    this.enabled = false;
    this.autoSave = false;
    this.autoBuildRoleLinks = false;
  }

  // NewEnforcer creates an enforcer via file or DB.
  // File:
  // e := casbin.NewEnforcer("path/to/basic_model.conf", "path/to/basic_policy.csv")
  // MySQL DB:
  // a := mysqladapter.NewDBAdapter("mysql", "mysql_username:mysql_password@tcp(127.0.0.1:3306)/")
  // e := casbin.NewEnforcer("path/to/basic_model.conf", a)
  public static newEnforcer(...params: any[]): Enforcer {
    const e = new Enforcer();
    e.rm = new DefaultRoleManager(10);
    e.eft = new DefaultEffector();

    let parsedParamLen = 0;
    if (params.length >= 1) {
      const enableLog = params[params.length - 1];
      setEnableLog(enableLog);
      parsedParamLen++;
    }

    if (params.length - parsedParamLen === 2) {
      if (typeof params[0] === 'string') {
        if (typeof params[1] === 'string') {
          e.initWithFile(params[0].toString(), params[1].toString());
        } else {
          e.initWithAdapter(params[0].toString(), params[1]);
        }
      } else {
        if (typeof params[1] === 'string') {
          throw new Error('Invalid parameters for enforcer.');
        } else {
          e.initWithModelAndAdapter(params[0], params[1]);
        }
      }
    } else if (params.length - parsedParamLen === 1) {
      if (typeof params[0] === 'string') {
        e.initWithFile(params[0].toString, '');
      } else {
        e.initWithModelAndAdapter(params[0], new FileAdapter(''));
      }
    } else if (params.length === parsedParamLen) {
      e.initWithFile('', '');
    } else {
      throw new Error('Invalid parameters for enforcer.');
    }

    return e;
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
    // this.watcher = new Watcher();

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
    const gList = this.model.model.get('g');
    if (gList) {
      gList.forEach((value, key) => {
        const rm = value.rm;
        // TODO code review
        functions.set(key, generateGFunction(rm));
      });
    }

    const mValue = this.model.model.get('m');
    const nextMValue = mValue && mValue.get('m');
    const expString = nextMValue && nextMValue.value;
    if (!expString) { return false; }
    const funcs: { [key: string]: any } = {};
    functions.forEach((value, key) => {
      funcs[key] = value;
    });
    const expression = Parser.evaluate(expString, funcs);

    const policyEffects: Effect[] = [];
    const matcherResults: number[] = [];
    const pValue = this.model.model.get('p');
    const { policy }: any = pValue && pValue.get('p');
    if (policy && policy.length !== 0) {
      policy.forEach((n: string) => {
        const pvals = n;
        const parameters = new Map();
      });
    }
    // TODO please code
    return false;
    //   for i, pvals := range this.model['p']['p'].Policy {
    //     // util.LogPrint('Policy Rule: ', pvals)

    //     parameters := make(map[string]interface{}, 8)
    //     for j, token := range this.model['r']['r'].Tokens {
    //       parameters[token] = rvals[j]
    //     }
    //     for j, token := range this.model['p']['p'].Tokens {
    //       parameters[token] = pvals[j]
    //     }

    //     result, err := expression.Evaluate(parameters)
    //     // util.LogPrint('Result: ', result)

    //     if err != nil {
    //       policyEffects[i] = effect.Indeterminate
    //       panic(err)
    //     }

    //     switch result.(type) {
    //     case bool:
    //       if !result.(bool) {
    //         policyEffects[i] = effect.Indeterminate
    //         continue
    //       }
    //     case float64:
    //       if result.(float64) == 0 {
    //         policyEffects[i] = effect.Indeterminate
    //         continue
    //       } else {
    //         matcherResults[i] = result.(float64)
    //       }
    //       default:
    //         panic(errors.New('matcher result should be bool, int or float'))
    //     }

    //     if eft, ok := parameters['p_eft']; ok {
    //       if eft == 'allow' {
    //         policyEffects[i] = effect.Allow
    //       } else if eft == 'deny' {
    //         policyEffects[i] = effect.Deny
    //       } else {
    //         policyEffects[i] = effect.Indeterminate
    //       }
    //     } else {
    //       policyEffects[i] = effect.Allow
    //     }

    //     if this.model['e']['e'].Value == 'priority(p_eft) || deny' {
    //       break
    //     }

    //   }
    // } else {
    //   policyEffects = make([]effect.Effect, 1)
    //   matcherResults = make([]float64, 1)

    //   parameters := make(map[string]interface{}, 8)
    //   for j, token := range this.model['r']['r'].Tokens {
    //     parameters[token] = rvals[j]
    //   }
    //   for _, token := range this.model['p']['p'].Tokens {
    //     parameters[token] = ''
    //   }

    //   result, err := expression.Evaluate(parameters)
    //   // util.LogPrint("Result: ", result)

    //   if err != nil {
    //     policyEffects[0] = effect.Indeterminate
    //     panic(err)
    //   }

    //   if result.(bool) {
    //     policyEffects[0] = effect.Allow
    //   } else {
    //     policyEffects[0] = effect.Indeterminate
    //   }
    // }

    // // util.LogPrint("Rule Results: ", policyEffects)

    // result, err := this.eft.MergeEffects(this.model['e']['e'].Value, policyEffects, matcherResults)
    // if err != nil {
    //   panic(err)
    // }

    // // only generate the request --> result string if the message
    // // is going to be logged.
    // if util.EnableLog {
    //   reqStr := 'Request: '
    //   for i, rval := range rvals {
    //     if i != len(rvals)-1 {
    //       reqStr += fmt.Sprintf('%v, ', rval)
    //     } else {
    //       reqStr += fmt.Sprintf('%v', rval)
    //     }
    //   }
    //   reqStr += fmt.Sprintf(' ---> %t', result)
    //   util.LogPrint(reqStr)
    // }

    // return result
  }
}

function getValueFromMap(map: Map<any, any>, ...param: any[]): any {
  let result = null;
  param.forEach(n => {
    if (!map) { return; }
    result = map.get(n);
    map = result;
  });
  return result;
}
