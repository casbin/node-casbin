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

// RoleManager provides interface to define the operations for managing roles.
export interface RoleManager {
  // Clear clears all stored data and resets the role manager to the initial state.
  clear(): Promise<void>;
  // AddLink adds the inheritance link between two roles. role: name1 and role: name2.
  // domain is a prefix to the roles (can be used for other purposes).
  addLink(name1: string, name2: string, ...domain: string[]): Promise<void>;
  // DeleteLink deletes the inheritance link between two roles. role: name1 and role: name2.
  // domain is a prefix to the roles (can be used for other purposes).
  deleteLink(name1: string, name2: string, ...domain: string[]): Promise<void>;
  // HasLink determines whether a link exists between two roles. role: name1 inherits role: name2.
  // domain is a prefix to the roles (can be used for other purposes).
  hasLink(name1: string, name2: string, ...domain: string[]): Promise<boolean>;
  // syncedHasLink is same as hasLink, but not wrapped in promise. Should not be called
  // if the matchers contain an asynchronous method. Can increase performance.
  syncedHasLink?(name1: string, name2: string, ...domain: string[]): boolean;
  // GetRoles gets the roles that a user inherits.
  // domain is a prefix to the roles (can be used for other purposes).
  getRoles(name: string, ...domain: string[]): Promise<string[]>;
  // GetUsers gets the users that inherits a role.
  // domain is a prefix to the users (can be used for other purposes).
  getUsers(name: string, ...domain: string[]): Promise<string[]>;
  // PrintRoles prints all the roles to log.
  printRoles(): Promise<void>;
}
