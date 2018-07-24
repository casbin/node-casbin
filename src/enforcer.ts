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

import { Model } from './model';
import { FunctionMap } from './functionMap';
import { Effector } from './effect';
import { Adapter, IAdapter } from './adapter';
import { IWatcher, Watcher } from './watcher';
import { RoleManager } from './rbac';
import { DefaultEffector } from './effect';
import { DefaultRoleManager } from './rbac';

export class Enforcer {
  protected modelPath: string;
  public model: Model;
  protected fm: FunctionMap;
  private eft: Effector;

  protected adapter: IAdapter;
  protected watcher: IWatcher;
  private rm: RoleManager;

  private enabled: boolean;
  protected autoSave: boolean;
  protected autoBuildRoleLinks: boolean;

  constructor() {
    this.modelPath = '';
    this.model = new Model();
    this.fm = new FunctionMap();
    this.eft = new DefaultEffector();
    this.adapter = new Adapter();
    this.watcher = new Watcher();
    this.rm = new DefaultRoleManager();
    this.enabled = false;
    this.autoSave = false;
    this.autoBuildRoleLinks = false;
  }

  public newModel(): Model {
    return new Model();
  }

  private initialize(): void {}
}
