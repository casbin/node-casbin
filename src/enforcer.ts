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

import { generateGFunction, getEnableLog, logPrint, setEnableLog } from './util';
import { FunctionMap, Model } from './model';
import { DefaultEffector, Effect, Effector } from './effect';
import { compile } from 'expression-eval';

import * as _ from 'lodash';
import { Adapter, FileAdapter, Filter, FilteredAdapter, Watcher } from './persist';
import { DefaultRoleManager, RoleManager } from './rbac';

const NotImplemented = 'not implemented';

/**
 * Enforcer is the main interface for authorization enforcement and policy management.
 */
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

  /**
   * constructor is the constructor for Enforcer.
   * It creates an enforcer via file or DB.
   *
   * File:
   * ```js
   * const e = new Enforcer('path/to/basic_model.conf', 'path/to/basic_policy.csv');
   * ```
   *
   * MySQL DB:
   * ```js
   * const a = new MySQLAdapter('mysql', 'mysql_username:mysql_password@tcp(127.0.0.1:3306)/');
   * const e = new Enforcer('path/to/basic_model.conf', a);
   * ```
   *
   * @param params
   */
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

  /**
   * initWithFile initializes an enforcer with a model file and a policy file.
   * @param modelPath model file path
   * @param policyPath policy file path
   */
  public initWithFile(modelPath: string, policyPath: string): void {
    const a = new FileAdapter(policyPath);
    this.initWithAdapter(modelPath, a);
  }

  /**
   * initWithAdapter initializes an enforcer with a database adapter.
   * @param modelPath model file path
   * @param adapter current adapter instance
   */
  public initWithAdapter(modelPath: string, adapter: Adapter): void {
    const m = Enforcer.newModel(modelPath, '');
    this.initWithModelAndAdapter(m, adapter);

    this.modelPath = modelPath;
  }

  /**
   * initWithModelAndAdapter initializes an enforcer with a model and a database adapter.
   * @param m model instance
   * @param adapter current adapter instance
   */
  public initWithModelAndAdapter(m: Model, adapter: Adapter | null): void {
    if (adapter) {
      this.adapter = adapter;
    }
    this.watcher = null;

    this.model = m;
    this.model.printModel();
    this.fm = FunctionMap.loadFunctionMap();
  }

  public async initialize(): Promise<void> {
    this.enabled = true;
    this.autoSave = true;
    this.autoBuildRoleLinks = true;
    if (this.adapter) {
      await this.loadPolicy();
    }
  }

  /**
   * newModel creates a model.
   */
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

  /**
   * loadModel reloads the model from the model CONF file.
   * Because the policy is attached to a model,
   * so the policy is invalidated and needs to be reloaded by calling LoadPolicy().
   */
  public loadModel(): void {
    this.model = Enforcer.newModel();
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
      this.buildRoleLinks();
    }
  }

  /**
   * loadFilteredPolicy reloads a filtered policy from file/database.
   *
   * @param filter the filter used to specify which type of policy should be loaded.
   */
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
      throw new Error('cannot save a filtered policy');
    }
    const flag = await this.adapter.savePolicy(this.model);
    if (!flag) {
      return false;
    }
    if (this.watcher) {
      return this.watcher.update();
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
  public static enableLog(enable: boolean): void {
    setEnableLog(enable);
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
   * buildRoleLinks manually rebuild the
   * role inheritance relations.
   */
  public buildRoleLinks() {
    // error intentionally ignored
    this.rm.clear();
    this.model.buildRoleLinks(this.rm);
  }

  /**
   * enforce decides whether a "subject" can access a "object" with
   * the operation "action", input parameters are usually: (sub, obj, act).
   *
   * @param rvals the request needs to be mediated, usually an array
   *              of strings, can be class instances if ABAC is used.
   * @return whether to allow the request.
   */
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
  /**
   * addPolicy adds a rule to the current policy.
   */
  public async addPolicy(sec: string | any[], key?: string, rule?: string[]): Promise<boolean> {
    if (typeof sec === 'string' && key && rule) {
      const ruleAdded = this.model.addPolicy(sec, key, rule);
      if (!ruleAdded) {
        return ruleAdded;
      }

      if (this.adapter !== null && this.autoSave) {
        await this.adapter.addPolicy(sec, key, rule);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleAdded;
    } else if (sec instanceof Array) {
      return await this.addNamedPolicy('p', sec);
    } else {
      return false;
    }
  }

  /**
   * removePolicy removes a rule from the current policy.
   */
  public async removePolicy(sec: string | any[], key?: string, rule?: string[]): Promise<boolean> {
    if (typeof sec === 'string' && key && rule) {
      const ruleRemoved = this.model.removePolicy(sec, key, rule);
      if (!ruleRemoved) {
        return ruleRemoved;
      }

      if (this.adapter !== null && this.autoSave) {
        await this.adapter.removePolicy(sec, key, rule);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleRemoved;
    } else if (sec instanceof Array) {
      return await this.removeNamedPolicy('p', sec);
    } else {
      return false;
    }
  }

  /**
   * removeFilteredPolicy removes rules based on field filters from the current policy.
   */
  public async removeFilteredPolicy(sec: string | number, key: string | string[], fieldIndex?: number, fieldValues?: string[]): Promise<boolean> {
    if (typeof sec === 'string' && typeof key === 'string' && fieldIndex && fieldValues instanceof Array) {
      const ruleRemoved = this.model.removeFilteredPolicy(sec, key, fieldIndex, ...fieldValues);
      if (!ruleRemoved) {
        return ruleRemoved;
      }

      if (this.adapter !== null && this.autoSave) {
        await this.adapter.removeFilteredPolicy(sec, key, fieldIndex, ...fieldValues);
        if (this.watcher !== null) {
          // error intentionally ignored
          this.watcher.update();
        }
      }

      return ruleRemoved;
    } else if (typeof sec === 'number' && key instanceof Array) {
      return await this.removeFilteredNamedPolicy('p', sec, key);
    } else {
      return false;
    }
  }

  // **************Management API*************
  /**
   * getAllSubjects gets the list of subjects that show up in the current policy.
   *
   * @return all the subjects in "p" policy rules. It actually collects the
   *         0-index elements of "p" policy rules. So make sure your subject
   *         is the 0-index element, like (sub, obj, act). Duplicates are removed.
   */
  public getAllSubjects(): string[] {
    return this.getAllNamedSubjects('p');
  }

  /**
   * getAllNamedSubjects gets the list of subjects that show up in the currentnamed policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make sure
   *         your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllNamedSubjects(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 0);
  }

  /**
   * getAllObjects gets the list of objects that show up in the current policy.
   *
   * @return all the objects in "p" policy rules. It actually collects the
   *         1-index elements of "p" policy rules. So make sure your object
   *         is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllObjects(): string[] {
    return this.getAllNamedObjects('p');
  }

  /**
   * getAllNamedObjects gets the list of objects that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the objects in policy rules of the ptype type. It actually
   *         collects the 1-index elements of the policy rules. So make sure
   *         your object is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllNamedObjects(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 1);
  }

  /**
   * getAllActions gets the list of actions that show up in the current policy.
   *
   * @return all the actions in "p" policy rules. It actually collects
   *         the 2-index elements of "p" policy rules. So make sure your action
   *         is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllActions(): string[] {
    return this.getAllNamedActions('p');
  }

  /**
   * GetAllNamedActions gets the list of actions that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the actions in policy rules of the ptype type. It actually
   *         collects the 2-index elements of the policy rules. So make sure
   *         your action is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllNamedActions(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('p', ptype, 2);
  }

  /**
   * getAllRoles gets the list of roles that show up in the current policy.
   *
   * @return all the roles in "g" policy rules. It actually collects
   *         the 1-index elements of "g" policy rules. So make sure your
   *         role is the 1-index element, like (sub, role).
   *         Duplicates are removed.
   */
  public getAllRoles(): string[] {
    return this.getAllNamedRoles('g');
  }

  /**
   * getAllNamedRoles gets the list of roles that show up in the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make
   *         sure your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  public getAllNamedRoles(ptype: string): string[] {
    return this.model.getValuesForFieldInPolicy('g', ptype, 1);
  }

  /**
   * getPolicy gets all the authorization rules in the policy.
   *
   * @return all the "p" policy rules.
   */
  public getPolicy(): string[][] {
    return this.getNamedPolicy('p');
  }

  /**
   * getFilteredPolicy gets all the authorization rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules.
   */
  public getFilteredPolicy(fieldIndex: number, ...fieldValues: string[]): string[][] {
    return this.getFilteredNamedPolicy('p', fieldIndex, ...fieldValues);
  }

  /**
   * getNamedPolicy gets all the authorization rules in the named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return the "p" policy rules of the specified ptype.
   */
  public getNamedPolicy(ptype: string): string[][] {
    return this.model.getPolicy('p', ptype);
  }

  /**
   * getFilteredNamedPolicy gets all the authorization rules in the named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules of the specified ptype.
   */
  public getFilteredNamedPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): string[][] {
    return this.model.getFilteredPolicy('p', ptype, fieldIndex, ...fieldValues);
  }

  /**
   * getGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @return all the "g" policy rules.
   */
  public getGroupingPolicy(): string[][] {
    return this.getNamedGroupingPolicy('g');
  }

  /**
   * getFilteredGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value "" means not to match this field.
   * @return the filtered "g" policy rules.
   */
  public getFilteredGroupingPolicy(fieldIndex: number, ...fieldValues: string[]): string[][] {
    return this.getFilteredNamedGroupingPolicy('g', fieldIndex, ...fieldValues);
  }

  /**
   * getNamedGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return the "g" policy rules of the specified ptype.
   */
  public getNamedGroupingPolicy(ptype: string): string[][] {
    return this.model.getPolicy('g', ptype);
  }

  /**
   * getFilteredNamedGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "g" policy rules of the specified ptype.
   */
  public getFilteredNamedGroupingPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): string[][] {
    return this.model.getFilteredPolicy('g', ptype, fieldIndex, ...fieldValues);
  }

  /**
   * hasPolicy determines whether an authorization rule exists.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return whether the rule exists.
   */
  public hasPolicy(...params: any[]): boolean {
    return this.hasNamedPolicy('p', ...params);
  }

  /**
   * hasNamedPolicy determines whether a named authorization rule exists.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return whether the rule exists.
   */
  public hasNamedPolicy(ptype: string, ...params: any[]): boolean {
    if (params.length === 1 && params[0] instanceof Array) {
      return this.model.hasPolicy('p', ptype, params[0]);
    }

    return this.model.hasPolicy('p', ptype, params);
  }

  /**
   * addNamedPolicy adds an authorization rule to the current named policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  public async addNamedPolicy(ptype: string, params: any[]): Promise<boolean> {
    let ruleAdded = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleAdded = await this.addPolicy('p', ptype, params[0]);
    } else {
      ruleAdded = await this.addPolicy('p', ptype, params);
    }

    return ruleAdded;
  }

  /**
   * removeNamedPolicy removes an authorization rule from the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  public async removeNamedPolicy(ptype: string, params: any[]): Promise<boolean> {
    let ruleRemoved = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleRemoved = await this.removePolicy('p', ptype, params[0]);
    } else {
      ruleRemoved = await this.removePolicy('p', ptype, params);
    }

    return ruleRemoved;
  }

  /**
   * removeFilteredNamedPolicy removes an authorization rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  public async removeFilteredNamedPolicy(ptype: string, fieldIndex: number, fieldValues: string[]): Promise<boolean> {
    return await this.removeFilteredPolicy('p', ptype, fieldIndex, fieldValues);
  }

  /**
   * hasGroupingPolicy determines whether a role inheritance rule exists.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return whether the rule exists.
   */  public hasGroupingPolicy(...params: any[]): boolean {
    return this.hasNamedGroupingPolicy('g', params);
  }

  /**
   * hasNamedGroupingPolicy determines whether a named role inheritance rule exists.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return whether the rule exists.
   */
  public hasNamedGroupingPolicy(ptype: string, ...params: any[]): boolean {
    if (params.length === 1 && params[0] instanceof Array) {
      return this.model.hasPolicy('g', ptype, params[0]);
    }

    return this.model.hasPolicy('g', ptype, params);
  }

  /**
   * addGroupingPolicy adds a role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  public async addGroupingPolicy(...params: any[]): Promise<boolean> {
    return await this.addNamedGroupingPolicy('g', params);
  }

  /**
   * addNamedGroupingPolicy adds a named role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  public async addNamedGroupingPolicy(ptype: string, ...params: any[]): Promise<boolean> {
    let ruleadded = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleadded = await this.addPolicy('g', ptype, params[0]);
    } else {
      ruleadded = await this.addPolicy('g', ptype, params);
    }

    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }

    return ruleadded;
  }

  /**
   * removeGroupingPolicy removes a role inheritance rule from the current policy.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  public async removeGroupingPolicy(...params: any[]): Promise<boolean> {
    return await this.removeNamedGroupingPolicy('g', params);
  }

  /**
   * removeFilteredGroupingPolicy removes a role inheritance rule from the current policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  public async removeFilteredGroupingPolicy(fieldIndex: number, ...fieldValues: string[]): Promise<boolean> {
    return await this.removeFilteredNamedGroupingPolicy('g', fieldIndex, ...fieldValues);
  }

  /**
   * removeNamedGroupingPolicy removes a role inheritance rule from the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  public async removeNamedGroupingPolicy(ptype: string, ...params: any[]): Promise<boolean> {
    let ruleRemoved = false;
    if (params.length === 1 && params[0] instanceof Array) {
      ruleRemoved = await this.removePolicy('g', ptype, params[0]);
    } else {
      ruleRemoved = await this.removePolicy('g', ptype, params);
    }

    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return ruleRemoved;
  }

  /**
   * removeFilteredNamedGroupingPolicy removes a role inheritance rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  public async removeFilteredNamedGroupingPolicy(ptype: string, fieldIndex: number, ...fieldValues: string[]): Promise<boolean> {
    const ruleRemoved = await this.removeFilteredPolicy('g', ptype, fieldIndex, fieldValues);
    if (this.autoBuildRoleLinks) {
      this.buildRoleLinks();
    }
    return ruleRemoved;
  }

  /**
   * addFunction adds a customized function.
   * @param name custom function name
   * @param func function
   */
  public addFunction(name: string, func: any): void {
    this.fm.addFunction(name, func);
  }

  // **************RBAC API*************
  /**
   * getRolesForUser gets the roles that a user has.
   *
   * @param name the user.
   * @return the roles that the user has.
   */
  public getRolesForUser(name: string): string[] {
    // @ts-ignore
    const rm = this.model.model.get('g').get('g').rm;
    const result = rm.getRoles(name);
    return result;
  }

  /**
   * getUsersForRole gets the users that has a role.
   *
   * @param name the role.
   * @return the users that has the role.
   */
  public getUsersForRole(name: string): string[] {
    // @ts-ignore
    const rm = this.model.model.get('g').get('g').rm;
    const result = rm.getUsers(name);
    return result;
  }

  /**
   * hasRoleForUser determines whether a user has a role.
   *
   * @param name the user.
   * @param role the role.
   * @return whether the user has the role.
   */
  public hasRoleForUser(name: string, role: string): boolean {
    const roles = this.getRolesForUser(name);
    let hasRole: boolean = false;
    for (const r of roles) {
      if (r === role) {
        hasRole = true;
        break;
      }
    }

    return hasRole;
  }

  /**
   * addRoleForUser adds a role for a user.
   * Returns false if the user already has the role (aka not affected).
   *
   * @param user the user.
   * @param role the role.
   * @return succeeds or not.
   */
  public async addRoleForUser(user: string, role: string): Promise<boolean> {
    return await this.addGroupingPolicy(user, role);
  }

  /**
   * deleteRoleForUser deletes a role for a user.
   * Returns false if the user does not have the role (aka not affected).
   *
   * @param user the user.
   * @param role the role.
   * @return succeeds or not.
   */
  public async deleteRoleForUser(user: string, role: string): Promise<boolean> {
    return await this.removeGroupingPolicy(user, role);
  }

  /**
   * deleteRolesForUser deletes all roles for a user.
   * Returns false if the user does not have any roles (aka not affected).
   *
   * @param user the user.
   * @return succeeds or not.
   */
  public async deleteRolesForUser(user: string): Promise<boolean> {
    return await this.removeFilteredGroupingPolicy(0, user);
  }

  /**
   * deleteUser deletes a user.
   * Returns false if the user does not exist (aka not affected).
   *
   * @param user the user.
   * @return succeeds or not.
   */
  public async deleteUser(user: string): Promise<boolean> {
    return await this.removeFilteredGroupingPolicy(0, user);
  }

  /**
   * deleteRole deletes a role.
   *
   * @param role the role.
   */
  public async deleteRole(role: string): Promise<void> {
    await this.removeFilteredGroupingPolicy(1, role);
    await this.removeFilteredPolicy(0, role);
  }

  /**
   * deletePermission deletes a permission.
   * Returns false if the permission does not exist (aka not affected).
   *
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return succeeds or not.
   */
  public async deletePermission(...permission: string[]): Promise<boolean> {
    return await this.removeFilteredPolicy(1, permission);
  }

  /**
   * addPermissionForUser adds a permission for a user or role.
   * Returns false if the user or role already has the permission (aka not affected).
   *
   * @param user the user.
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return succeeds or not.
   */
  public async addPermissionForUser(user: string, ...permission: string[]): Promise<boolean> {
    permission.unshift(user);
    return await this.addPolicy(permission);
  }

  /**
   * deletePermissionForUser deletes a permission for a user or role.
   * Returns false if the user or role does not have the permission (aka not affected).
   *
   * @param user the user.
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return succeeds or not.
   */
  public async deletePermissionForUser(user: string, ...permission: string[]): Promise<boolean> {
    permission.unshift(user);
    return await this.removePolicy(permission);
  }

  /**
   * deletePermissionsForUser deletes permissions for a user or role.
   * Returns false if the user or role does not have any permissions (aka not affected).
   *
   * @param user the user.
   * @return succeeds or not.
   */
  public async deletePermissionsForUser(user: string): Promise<boolean> {
    return await this.removeFilteredPolicy(0, user);
  }

  /**
   * getPermissionsForUser gets permissions for a user or role.
   *
   * @param user the user.
   * @return the permissions, a permission is usually like (obj, act). It is actually the rule without the subject.
   */
  public getPermissionsForUser(user: string): string[][] {
    return this.getFilteredPolicy(0, user);
  }

  /**
   * hasPermissionForUser determines whether a user has a permission.
   *
   * @param user the user.
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return whether the user has the permission.
   */
  public hasPermissionForUser(user: string, ...permission: string[]): boolean {
    permission.unshift(user);
    return this.hasPolicy(permission);
  }
}
