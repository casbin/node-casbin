// Copyright 2018 The Casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { generateGFunction, getEnableLog, logPrint, setEnableLog } from './util';
import { FunctionMap, Model } from './model';
import { DefaultEffector, Effect, Effector } from './effect';
import { compile } from 'expression-eval';

import * as _ from 'lodash';
import { Adapter, FileAdapter, Filter, FilteredAdapter, Watcher } from './persist';
import { DefaultRoleManager, RoleManager } from './rbac';

const NotImplemented = 'not implemented';

// Enforcer is the main interface for authorization enforcement and policy management.
export class Enforcer {
  public model: Model;
  private modelPath: string;
  private fm: FunctionMap;
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
  // const e = new Enforcer('path/to/basic_model.conf', 'path/to/basic_policy.csv');
  // MySQL DB:
  // const a = new MySQLAdapter('mysql', 'mysql_username:mysql_password@tcp(127.0.0.1:3306)/');
  // const e = new Enforcer('path/to/basic_model.conf', a);
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
        this.initWithFile(params[0], '');
      } else {
        this.initWithModelAndAdapter(params[0], null);
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
  public initWithModelAndAdapter(m: Model, adapter: Adapter | null): void {
    if (adapter) {
      this.adapter = adapter;
    }
    this.watcher = null;

    this.model = m;
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();

    this.initialize();

    if (this.adapter) {
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

  // Enforce decides whether a 'subject' can access a 'object' with the
  // operation 'action', input parameters are usually: (sub, obj, act).
  public enforce(...rvals: any[]): boolean {
    if (!this.enabled) {
      return true;
    }

    const functions: { [key: string]: any } = {};
    this.fm.getFunctions().forEach((value: any, key: string) => {
      functions[key] = value;
    });

    const astMap = this.model.model.get('g');
    if (astMap) {
      astMap.forEach((value, key) => {
        const rm = value.rm;
        functions[key] = generateGFunction(rm);
      });
    }

    // @ts-ignore
    const expString = this.model.model.get('m').get('m').value;
    if (!expString) {
      throw new Error('model is undefined');
    }

    const expression = compile(expString);

    let policyEffects: Effect[];
    let matcherResults: number[];
    // @ts-ignore
    const policyLen = this.model.model.get('p').get('p').policy.length;
    if (policyLen !== 0) {
      policyEffects = new Array(policyLen);
      matcherResults = new Array(policyLen);

      for (let i = 0; i < policyLen; i++) {
        // @ts-ignore
        const pvals = this.model.model.get('p').get('p').policy[i];

        // logPrint('Policy Rule: ', pvals);

        const parameters: { [key: string]: any } = {};
        // @ts-ignore
        this.model.model.get('r').get('r').tokens.forEach((token, j) => {
          parameters[token] = rvals[j].trim();
        });
        // @ts-ignore
        this.model.model.get('p').get('p').tokens.forEach((token, j) => {
          parameters[token] = pvals[j].trim();
        });

        const result = expression({ ...parameters, ...functions });
        // logPrint(`Result: ${result}`);

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

        if (_.has(parameters, 'p_eft')) {
          const eft = _.get(parameters, 'p_eft');
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

        // @ts-ignore
        if (this.model.model.get('e').get('e').value === 'priority(p_eft) || deny') {
          break;
        }
      }
    } else {
      policyEffects = new Array(1);
      matcherResults = new Array(1);

      const parameters: { [key: string]: any } = {};
      // @ts-ignore
      this.model.model.get('r').get('r').tokens.forEach((token, j) => {
        parameters[token] = rvals[j];
      });
      // @ts-ignore
      this.model.model.get('p').get('p').tokens.forEach((token) => {
        parameters[token] = '';
      });

      const result = expression({ ...parameters, ...functions });
      // logPrint(`Result: ${result}`);

      if (result) {
        policyEffects[0] = Effect.Allow;
      } else {
        policyEffects[0] = Effect.Indeterminate;
      }
    }

    // logPrint(`Rule Results: ${policyEffects}`);

    // @ts-ignore
    const res = this.eft.mergeEffects(this.model.model.get('e').get('e').value, policyEffects, matcherResults);

    // only generate the request --> result string if the message
    // is going to be logged.
    if (getEnableLog()) {
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

  // **************Internal API*************
  // addPolicy adds a rule to the current policy.
  public addPolicy(sec: string | any[], key?: string, rule?: string[]): boolean {
    if (typeof sec === 'string' && key && rule) {
      const ruleAdded = this.model.addPolicy(sec, key, rule);
      if (!ruleAdded) {
        return ruleAdded;
      }

      if (this.adapter !== null && this.autoSave) {
        this.adapter.addPolicy(sec, key, rule);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleAdded;
    } else if (sec instanceof Array) {
      return this.addNamedPolicy('p', sec);
    } else {
      return false;
    }
  }

  // removePolicy removes a rule from the current policy.
  public removePolicy(sec: string | any[], key?: string, rule?: string[]): boolean {
    if (typeof sec === 'string' && key && rule) {
      const ruleRemoved = this.model.removePolicy(sec, key, rule);
      if (!ruleRemoved) {
        return ruleRemoved;
      }

      if (this.adapter !== null && this.autoSave) {
        this.adapter.removePolicy(sec, key, rule);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleRemoved;
    } else if (sec instanceof Array) {
      return this.removeNamedPolicy('p', sec);
    } else {
      return false;
    }
  }

  // removeFilteredPolicy removes rules based on field filters from the current policy.
  public removeFilteredPolicy(sec: string | number, key: string | string[], fieldIndex?: number, fieldValues?: string[]): boolean {
    if (typeof sec === 'string' && typeof key === 'string' && fieldIndex && fieldValues instanceof Array) {
      const ruleRemoved = this.model.removeFilteredPolicy(sec, key, fieldIndex, ...fieldValues);
      if (!ruleRemoved) {
        return ruleRemoved;
      }

      if (this.adapter !== null && this.autoSave) {
        this.adapter.removeFilteredPolicy(sec, key, fieldIndex, ...fieldValues);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleRemoved;
    } else if (typeof sec === 'number' && key instanceof Array) {
      return this.removeFilteredNamedPolicy('p', sec, key);
    } else {
      return false;
    }
  }

  // **************Management API*************
  // getAllSubjects gets the list of subjects that show up in the current policy.
  public getAllSubjects(): string[] {
    return this.getAllNamedSubjects('p');
  }

  // getAllNamedSubjects gets the list of subjects that show up in the current named policy.
  public getAllNamedSubjects(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 0);
  }

  // getAllObjects gets the list of objects that show up in the current policy.
  public getAllObjects(): string[] {
    return this.getAllNamedObjects('p');
  }

  // getAllNamedObjects gets the list of objects that show up in the current named policy.
  public getAllNamedObjects(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 1);
  }

  // getAllActions gets the list of actions that show up in the current policy.
  public getAllActions(): string[] {
    return this.getAllNamedActions('p');
  }

  // getAllNamedActions gets the list of actions that show up in the current named policy.
  public getAllNamedActions(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 2);
  }

  // getAllRoles gets the list of roles that show up in the current policy.
  public getAllRoles(): string[] {
    return this.getAllNamedRoles('g');
  }

  // getAllNamedRoles gets the list of roles that show up in the current named policy.
  public getAllNamedRoles(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('g', ptype, 1);
  }

  // getPolicy gets all the authorization rules in the policy.
  public getPolicy(): [string[]] {
    return this.getNamedPolicy('p');
  }

  // getFilteredPolicy gets all the authorization rules in the policy, field filters can be specified.
  public getFilteredPolicy(fieldIndex: number, ...fieldValues: string[]): [string[]] {
    return this.getFilteredNamedPolicy('p', fieldIndex, ...fieldValues);
  }

  // getNamedPolicy gets all the authorization rules in the named policy.
  public getNamedPolicy(ptype: string): [string[]] {
    return this.model.getPolicy('p', ptype);
  }

  // getFilteredNamedPolicy gets all the authorization rules in the named policy, field filters can be specified.
  public getFilteredNamedPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): [string[]] {
    return this.model.getFilteredPolicy('p', ptype, fieldIndex, ...fieldValues);
  }

  // getGroupingPolicy gets all the role inheritance rules in the policy.
  public getGroupingPolicy(): [string[]] {
    return this.getNamedGroupingPolicy('g');
  }

  // getFilteredGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
  public getFilteredGroupingPolicy(fieldIndex: number, ...fieldValues: string[]): [string[]] {
    return this.getFilteredNamedGroupingPolicy('g', fieldIndex, ...fieldValues);
  }

  // getNamedGroupingPolicy gets all the role inheritance rules in the policy.
  public getNamedGroupingPolicy(ptype: string): [string[]] {
    return this.model.getPolicy('g', ptype);
  }

  // getFilteredNamedGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
  public getFilteredNamedGroupingPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): [string[]] {
    return this.model.getFilteredPolicy('g', ptype, fieldIndex, ...fieldValues);
  }

  // hasPolicy determines whether an authorization rule exists.
  public hasPolicy(...params: any[]): boolean {
    return this.hasNamedPolicy('p', ...params);
  }

  // hasNamedPolicy determines whether a named authorization rule exists.
  public hasNamedPolicy(ptype: string, ...params: any[]): boolean {
    if (params.length === 1 && params[0] instanceof Array) {
      return this.model.hasPolicy('p', ptype, params[0]);
    }

    return this.model.hasPolicy('p', ptype, params);
  }

  // addNamedPolicy adds an authorization rule to the current named policy.
  // If the rule already exists, the function returns false and the rule will not be added.
  // Otherwise the function returns true by adding the new rule.
  public addNamedPolicy(ptype: string, params: any[]): boolean {
    let ruleAdded = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleAdded = this.addPolicy('p', ptype, params[0]);
    } else {
      ruleAdded = this.addPolicy('p', ptype, params);
    }

    return ruleAdded;
  }

  // removeNamedPolicy removes an authorization rule from the current named policy.
  public removeNamedPolicy(ptype: string, params: any[]): boolean {
    let ruleRemoved = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleRemoved = this.removePolicy('p', ptype, params[0]);
    } else {
      ruleRemoved = this.removePolicy('p', ptype, params);
    }

    return ruleRemoved;
  }

  // removeFilteredNamedPolicy removes an authorization rule from the current named policy, field filters can be specified.
  public removeFilteredNamedPolicy(ptype: string, fieldIndex: number, fieldValues: string[]): boolean {
    return this.removeFilteredPolicy('p', ptype, fieldIndex, fieldValues);
  }

  // hasGroupingPolicy determines whether a role inheritance rule exists.
  public hasGroupingPolicy(...params: any[]): boolean {
    return this.hasNamedGroupingPolicy('g', params);
  }

  // hasNamedGroupingPolicy determines whether a named role inheritance rule exists.
  public hasNamedGroupingPolicy(ptype: string, ...params: any[]): boolean {
    if (params.length === 1 && params[0] instanceof Array) {
      return this.model.hasPolicy('g', ptype, params[0]);
    }

    return this.model.hasPolicy('g', ptype, params);
  }

  // addGroupingPolicy adds a role inheritance rule to the current policy.
  // If the rule already exists, the function returns false and the rule will not be added.
  // Otherwise the function returns true by adding the new rule.
  public addGroupingPolicy(...params: any[]): boolean {
    return this.addNamedGroupingPolicy('g', params);
  }

  // addNamedGroupingPolicy adds a named role inheritance rule to the current policy.
  // If the rule already exists, the function returns false and the rule will not be added.
  // Otherwise the function returns true by adding the new rule.
  public addNamedGroupingPolicy(ptype: string, ...params: any[]): boolean {
    let ruleadded = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleadded = this.addPolicy('g', ptype, params[0]);
    } else {
      ruleadded = this.addPolicy('g', ptype, params);
    }

    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }

    return ruleadded;
  }

  // removeGroupingPolicy removes a role inheritance rule from the current policy.
  public removeGroupingPolicy(...params: any[]): boolean {
    return this.removeNamedGroupingPolicy('g', params);
  }

  // removeFilteredGroupingPolicy removes a role inheritance rule from the current policy, field filters can be specified.
  public removeFilteredGroupingPolicy(fieldIndex: number, ...fieldValues: string[]): boolean {
    return this.removeFilteredNamedGroupingPolicy('g', fieldIndex, ...fieldValues);
  }

  // removeNamedGroupingPolicy removes a role inheritance rule from the current named policy.
  public removeNamedGroupingPolicy(ptype: string, ...params: any[]): boolean {
    let ruleRemoved = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleRemoved = this.removePolicy('g', ptype, params[0]);
    } else {
      ruleRemoved = this.removePolicy('g', ptype, params);
    }

    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return ruleRemoved;
  }

  // removeFilteredNamedGroupingPolicy removes a role inheritance rule from the current named policy, field filters can be specified.
  public removeFilteredNamedGroupingPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): boolean {
    const ruleRemoved = this.removeFilteredPolicy('g', ptype, fieldIndex, fieldValues);
    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return ruleRemoved;
  }

  // addFunction adds a customized function.
  public addFunction(name: string, func: any): void {
    this.fm.addFunction(name, func);
  }

}
