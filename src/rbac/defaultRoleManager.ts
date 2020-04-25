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

import { RoleManager } from './roleManager';
import { logPrint } from '../log';

/**
 * Role represents the data structure for a role in RBAC.
 */
class Role {
  public name: string;
  private roles: Role[];

  constructor(name: string) {
    this.name = name;
    this.roles = [];
  }

  public addRole(role: Role): void {
    if (this.roles.some(n => n.name === role.name)) {
      return;
    }
    this.roles.push(role);
  }

  public deleteRole(role: Role): void {
    this.roles = this.roles.filter(n => n.name !== role.name);
  }

  public hasRole(name: string, hierarchyLevel: number): boolean {
    if (this.name === name) {
      return true;
    }
    if (hierarchyLevel <= 0) {
      return false;
    }
    for (const role of this.roles) {
      if (role.hasRole(name, hierarchyLevel - 1)) {
        return true;
      }
    }

    return false;
  }

  public hasDirectRole(name: string): boolean {
    return this.roles.some(n => n.name === name);
  }

  public toString(): string {
    return this.name + this.roles.join(', ');
  }

  public getRoles(): string[] {
    return this.roles.map(n => n.name);
  }
}

type MatchingFunc = (arg1: string, arg2: string) => boolean;

// RoleManager provides a default implementation for the RoleManager interface
export class DefaultRoleManager implements RoleManager {
  private allRoles: Map<string, Role>;
  private maxHierarchyLevel: number;
  private hasPattern = false;
  private matchingFunc: MatchingFunc;

  /**
   * DefaultRoleManager is the constructor for creating an instance of the
   * default RoleManager implementation.
   *
   * @param maxHierarchyLevel the maximized allowed RBAC hierarchy level.
   */
  constructor(maxHierarchyLevel: number) {
    this.allRoles = new Map<string, Role>();
    this.maxHierarchyLevel = maxHierarchyLevel;
  }

  /**
   * e.buildRoleLinks must be called after addMatchingFunc().
   * @param name
   * @param fn
   * @example ```javascript
   * await e.GetRoleManager().addMatchingFunc('matcher', util.keyMatch); await e.buildRoleLinks();
   * ```
   */
  public async addMatchingFunc(name: string, fn: MatchingFunc): Promise<void> {
    this.hasPattern = true;
    this.matchingFunc = fn;
  }

  /**
   * addLink adds the inheritance link between role: name1 and role: name2.
   * aka role: name1 inherits role: name2.
   * domain is a prefix to the roles.
   */
  public async addLink(name1: string, name2: string, ...domain: string[]): Promise<void> {
    if (domain.length === 1) {
      name1 = domain[0] + '::' + name1;
      name2 = domain[0] + '::' + name2;
    } else if (domain.length > 1) {
      throw new Error('error: domain should be 1 parameter');
    }

    const role1 = this.createRole(name1);
    const role2 = this.createRole(name2);
    role1.addRole(role2);
  }

  /**
   * clear clears all stored data and resets the role manager to the initial state.
   */
  public async clear(): Promise<void> {
    this.allRoles = new Map<string, Role>();
  }

  /**
   * deleteLink deletes the inheritance link between role: name1 and role: name2.
   * aka role: name1 does not inherit role: name2 any more.
   * domain is a prefix to the roles.
   */
  public async deleteLink(name1: string, name2: string, ...domain: string[]): Promise<void> {
    if (domain.length === 1) {
      name1 = domain[0] + '::' + name1;
      name2 = domain[0] + '::' + name2;
    } else if (domain.length > 1) {
      throw new Error('error: domain should be 1 parameter');
    }

    if (!this.hasRole(name1) || !this.hasRole(name2)) {
      return;
    }

    const role1 = this.createRole(name1);
    const role2 = this.createRole(name2);
    role1.deleteRole(role2);
  }

  /**
   * getRoles gets the roles that a subject inherits.
   * domain is a prefix to the roles.
   */
  public async getRoles(name: string, ...domain: string[]): Promise<string[]> {
    if (domain.length === 1) {
      name = domain[0] + '::' + name;
    } else if (domain.length > 1) {
      throw new Error('error: domain should be 1 parameter');
    }

    if (!this.hasRole(name)) {
      return [];
    }

    let roles = this.createRole(name).getRoles();
    if (domain.length === 1) {
      roles = roles.map(n => n.substring(domain[0].length + 2, n.length));
    }

    return roles;
  }

  /**
   * getUsers gets the users that inherits a subject.
   * domain is an unreferenced parameter here, may be used in other implementations.
   */
  public async getUsers(name: string, ...domain: string[]): Promise<string[]> {
    if (domain.length === 1) {
      name = domain[0] + '::' + name;
    } else if (domain.length > 1) {
      throw new Error('error: domain should be 1 parameter');
    }

    if (!this.hasRole(name)) {
      return [];
    }

    let users = [...this.allRoles.values()].filter(n => n.hasDirectRole(name)).map(n => n.name);
    if (domain.length === 1) {
      users = users.map(n => n.substring(domain[0].length + 2, n.length));
    }
    return users;
  }

  /**
   * hasLink determines whether role: name1 inherits role: name2.
   * domain is a prefix to the roles.
   */
  public async hasLink(name1: string, name2: string, ...domain: string[]): Promise<boolean> {
    if (domain.length === 1) {
      name1 = domain[0] + '::' + name1;
      name2 = domain[0] + '::' + name2;
    } else if (domain.length > 1) {
      throw new Error('error: domain should be 1 parameter');
    }

    if (name1 === name2) {
      return true;
    }

    if (!this.hasRole(name1) || !this.hasRole(name2)) {
      return false;
    }

    const role1 = this.createRole(name1);

    return role1.hasRole(name2, this.maxHierarchyLevel);
  }

  /**
   * printRoles prints all the roles to log.
   */
  public async printRoles(): Promise<void> {
    [...this.allRoles.values()].forEach(n => {
      logPrint(n.toString());
    });
  }

  private createRole(name: string): Role {
    let role = this.allRoles.get(name);
    if (!role) {
      const newRole = new Role(name);
      role = newRole;
      this.allRoles.set(name, newRole);
    }

    if (!this.hasPattern) {
      return role;
    }

    for (const roleName of this.allRoles.keys()) {
      if (!(this.matchingFunc(name, roleName) && name !== roleName)) {
        continue;
      }

      const inherit = this.allRoles.get(roleName);
      if (inherit) {
        role.addRole(inherit);
      }
    }

    return role;
  }

  private hasRole(name: string): boolean {
    if (!this.hasPattern) {
      return this.allRoles.has(name);
    } else {
      for (const role of this.allRoles.keys()) {
        if (this.matchingFunc(name, role)) {
          return true;
        }
      }
    }

    return false;
  }
}
