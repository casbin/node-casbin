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

export class Config {
  private static DEFAULT_SECTION = "default";
  private static DEFAULT_COMMENT   = "#";
  private static DEFAULT_COMMENT_SEM = ";";

  private data: {[index: string]: string};

  constructor() {
  }

  public static newConfig(confName: string): Config {
    return new Config();
  }

  public static newConfigFromText(text: string): Config {
    return new Config();
  }

  private addConfig(section: string, option: string, value: string): boolean {
    return true;
  }

  private parse(fname: string): void {
  }

  private parseBuffer(buf: string): void {
  }

  public getBool(key: string): boolean {
    return true;
  }

  public getNumber(key: string): number {
    return 0;
  }

  public getString(key: string): string {
    return "";
  }

  public getStrings(key: string): string[] {
    return [];
  }

  public set(key: string, value: string): void {
  }

  public get(key: string): string {
    return "";
  }
}
