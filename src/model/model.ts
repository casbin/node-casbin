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

import * as _ from 'lodash';
import * as rbac from '../rbac';
import * as util from '../util';
import { Config } from '../config';
import { Assertion } from './assertion';

const sectionNameMap: { [index: string]: string } = {
  r: 'request_definition',
  p: 'policy_definition',
  g: 'role_definition',
  e: 'policy_effect',
  m: 'matchers'
};

export class Model {
  // Model represents the whole access control model.
  // Mest-map is the collection of assertions, can be "r", "p", "g", "e", "m".
  private model: Map<string, Map<string, Assertion>>;

  /**
   * constructor is the constructor for Model.
   */
  constructor() {
    this.model = new Map<string, Map<string, Assertion>>();
  }

  private loadAssertion(cfg: Config, sec: string, key: string): boolean {
    const secName = sectionNameMap[sec];
    const value = cfg.getString(`${secName}::${key}`);
    return this.addDef(sec, key, value);
  }

  private getKeySuffix(i: number): string {
    if (i === 1) {
      return '';
    }

    return i.toString();
  }

  private loadSection(cfg: Config, sec: string): void {
    let i = 1;
    for (;;) {
      if (!this.loadAssertion(cfg, sec, sec + this.getKeySuffix(i))) {
        break;
      } else {
        i++;
      }
    }
  }

  // addDef adds an assertion to the model.
  public addDef(sec: string, key: string, value: string): boolean {
    if (value === '') {
      return false;
    }

    const ast = new Assertion();
    ast.key = key;
    ast.value = value;

    if (sec === 'r' || sec === 'p') {
      const tokens = value.split(', ');
      for (let i = 0; i < tokens.length; i++) {
        tokens[i] = key + '_' + tokens[i];
      }
      ast.tokens = tokens;
    } else {
      ast.value = util.removeComments(util.escapeAssertion(value));
    }

    const assertionMap = new Map<string, Assertion>();
    assertionMap.set(key, ast);

    this.model.set(sec, assertionMap);
    return true;
  }

  // loadModel loads the model from model CONF file.
  public loadModel(path: string): void {
    const cfg = Config.newConfig(path);

    this.loadSection(cfg, 'r');
    this.loadSection(cfg, 'p');
    this.loadSection(cfg, 'e');
    this.loadSection(cfg, 'm');

    this.loadSection(cfg, 'g');
  }

  // loadModelFromText loads the model from the text.
  public loadModelFromText(text: string): void {
    const cfg = Config.newConfigFromText(text);

    this.loadSection(cfg, 'r');
    this.loadSection(cfg, 'p');
    this.loadSection(cfg, 'e');
    this.loadSection(cfg, 'm');

    this.loadSection(cfg, 'g');
  }

  // printModel prints the model to the log.
  public printModel(): void {
    util.logPrint('Model:');
    for (const sec in this.model) {
      if (_.has(this.model, sec)) {
        const astMap = _.get(this.model, sec);
        for (const key in astMap) {
          if (astMap.hasOwnProperty(key)) {
            const ast = _.get(astMap, key);
            util.logPrintf(`${sec}.${key}: ${ast.value}`);
          }
        }
      }
    }
  }

  // buildRoleLinks initializes the roles in RBAC.
  public buildRoleLinks(rm: rbac.RoleManager): void {
    const astMap = _.get(this.model, 'g');
    for (const key in astMap) {
      if (astMap.hasOwnProperty(key)) {
        const ast = _.get(astMap, key);
        ast.buildRoleLinks(rm);
      }
    }
  }

  // clearPolicy clears all current policy.
  public clearPolicy(): void {
    let astMap = _.get(this.model, 'p');
    for (const key in astMap) {
      if (astMap.hasOwnProperty(key)) {
        const ast = _.get(astMap, key);
        ast.policy = [];
      }
    }

    astMap = _.get(this.model, 'g');
    for (const key in astMap) {
      if (astMap.hasOwnProperty(key)) {
        const ast = _.get(astMap, key);
        ast.policy = [];
      }
    }
  }

  // getPolicy gets all rules in a policy.
  public getPolicy(sec: string, key: string): string[][] {
    const astMap = _.get(this.model, sec);
    const ast = _.get(astMap, key);
    return ast.policy;
  }

  // hasPolicy determines whether a model has the specified policy rule.
  public hasPolicy(sec: string, key: string, rule: string[]): boolean {
    const astMap = _.get(this.model, sec);
    const ast = _.get(astMap, key);
    for (const r of ast.policy) {
      if (util.arrayEquals(rule, r)) {
        return true;
      }
    }

    return false;
  }

  // addPolicy adds a policy rule to the model.
  public addPolicy(sec: string, key: string, rule: string[]): boolean {
    if (!this.hasPolicy(sec, key, rule)) {
      const astMap = _.get(this.model, sec);
      const ast = _.get(astMap, key);
      ast.policy.push(rule);
      return true;
    }

    return false;
  }

  // removePolicy removes a policy rule from the model.
  public removePolicy(sec: string, key: string, rule: string[]): boolean {
    if (this.hasPolicy(sec, key, rule)) {
      const astMap = _.get(this.model, sec);
      const ast = _.get(astMap, key);
      ast.policy = _.filter(ast.policy, r => !util.arrayEquals(rule, r));
      return true;
    }

    return false;
  }

  // getFilteredPolicy gets rules based on field filters from a policy.
  public getFilteredPolicy(
    sec: string,
    key: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): string[][] {
    const res = [];

    const astMap = _.get(this.model, sec);
    const ast = _.get(astMap, key);
    for (const rule of ast.policy) {
      let matched = true;
      for (let i = 0; i < fieldValues.length; i++) {
        const fieldValue = fieldValues[i];
        if (fieldValue !== '' && rule[fieldIndex + i] !== fieldValue) {
          matched = false;
          break;
        }
      }

      if (matched) {
        res.push(rule);
      }
    }

    return res;
  }

  // removeFilteredPolicy removes policy rules based on field filters from the model.
  public removeFilteredPolicy(
    sec: string,
    key: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): boolean {
    const res = [];
    let bool = false;

    const astMap = _.get(this.model, sec);
    const ast = _.get(astMap, key);
    for (const rule of ast.policy) {
      let matched = true;
      for (let i = 0; i < fieldValues.length; i++) {
        const fieldValue = fieldValues[i];
        if (fieldValue !== '' && rule[fieldIndex + i] !== fieldValue) {
          matched = false;
          break;
        }
      }

      if (matched) {
        bool = true;
      } else {
        res.push(rule);
      }
    }
    ast.policy = res;

    return bool;
  }

  // getValuesForFieldInPolicy gets all values for a field for all rules in a policy, duplicated values are removed.
  public getValuesForFieldInPolicy(
    sec: string,
    key: string,
    fieldIndex: number
  ): string[] {
    const values = [];

    const astMap = _.get(this.model, sec);
    const ast = _.get(astMap, key);
    for (const rule of ast.policy) {
      values.push(rule[fieldIndex]);
    }

    return util.arrayRemoveDuplicates(values);
  }

  // printPolicy prints the policy to log.
  public printPolicy(): void {
    util.logPrint('Policy:');
    let astMap = _.get(this.model, 'p');
    for (const key in astMap) {
      if (astMap.hasOwnProperty(key)) {
        const ast = _.get(astMap, key);
        util.logPrint(`key, : ${ast.value}, : , ${ast.policy}`);
      }
    }

    astMap = _.get(this.model, 'g');
    for (const key in astMap) {
      if (astMap.hasOwnProperty(key)) {
        const ast = _.get(astMap, key);
        util.logPrint(`key, : ${ast.value}, : , ${ast.policy}`);
      }
    }
  }
}
