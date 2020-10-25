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

// Effect is the result for a policy rule.
// Values for policy effect.
import { EffectorStream } from './effectorStream';

export enum Effect {
  Allow = 1,
  Indeterminate,
  Deny,
}

// Effector is the interface for Casbin effectors.
export interface Effector {
  newStream(expr: string): EffectorStream;
}
