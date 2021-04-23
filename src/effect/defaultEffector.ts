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

import { Effector } from './effector';
import { EffectorStream } from './effectorStream';
import * as Effectors from './defaultEffectorStream';

/**
 * DefaultEffector is default effector for Casbin.
 */
export class DefaultEffector implements Effector {
  newStream(expr: string): EffectorStream {
    expr = expr.replace(/\s*/g, '');
    switch (expr) {
      case 'some(where(p_eft==allow))':
        return new Effectors.AllowOverrideEffector();
      case '!some(where(p_eft==deny))':
        return new Effectors.DenyOverrideEffector();
      case 'some(where(p_eft==allow))&&!some(where(p_eft==deny))':
        return new Effectors.AllowAndDenyEffector();
      case 'priority(p_eft)||deny':
        return new Effectors.PriorityEffector();
      default:
        throw new Error('unsupported effect');
    }
  }
}
