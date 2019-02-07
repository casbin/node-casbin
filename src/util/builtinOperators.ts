// Copyright 2017 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as rbac from '../rbac';
import * as ip from 'ip';
import * as _ from 'lodash';

// keyMatch determines whether key1 matches the pattern of key2 (similar to RESTful path),
// key2 can contain a *.
// For example, '/foo/bar' matches '/foo/*'
function keyMatch(key1: string, key2: string): boolean {
  const pos: number = key2.indexOf('*');
  if (pos === -1) {
    return key1 === key2;
  }

  if (key1.length > pos) {
    return key1.slice(0, pos) === key2.slice(0, pos);
  }

  return key1 === key2.slice(0, pos);
}

// keyMatchFunc is the wrapper for keyMatch.
function keyMatchFunc(...args: any[]): boolean {
  const name1: string = _.toString(args[0]);
  const name2: string = _.toString(args[1]);

  return keyMatch(name1, name2);
}

// keyMatch2 determines whether key1 matches the pattern of key2 (similar to RESTful path),
// key2 can contain a *.
// For example, '/foo/bar' matches '/foo/*', '/resource1' matches '/:resource'
function keyMatch2(key1: string, key2: string): boolean {
  key2 = key2.replace(/\/\*/g, '/.*');

  const regexp: RegExp = new RegExp(/(.*):[^/]+(.*)/g);
  for (;;) {
    if (!_.includes(key2, '/:')) {
      break;
    }
    key2 = key2.replace(regexp, '$1[^/]+$2');
  }

  return regexMatch(key1, '^' + key2 + '$');
}

// keyMatch2Func is the wrapper for keyMatch2.
function keyMatch2Func(...args: any[]): boolean {
  const name1: string = _.toString(args[0]);
  const name2: string = _.toString(args[1]);

  return keyMatch2(name1, name2);
}

// keyMatch3 determines whether key1 matches the pattern of key2 (similar to RESTful path), key2 can contain a *.
// For example, '/foo/bar' matches '/foo/*', '/resource1' matches '/{resource}'
function keyMatch3(key1: string, key2: string): boolean {
  key2 = key2.replace(/\/\*/g, '/.*');

  const regexp: RegExp = new RegExp(/(.*){[^/]+}(.*)/g);
  for (;;) {
    if (!_.includes(key2, '/{')) {
      break;
    }
    key2 = key2.replace(regexp, '$1[^/]+$2');
  }

  return regexMatch(key1, key2);
}

// keyMatch3Func is the wrapper for keyMatch3.
function keyMatch3Func(...args: any[]): boolean {
  const name1: string = _.toString(args[0]);
  const name2: string = _.toString(args[1]);

  return keyMatch3(name1, name2);
}

// regexMatch determines whether key1 matches the pattern of key2 in regular expression.
function regexMatch(key1: string, key2: string): boolean {
  return new RegExp(key2).test(key1);
}

// regexMatchFunc is the wrapper for regexMatch.
function regexMatchFunc(...args: any[]): boolean {
  const name1: string = _.toString(args[0]);
  const name2: string = _.toString(args[1]);

  return regexMatch(name1, name2);
}

// ipMatch determines whether IP address ip1 matches the pattern of IP address ip2,
// ip2 can be an IP address or a CIDR pattern.
// For example, '192.168.2.123' matches '192.168.2.0/24'
function ipMatch(ip1: string, ip2: string): boolean {
  // check ip1
  if (!(ip.isV4Format(ip1) || ip.isV6Format(ip1))) {
    throw new Error(
      'invalid argument: ip1 in ipMatch() function is not an IP address.'
    );
  }
  // check ip2
  const cidrParts: string[] = ip2.split('/');
  if (cidrParts.length === 2) {
    return ip.cidrSubnet(ip2).contains(ip1);
  } else {
    if (!(ip.isV4Format(ip2) || ip.isV6Format(ip2))) {
      console.log(ip2);
      throw new Error(
        'invalid argument: ip2 in ipMatch() function is not an IP address.'
      );
    }
    return ip.isEqual(ip1, ip2);
  }
}

// ipMatchFunc is the wrapper for ipMatch.
function ipMatchFunc(...args: any[]): boolean {
  const ip1: string = _.toString(args[0]);
  const ip2: string = _.toString(args[1]);

  return ipMatch(ip1, ip2);
}

// generateGFunction is the factory method of the g(_, _) function.
function generateGFunction(rm: rbac.RoleManager): any {
  return function func(...args: any[]): boolean {
    const name1: string = _.toString(args[0]);
    const name2: string = _.toString(args[1]);

    if (!rm) {
      return name1 === name2;
    } else if (args.length === 2) {
      return rm.hasLink(name1, name2);
    } else {
      const domain: string = _.toString(args[2]);
      return rm.hasLink(name1, name2, domain);
    }
  };
}

export {
  keyMatchFunc,
  keyMatch2Func,
  keyMatch3Func,
  regexMatchFunc,
  ipMatchFunc,
  generateGFunction
};
