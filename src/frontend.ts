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

import { Enforcer } from './enforcer';

/**
 * getPermissionForCasbinJs returns a string describing the permission of a given user.
 * You can pass the returned string to the frontend and manage your webpage widgets and APIs with Casbin.js.
 * The returned permission depends on `getImplicitPermissionsForUser`.
 * In other words, getPermissionForCasbinJs will load all of the explicit and implicit permission (role's permission).
 * @param e the initialized enforcer
 * @param user the user
 */
export async function casbinJsGetPermissionForUser(e: Enforcer, user: string): Promise<string> {
  const policies = await e.getImplicitPermissionsForUser(user);
  const permission: { [key: string]: string[] } = {};
  policies.forEach(policy => {
    if (!(policy[2] in permission)) {
      permission[policy[2]] = [];
    }
    if (permission[policy[2]].indexOf(policy[1]) == -1) {
      permission[policy[2]].push(policy[1]);
    }
  });
  const permString = JSON.stringify(permission);
  return permString;
}
