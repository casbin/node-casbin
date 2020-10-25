// Copyright 2020 The Casbin Authors. All Rights Reserved.
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

import { EffectorStream } from './effectorStream';
import { Effect } from './effector';

/**
 * DefaultEffectorStream is the default implementation of EffectorStream.
 */
export class DefaultEffectorStream implements EffectorStream {
  private done = false;
  private res = false;
  private readonly expr: string;

  constructor(expr: string) {
    this.expr = expr;
  }

  current(): boolean {
    return this.res;
  }

  public pushEffect(eft: Effect): [boolean, boolean] {
    switch (this.expr) {
      case 'some(where (p_eft == allow))':
        if (eft === Effect.Allow) {
          this.res = true;
          this.done = true;
        }
        break;
      case '!some(where (p_eft == deny))':
        this.res = true;
        if (eft === Effect.Deny) {
          this.res = false;
          this.done = true;
        }
        break;
      case 'some(where (p_eft == allow)) && !some(where (p_eft == deny))':
        if (eft === Effect.Allow) {
          this.res = true;
        } else if (eft === Effect.Deny) {
          this.res = false;
          this.done = true;
        }
        break;
      case 'priority(p_eft) || deny':
        if (eft !== Effect.Indeterminate) {
          this.res = eft === Effect.Allow;
          this.done = true;
        }
        break;
      default:
        throw new Error('unsupported effect');
    }
    return [this.res, this.done];
  }
}
