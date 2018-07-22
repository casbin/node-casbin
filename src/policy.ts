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

import RoleManager from './role_manager';

export class Policy {
  public model: { [index: string]: string };

  public buildRoleLinks(rm: RoleManager): void {}

  public printPolicy(): void {}

  public clearPolicy(): void {}

  public getPolicy(sec: string, ptype: string): string[][] {
    return [];
  }

  public getFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[],
  ): string[][] {
    return [];
  }

  public hasPolicy(sec: string, ptype: string, rule: string[]): boolean {
    return true;
  }

  public addPolicy(sec: string, ptype: string, rule: string[]): boolean {
    return true;
  }

  public removePolicy(sec: string, ptype: string, rule: string[]): boolean {
    return true;
  }

  public removeFilteredPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[],
  ): boolean {
    return true;
  }

  public getValuesForFieldInPolicy(
    sec: string,
    ptype: string,
    fieldIndex: number,
  ): string[] {
    return [];
  }
}
