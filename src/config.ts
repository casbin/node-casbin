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
import { readFileSync } from 'fs';

export class Config {
  private static DEFAULT_SECTION = 'default';
  private static DEFAULT_COMMENT = '#';
  private static DEFAULT_COMMENT_SEM = ';';

  private data: Map<string, Map<string, string>>;

  constructor() {
    this.data = new Map<string, Map<string, string>>();
  }

  /**
   * newConfig create an empty configuration representation from file.
   *
   * @param confName the path of the model file.
   * @return the constructor of Config.
   */
  public static newConfig(confName: string): Config {
    const config = new Config();
    config.parse(confName);
    return config;
  }

  /**
   * newConfigFromText create an empty configuration representation from text.
   *
   * @param text the model text.
   * @return the constructor of Config.
   */
  public static newConfigFromText(text: string): Config {
    const config = new Config();
    config.parseBuffer(Buffer.from(text));
    return config;
  }

  /**
   * addConfig adds a new section->key:value to the configuration.
   */
  private addConfig(section: string, option: string, value: string): boolean {
    if (section === '') {
      section = Config.DEFAULT_SECTION;
    }
    const hasKey = this.data.has(section);
    if (!hasKey) {
      this.data.set(section, new Map<string, string>());
    }

    const item = this.data.get(section);
    if (item) {
      item.set(option, value);
      return item.has(option);
    } else {
      return false;
    }
  }

  private parse(path: string): void {
    const buf = readFileSync(path);
    this.parseBuffer(buf);
  }

  private parseBuffer(buf: Buffer): void {
    let section = '';
    const lines = buf.toString().split('\r');
    lines.forEach((n, index) => {
      const line = n.trim();
      if (line.startsWith(Config.DEFAULT_COMMENT)) {
        return;
      } else if (line.startsWith(Config.DEFAULT_COMMENT_SEM)) {
        return;
      } else if (line.startsWith('[') && line.endsWith(']')) {
        section = line.substring(1, line.length - 1);
      } else {
        const optionVal = line.split('=', 2);
        if (optionVal.length !== 2) {
          throw new Error(
            `parse the content error : line ${index + 1} , %s = ${
              optionVal[0]
            } `
          );
        }
        const option = optionVal[0].trim();
        const value = optionVal[1].trim();
        this.addConfig(section, option, value);
      }
    });
  }

  public getBool(key: string): boolean {
    return !!this.get(key);
  }

  public getInt(key: string): number {
    return Number.parseInt(this.get(key), 10);
  }

  public getFloat(key: string): number {
    return Number.parseFloat(this.get(key));
  }

  public getString(key: string): string {
    return this.get(key);
  }

  public getStrings(key: string): string[] {
    const v = this.get(key);
    return v.split(',');
  }

  public set(key: string, value: string): void {
    if (!key) {
      throw new Error('key is empty');
    }

    let section = '';
    let option;

    const keys = key.toLowerCase().split('::');
    if (keys.length >= 2) {
      section = keys[0];
      option = keys[1];
    } else {
      option = keys[0];
    }

    this.addConfig(section, option, value);
  }

  public get(key: string): string {
    let section;
    let option;

    const keys = key.toLowerCase().split('::');
    if (keys.length >= 2) {
      section = keys[0];
      option = keys[1];
    } else {
      section = Config.DEFAULT_SECTION;
      option = keys[0];
    }

    const item = this.data.get(section);
    const itemChild = item && item.get(option);

    return itemChild ? itemChild : '';
  }
}
