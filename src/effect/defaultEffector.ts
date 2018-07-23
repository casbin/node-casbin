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

import { Effect, IEffector } from './effector';

/**
 * DefaultEffector is default effector for Casbin.
 */
export class DefaultEffector implements IEffector {
  /**
   * DefaultEffector is the constructor for DefaultEffector.
   */
  constructor() {}

  /**
   * mergeEffects merges all matching results collected by the enforcer into a single decision.
   * @param {string} expr
   * @param {Effect[]} effects
   * @param {number[]} results
   * @returns {boolean}
   */
  public mergeEffects(
    expr: string,
    effects: Effect[],
    results: number[]
  ): boolean {
    let result = false;

    if (expr === 'some(where (p_eft == allow))') {
      result = !!effects.find(n => n === Effect.Allow);
    } else if (expr === '!some(where (p_eft == deny))') {
      result = !effects.find(n => n === Effect.Deny);
    } else if (
      expr === 'some(where (p_eft == allow)) && !some(where (p_eft == deny))'
    ) {
      result = false;
      for (const eft of effects) {
        if (eft === Effect.Allow) {
          result = true;
        } else if (eft === Effect.Deny) {
          result = false;
          break;
        }
      }
    } else if (expr === 'priority(p_eft) || deny') {
      result = !!effects.find(
        n => n !== Effect.Indeterminate && n === Effect.Allow
      );
    } else {
      throw new Error('unsupported effect');
    }

    return result;
  }
}
