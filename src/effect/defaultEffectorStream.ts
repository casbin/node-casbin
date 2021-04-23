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

export class AllowOverrideEffector implements EffectorStream {
  /**
   * returns a intermediate effect based on the matched effects of the enforcer
   * @param effects
   */
  intermediateEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Allow)) {
      return Effect.Allow;
    }
    return Effect.Indeterminate;
  }

  /**
   * returns the final effect based on the matched effects of the enforcer
   * @param effects
   */
  finalEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Allow)) {
      return Effect.Allow;
    }
    return Effect.Deny;
  }
}

export class DenyOverrideEffector implements EffectorStream {
  /**
   * returns a intermediate effect based on the matched effects of the enforcer
   * @param effects
   */
  intermediateEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Deny)) {
      return Effect.Deny;
    }
    return Effect.Indeterminate;
  }

  /**
   * returns the final effect based on the matched effects of the enforcer
   * @param effects
   */
  finalEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Deny)) {
      return Effect.Deny;
    }
    return Effect.Allow;
  }
}

export class AllowAndDenyEffector implements EffectorStream {
  /**
   * returns a intermediate effect based on the matched effects of the enforcer
   * @param effects
   */
  intermediateEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Deny)) {
      return Effect.Deny;
    }
    return Effect.Indeterminate;
  }

  /**
   * returns the final effect based on the matched effects of the enforcer
   * @param effects
   */
  finalEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Deny) || !effects.has(Effect.Allow)) {
      return Effect.Deny;
    }
    return Effect.Allow;
  }
}

export class PriorityEffector implements EffectorStream {
  /**
   * returns a intermediate effect based on the matched effects of the enforcer
   * @param effects
   */
  intermediateEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Allow)) {
      return Effect.Allow;
    }
    if (effects.has(Effect.Deny)) {
      return Effect.Deny;
    }
    return Effect.Indeterminate;
  }

  /**
   * returns the final effect based on the matched effects of the enforcer
   * @param effects
   */
  finalEffect(effects: Set<Effect>): Effect {
    if (effects.has(Effect.Allow)) {
      return Effect.Allow;
    }
    if (effects.has(Effect.Deny)) {
      return Effect.Deny;
    }
    return Effect.Deny;
  }
}
