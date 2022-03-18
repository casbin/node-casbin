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

import { ManagementEnforcer } from './managementEnforcer';
import { Model, newModel } from './model';
import { Adapter, FileAdapter, StringAdapter } from './persist';
import { getLogger } from './log';
import { arrayRemoveDuplicates } from './util';

/**
 * Enforcer = ManagementEnforcer + RBAC API.
 */
export class Enforcer extends ManagementEnforcer {
  /**
   * initWithFile initializes an enforcer with a model file and a policy file.
   * @param modelPath model file path
   * @param policyPath policy file path
   * @param lazyLoad lazyLoad whether to load policy at initial time
   */
  public async initWithFile(modelPath: string, policyPath: string, lazyLoad = false): Promise<void> {
    const a = new FileAdapter(policyPath);
    await this.initWithAdapter(modelPath, a, lazyLoad);
  }

  /**
   * initWithFile initializes an enforcer with a model file and a policy file.
   * @param modelPath model file path
   * @param policyString policy CSV string
   * @param lazyLoad whether to load policy at initial time
   */
  public async initWithString(modelPath: string, policyString: string, lazyLoad = false): Promise<void> {
    const a = new StringAdapter(policyString);
    await this.initWithAdapter(modelPath, a, lazyLoad);
  }

  /**
   * initWithAdapter initializes an enforcer with a database adapter.
   * @param modelPath model file path
   * @param adapter current adapter instance
   * @param lazyLoad whether to load policy at initial time
   */
  public async initWithAdapter(modelPath: string, adapter: Adapter, lazyLoad = false): Promise<void> {
    const m = newModel(modelPath, '');
    await this.initWithModelAndAdapter(m, adapter, lazyLoad);

    this.modelPath = modelPath;
  }

  /**
   * initWithModelAndAdapter initializes an enforcer with a model and a database adapter.
   * @param m model instance
   * @param adapter current adapter instance
   * @param lazyLoad whether to load policy at initial time
   */
  public async initWithModelAndAdapter(m: Model, adapter?: Adapter, lazyLoad = false): Promise<void> {
    if (adapter) {
      this.adapter = adapter;
    }

    this.model = m;
    this.model.printModel();

    this.initRmMap();

    if (!lazyLoad && this.adapter) {
      await this.loadPolicy();
    }
  }

  /**
   * getRolesForUser gets the roles that a user has.
   *
   * @param name the user.
   * @param domain the domain.
   * @return the roles that the user has.
   */
  public async getRolesForUser(name: string, domain?: string): Promise<string[]> {
    const rm = this.rmMap.get('g');
    if (rm) {
      if (domain === undefined) {
        return rm.getRoles(name);
      } else {
        return rm.getRoles(name, domain);
      }
    }
    throw new Error("RoleManager didn't exist.");
  }

  /**
   * getUsersForRole gets the users that has a role.
   *
   * @param name the role.
   * @param domain the domain.
   * @return the users that has the role.
   */
  public async getUsersForRole(name: string, domain?: string): Promise<string[]> {
    const rm = this.rmMap.get('g');
    if (rm) {
      if (domain === undefined) {
        return rm.getUsers(name);
      } else {
        return rm.getUsers(name, domain);
      }
    }
    throw new Error("RoleManager didn't exist.");
  }

  /**
   * hasRoleForUser determines whether a user has a role.
   *
   * @param name the user.
   * @param role the role.
   * @param domain the domain.
   * @return whether the user has the role.
   */
  public async hasRoleForUser(name: string, role: string, domain?: string): Promise<boolean> {
    const roles = await this.getRolesForUser(name, domain);
    let hasRole = false;
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
   * @param domain the domain.
   * @return succeeds or not.
   */
  public async addRoleForUser(user: string, role: string, domain?: string): Promise<boolean> {
    if (domain === undefined) {
      return this.addGroupingPolicy(user, role);
    } else {
      return this.addGroupingPolicy(user, role, domain);
    }
  }

  /**
   * deleteRoleForUser deletes a role for a user.
   * Returns false if the user does not have the role (aka not affected).
   *
   * @param user the user.
   * @param role the role.
   * @param domain the domain.
   * @return succeeds or not.
   */
  public async deleteRoleForUser(user: string, role: string, domain?: string): Promise<boolean> {
    if (domain === undefined) {
      return this.removeGroupingPolicy(user, role);
    } else {
      return this.removeGroupingPolicy(user, role, domain);
    }
  }

  /**
   * deleteRolesForUser deletes all roles for a user.
   * Returns false if the user does not have any roles (aka not affected).
   *
   * @param user the user.
   * @param domain the domain.
   * @return succeeds or not.
   */
  public async deleteRolesForUser(user: string, domain?: string): Promise<boolean> {
    if (domain === undefined) {
      return this.removeFilteredGroupingPolicy(0, user);
    } else {
      return this.removeFilteredGroupingPolicy(0, user, '', domain);
    }
  }

  /**
   * deleteUser deletes a user.
   * Returns false if the user does not exist (aka not affected).
   *
   * @param user the user.
   * @return succeeds or not.
   */
  public async deleteUser(user: string): Promise<boolean> {
    const res1 = await this.removeFilteredGroupingPolicy(0, user);
    const res2 = await this.removeFilteredPolicy(0, user);
    return res1 || res2;
  }

  /**
   * deleteRole deletes a role.
   * Returns false if the role does not exist (aka not affected).
   *
   * @param role the role.
   * @return succeeds or not.
   */
  public async deleteRole(role: string): Promise<boolean> {
    const res1 = await this.removeFilteredGroupingPolicy(1, role);
    const res2 = await this.removeFilteredPolicy(0, role);
    return res1 || res2;
  }

  /**
   * deletePermission deletes a permission.
   * Returns false if the permission does not exist (aka not affected).
   *
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return succeeds or not.
   */
  public async deletePermission(...permission: string[]): Promise<boolean> {
    return this.removeFilteredPolicy(1, ...permission);
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
    return this.addPolicy(...permission);
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
    return this.removePolicy(...permission);
  }

  /**
   * deletePermissionsForUser deletes permissions for a user or role.
   * Returns false if the user or role does not have any permissions (aka not affected).
   *
   * @param user the user.
   * @return succeeds or not.
   */
  public async deletePermissionsForUser(user: string): Promise<boolean> {
    return this.removeFilteredPolicy(0, user);
  }

  /**
   * getPermissionsForUser gets permissions for a user or role.
   *
   * @param user the user.
   * @return the permissions, a permission is usually like (obj, act). It is actually the rule without the subject.
   */
  public async getPermissionsForUser(user: string): Promise<string[][]> {
    return this.getFilteredPolicy(0, user);
  }

  /**
   * hasPermissionForUser determines whether a user has a permission.
   *
   * @param user the user.
   * @param permission the permission, usually be (obj, act). It is actually the rule without the subject.
   * @return whether the user has the permission.
   */
  public async hasPermissionForUser(user: string, ...permission: string[]): Promise<boolean> {
    permission.unshift(user);
    return this.hasPolicy(...permission);
  }

  /**
   * getImplicitRolesForUser gets implicit roles that a user has.
   * Compared to getRolesForUser(), this function retrieves indirect roles besides direct roles.
   * For example:
   * g, alice, role:admin
   * g, role:admin, role:user
   *
   * getRolesForUser("alice") can only get: ["role:admin"].
   * But getImplicitRolesForUser("alice") will get: ["role:admin", "role:user"].
   */
  public async getImplicitRolesForUser(name: string, ...domain: string[]): Promise<string[]> {
    const res = new Set<string>();
    const q = [name];
    let n: string | undefined;
    while ((n = q.shift()) !== undefined) {
      for (const rm of this.rmMap.values()) {
        const role = await rm.getRoles(n, ...domain);
        role.forEach((r) => {
          if (!res.has(r)) {
            res.add(r);
            q.push(r);
          }
        });
      }
    }

    return Array.from(res);
  }

  /**
   * getImplicitPermissionsForUser gets implicit permissions for a user or role.
   * Compared to getPermissionsForUser(), this function retrieves permissions for inherited roles.
   * For example:
   * p, admin, data1, read
   * p, alice, data2, read
   * g, alice, admin
   *
   * getPermissionsForUser("alice") can only get: [["alice", "data2", "read"]].
   * But getImplicitPermissionsForUser("alice") will get: [["admin", "data1", "read"], ["alice", "data2", "read"]].
   */
  public async getImplicitPermissionsForUser(user: string, ...domain: string[]): Promise<string[][]> {
    const roles = await this.getImplicitRolesForUser(user, ...domain);
    roles.unshift(user);
    const res: string[][] = [];
    const withDomain = domain && domain.length !== 0;

    for (const n of roles) {
      if (withDomain) {
        const p = await this.getFilteredPolicy(0, n, ...domain);
        res.push(...p);
      } else {
        const p = await this.getPermissionsForUser(n);
        res.push(...p);
      }
    }

    return res;
  }

  /**
   * getImplicitUsersForRole gets implicit users that a role has.
   * Compared to getUsersForRole(), this function retrieves indirect users besides direct users.
   * For example:
   * g, alice, role:admin
   * g, role:admin, role:user
   *
   * getUsersForRole("user") can only get: ["role:admin"].
   * But getImplicitUsersForRole("user") will get: ["role:admin", "alice"].
   */
  public async getImplicitUsersForRole(role: string, ...domain: string[]): Promise<string[]> {
    const res = new Set<string>();
    const q = [role];
    let n: string | undefined;
    while ((n = q.shift()) !== undefined) {
      for (const rm of this.rmMap.values()) {
        const user = await rm.getUsers(n, ...domain);
        user.forEach((u) => {
          if (!res.has(u)) {
            res.add(u);
            q.push(u);
          }
        });
      }
    }

    return Array.from(res);
  }

  /**
   * getRolesForUserInDomain gets the roles that a user has inside a domain
   * An alias for getRolesForUser with the domain params.
   *
   * @param name the user.
   * @param domain the domain.
   * @return the roles that the user has.
   */
  public async getRolesForUserInDomain(name: string, domain: string): Promise<string[]> {
    return this.getRolesForUser(name, domain);
  }

  /**
   * getUsersForRoleInFomain gets the users that has a role inside a domain
   * An alias for getUsesForRole with the domain params.
   *
   * @param name the role.
   * @param domain the domain.
   * @return the users that has the role.
   */
  public async getUsersForRoleInDomain(name: string, domain: string): Promise<string[]> {
    return this.getUsersForRole(name, domain);
  }

  /**
   * getImplicitUsersForPermission gets implicit users for a permission.
   * For example:
   * p, admin, data1, read
   * p, bob, data1, read
   * g, alice, admin
   *
   * getImplicitUsersForPermission("data1", "read") will get: ["alice", "bob"].
   * Note: only users will be returned, roles (2nd arg in "g") will be excluded.
   */
  public async getImplicitUsersForPermission(...permission: string[]): Promise<string[]> {
    const res: string[] = [];
    const policySubjects = await this.getAllSubjects();
    const subjects = arrayRemoveDuplicates([...policySubjects, ...this.model.getValuesForFieldInPolicyAllTypes('g', 0)]);
    const inherits = this.model.getValuesForFieldInPolicyAllTypes('g', 1);

    for (const user of subjects) {
      const allowed = await this.enforce(user, ...permission);
      if (allowed) {
        res.push(user);
      }
    }

    return res.filter((n) => !inherits.some((m) => n === m));
  }
}

export async function newEnforcerWithClass<T extends Enforcer>(enforcer: new () => T, ...params: any[]): Promise<T> {
  const e = new enforcer();

  let parsedParamLen = 0;
  if (params.length >= 1) {
    const enableLog = params[params.length - 1];
    if (typeof enableLog === 'boolean') {
      getLogger().enableLog(enableLog);
      parsedParamLen++;
    }
  }

  if (params.length - parsedParamLen === 2) {
    if (typeof params[0] === 'string') {
      if (typeof params[1] === 'string') {
        await e.initWithFile(params[0].toString(), params[1].toString());
      } else {
        await e.initWithAdapter(params[0].toString(), params[1]);
      }
    } else {
      if (typeof params[1] === 'string') {
        throw new Error('Invalid parameters for enforcer.');
      } else {
        await e.initWithModelAndAdapter(params[0], params[1]);
      }
    }
  } else if (params.length - parsedParamLen === 1) {
    if (typeof params[0] === 'string') {
      await e.initWithFile(params[0], '');
    } else {
      await e.initWithModelAndAdapter(params[0]);
    }
  } else if (params.length === parsedParamLen) {
    await e.initWithFile('', '');
  } else {
    throw new Error('Invalid parameters for enforcer.');
  }

  return e;
}

/**
 * newEnforcer creates an enforcer via file or DB.
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
export async function newEnforcer(...params: any[]): Promise<Enforcer> {
  return newEnforcerWithClass(Enforcer, ...params);
}
