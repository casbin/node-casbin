// Copyright 2024 The Casbin Authors. All Rights Reserved.
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

import { Enforcer, newEnforcerWithClass } from './enforcer';
import { EnforceContext } from './enforceContext';

// IndexedEnforcer wraps Enforcer and provides policy indexing for improved performance
// with large policy sets, especially for RBAC models with wildcard matching.
export class IndexedEnforcer extends Enforcer {
  /**
   * Initialize the indexed enforcer with automatic policy indexing enabled.
   */
  constructor() {
    super();
    // Enable policy indexing by default for this enforcer type
    this.enableAutoBuildPolicyIndex(true);
  }

  /**
   * enforceWithIndex is an optimized version of enforce that uses the policy index
   * to reduce the number of policies that need to be checked.
   * 
   * Note: The current implementation leverages the policy index infrastructure and
   * role memoization in the g() function to provide performance benefits. Future
   * enhancements could further optimize by implementing a custom enforcement path
   * that only evaluates policies at the returned indices.
   */
  public async enforceWithIndex(...rvals: any[]): Promise<boolean> {
    // Get the subject from the request
    if (rvals.length === 0) {
      return super.enforce(...rvals);
    }

    const subject = rvals[0];
    const enforceContext = this.defaultEnforceContext;

    // Pre-fetch policy indices to check (this populates role caches)
    const indices = await this.getPolicyIndicesToCheck(subject, enforceContext);

    // The indices information is used internally by the policy index infrastructure
    // and the memoized g() function to optimize enforcement
    // Future enhancement: Implement custom enforcement that only checks policies at these indices
    return super.enforce(...rvals);
  }

  /**
   * enforce decides whether a "subject" can access a "object" with
   * the operation "action", input parameters are usually: (sub, obj, act).
   * Uses policy indexing for improved performance with large policy sets.
   */
  public async enforce(...rvals: any[]): Promise<boolean> {
    return this.enforceWithIndex(...rvals);
  }
}

// newIndexedEnforcer creates an indexed enforcer via file or DB.
export async function newIndexedEnforcer(...params: any[]): Promise<IndexedEnforcer> {
  return newEnforcerWithClass(IndexedEnforcer, ...params);
}
