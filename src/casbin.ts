import * as Util from './util';
import { Enforcer } from './enforcer';
import { setEnableLog } from './util';
import { Model } from './model';

export * from './enforcer';
export * from './effect';
export * from './model';
export * from './persist';
export * from './rbac';
export { Util };

/**
 * newModel creates a model.
 */
export function newModel(...text: string[]): Model {
  const m = new Model();

  if (text.length === 2) {
    if (text[0] !== '') {
      m.loadModel(text[0]);
    }
  } else if (text.length === 1) {
    m.loadModelFromText(text[0]);
  } else if (text.length !== 0) {
    throw new Error('Invalid parameters for model.');
  }

  return m;
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

export function newEnforcer(...params: any[]): Promise<Enforcer> {
  const e = new Enforcer();

  let parsedParamLen = 0;
  if (params.length >= 1) {
    const enableLog = params[params.length - 1];
    if (typeof enableLog === 'boolean') {
      setEnableLog(enableLog);
      parsedParamLen++;
    }
  }

  if (params.length - parsedParamLen === 2) {
    if (typeof params[0] === 'string') {
      if (typeof params[1] === 'string') {
        return new Promise<Enforcer>((resolve, reject) => {
          e.initWithFile(params[0].toString(), params[1].toString()).then(() => {
            return resolve(e);
          });
        });
      } else {
        return new Promise<Enforcer>((resolve) => {
          e.initWithAdapter(params[0].toString(), params[1]).then(() => {
            return resolve(e);
          });
        });
      }
    } else {
      if (typeof params[1] === 'string') {
        throw new Error('Invalid parameters for enforcer.');
      } else {
        return new Promise<Enforcer>((resolve) => {
          e.initWithModelAndAdapter(params[0], params[1]).then(() => {
            return resolve(e);
          });
        });
      }
    }
  } else if (params.length - parsedParamLen === 1) {
    if (typeof params[0] === 'string') {
      return new Promise<Enforcer>((resolve) => {
        e.initWithFile(params[0], '').then(() => {
          return resolve(e);
        });
      });
    } else {
      return new Promise<Enforcer>((resolve) => {
        // @ts-ignore
        e.initWithModelAndAdapter(params[0], null).then(() => {
          return resolve(e);
        });
      });
    }
  } else if (params.length === parsedParamLen) {
    return new Promise<Enforcer>((resolve) => {
      e.initWithFile('', '').then(() => {
        return resolve(e);
      });
    });
  } else {
    throw new Error('Invalid parameters for enforcer.');
  }
}

export default {
  newEnforcer,
  newModel
};
