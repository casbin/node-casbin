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
  private model: Map<string, Map<string, Assertion>>;

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

  public loadModel(path: string): void {
    const cfg = Config.newConfig(path);

    this.loadSection(cfg, 'r');
    this.loadSection(cfg, 'p');
    this.loadSection(cfg, 'e');
    this.loadSection(cfg, 'm');

    this.loadSection(cfg, 'g');
  }

  public loadModelFromText(text: string): void {
    const cfg = Config.newConfigFromText(text);

    this.loadSection(cfg, 'r');
    this.loadSection(cfg, 'p');
    this.loadSection(cfg, 'e');
    this.loadSection(cfg, 'm');

    this.loadSection(cfg, 'g');
  }

  public printModel(): void {
    util.logPrint('Model:');
    for (const sec in this.model) {
      if (this.model.hasOwnProperty(sec)) {
        const astMap = this.model.get(sec) || new Map();
        for (const key in astMap) {
          if (astMap.hasOwnProperty(key)) {
            const ast = astMap.get(key);
            const value = ast ? ast.value : '';
            util.logPrintf(`${sec}.${key}: ${value}`);
          }
        }
      }
    }
  }
}
