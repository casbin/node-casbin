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

import { getLogger, logPrint, Util as util } from '../src';
import { compile } from 'expression-eval';

test('test enableLog success', () => {
  getLogger().enableLog(true);
  expect(getLogger().isEnable()).toEqual(true);
  getLogger().enableLog(false);
  expect(getLogger().isEnable()).toEqual(false);
});

test('test enableLog failed', () => {
  getLogger().enableLog(true);
  expect(getLogger().isEnable()).not.toEqual(false);
  getLogger().enableLog(false);
  expect(getLogger().isEnable()).not.toEqual(true);
});

test('test logPrint', () => {
  getLogger().enableLog(true);
  expect(logPrint('test log')).toBeUndefined();
});

test('test Valuate', () => {
  expect(compile('1 + 1 === 2')({})).toEqual(true);
  expect(compile('1 + 1 !== 2')({})).toEqual(false);
});

test('test regexMatchFunc', () => {
  expect(util.regexMatchFunc('foobar', '^foo*')).toEqual(true);
  expect(util.regexMatchFunc('barfoo', '^foo*')).toEqual(false);
});

test('test keyMatchFunc', () => {
  expect(util.keyMatchFunc('/foo/bar', '/foo/*')).toEqual(true);
  expect(util.keyMatchFunc('/bar/foo', '/foo/*')).toEqual(false);
});

test('test keyGetFunc', () => {
  expect(util.keyGetFunc('/foo/bar', '/foo/*')).toEqual('bar');
  expect(util.keyGetFunc('/bar/foo', '/foo/*')).toEqual('');
});

test('test keyMatch2Func', () => {
  expect(util.keyMatch2Func('/foo/bar', '/foo/*')).toEqual(true);
  expect(util.keyMatch2Func('/foo/baz', '/foo/:bar')).toEqual(true);
  expect(util.keyMatch2Func('/foo/baz/foo', '/foo/:bar/foo')).toEqual(true);
  expect(util.keyMatch2Func('/baz', '/foo')).toEqual(false);
  expect(util.keyMatch2Func('/foo/baz', '/foo')).toEqual(false);
});

test('test keyGet2Func', () => {
  expect(util.keyGet2Func('/foo/bar', '/foo/*', 'bar')).toEqual('');
  expect(util.keyGet2Func('/foo/baz', '/foo/:bar', 'bar')).toEqual('baz');
  expect(util.keyGet2Func('/foo/baz/foo', '/foo/:bar/foo', 'bar')).toEqual('baz');
  expect(util.keyGet2Func('/baz', '/foo', 'bar')).toEqual('');
  expect(util.keyGet2Func('/foo/baz', '/foo', 'bar')).toEqual('');
});

test('test keyMatch3Func', () => {
  expect(util.keyMatch3Func('/foo/bar', '/foo/*')).toEqual(true);
  expect(util.keyMatch3Func('/foo/baz', '/foo/{bar}')).toEqual(true);
  expect(util.keyMatch3Func('/foo/baz/foo', '/foo/{bar}/foo')).toEqual(true);
  expect(util.keyMatch3Func('/baz', '/foo')).toEqual(false);
  expect(util.keyMatch3Func('/foo/baz', '/foo')).toEqual(false);
});

test('test keyMatch4Func', () => {
  expect(util.keyMatch4Func('/parent/123/child/123', '/parent/{id}/child/{id}')).toEqual(true);
  expect(util.keyMatch4Func('/parent/123/child/456', '/parent/{id}/child/{id}')).toEqual(false);

  expect(util.keyMatch4Func('/parent/123/child/123', '/parent/{id}/child/{another_id}')).toEqual(true);
  expect(util.keyMatch4Func('/parent/123/child/456', '/parent/{id}/child/{another_id}')).toEqual(true);

  expect(util.keyMatch4Func('/parent/123/child/123/book/123', '/parent/{id}/child/{id}/book/{id}')).toEqual(true);
  expect(util.keyMatch4Func('/parent/123/child/123/book/456', '/parent/{id}/child/{id}/book/{id}')).toEqual(false);
  expect(util.keyMatch4Func('/parent/123/child/456/book/123', '/parent/{id}/child/{id}/book/{id}')).toEqual(false);
  expect(util.keyMatch4Func('/parent/123/child/456/book/', '/parent/{id}/child/{id}/book/{id}')).toEqual(false);
  expect(util.keyMatch4Func('/parent/123/child/456', '/parent/{id}/child/{id}/book/{id}')).toEqual(false);
});

test('test ipMatchFunc', () => {
  expect(util.ipMatchFunc('::1', '::0:1')).toEqual(true);
  expect(util.ipMatchFunc('192.168.1.1', '192.168.1.1')).toEqual(true);
  expect(util.ipMatchFunc('127.0.0.1', '::ffff:127.0.0.1')).toEqual(true);
  expect(util.ipMatchFunc('192.168.2.123', '192.168.2.0/24')).toEqual(true);
  expect(util.ipMatchFunc('::1', '127.0.0.2')).toEqual(false);
  expect(() => util.ipMatchFunc('I am alice', '127.0.0.1')).toThrow(Error);
  expect(() => util.ipMatchFunc('127.0.0.1', 'I am alice')).toThrow(/invalid/g);
  expect(util.ipMatchFunc('192.168.2.189', '192.168.1.134/26')).toEqual(false);
});

test('test globMatch', () => {
  expect(util.globMatch('/foo', '/foo')).toEqual(true);
  expect(util.globMatch('/foo', '/foo*')).toEqual(true);
  expect(util.globMatch('/foo', '/foo/*')).toEqual(false);

  expect(util.globMatch('/foo', '/foo')).toEqual(true);
  expect(util.globMatch('/foo', '/foo*')).toEqual(true);
  expect(util.globMatch('/foo', '/foo/*')).toEqual(false);
  expect(util.globMatch('/foo/bar', '/foo')).toEqual(false);
  expect(util.globMatch('/foo/bar', '/foo*')).toEqual(false);
  expect(util.globMatch('/foo/bar', '/foo/*')).toEqual(true);
  expect(util.globMatch('/foobar', '/foo')).toEqual(false);
  expect(util.globMatch('/foobar', '/foo*')).toEqual(true);
  expect(util.globMatch('/foobar', '/foo/*')).toEqual(false);

  expect(util.globMatch('/foo', '*/foo')).toEqual(true);
  expect(util.globMatch('/foo', '*/foo*')).toEqual(true);
  expect(util.globMatch('/foo', '*/foo/*')).toEqual(false);
  expect(util.globMatch('/foo/bar', '*/foo')).toEqual(false);
  expect(util.globMatch('/foo/bar', '*/foo*')).toEqual(false);
  expect(util.globMatch('/foo/bar', '*/foo/*')).toEqual(true);
  expect(util.globMatch('/foobar', '*/foo')).toEqual(false);
  expect(util.globMatch('/foobar', '*/foo*')).toEqual(true);
  expect(util.globMatch('/foobar', '*/foo/*')).toEqual(false);

  expect(util.globMatch('/prefix/foo', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/foo', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/foo', '*/foo/*')).toEqual(false);
  expect(util.globMatch('/prefix/foo/bar', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/foo/bar', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/foo/bar', '*/foo/*')).toEqual(false);
  expect(util.globMatch('/prefix/foobar', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/foobar', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/foobar', '*/foo/*')).toEqual(false);

  expect(util.globMatch('/prefix/subprefix/foo', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foo', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foo', '*/foo/*')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foo/bar', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foo/bar', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foo/bar', '*/foo/*')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foobar', '*/foo')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foobar', '*/foo*')).toEqual(false);
  expect(util.globMatch('/prefix/subprefix/foobar', '*/foo/*')).toEqual(false);
});

test('test hasEval', () => {
  expect(util.hasEval('eval() && a && b && c')).toEqual(true);
  expect(util.hasEval('eval() && a && b && c')).toEqual(true);
  expect(util.hasEval('eval) && a && b && c')).toEqual(false);
  expect(util.hasEval('eval)( && a && b && c')).toEqual(false);
  expect(util.hasEval('xeval() && a && b && c')).toEqual(false);
  expect(util.hasEval('eval(c * (a + b)) && a && b && c')).toEqual(true);
});

test('test replaceEval', () => {
  expect(util.replaceEval('eval() && a && b && c', '', 'a')).toEqual('(a) && a && b && c');
  expect(util.replaceEval('eval() && a && b && c', '', '(a)')).toEqual('((a)) && a && b && c');
  expect(util.replaceEval('eval(p_some_rule) && c', 'p_some_rule', '(a)')).toEqual('((a)) && c');
  expect(util.replaceEval('eval(p_some_rule) && eval(p_some_other_rule) && c', 'p_some_rule', '(a)')).toEqual(
    '((a)) && eval(p_some_other_rule) && c'
  );
});

test('test getEvalValue', () => {
  expect(util.arrayEquals(util.getEvalValue('eval(a) && a && b && c'), ['a']));
  expect(util.arrayEquals(util.getEvalValue('a && eval(a) && b && c'), ['a']));
  expect(util.arrayEquals(util.getEvalValue('eval(a) && eval(b) && a && b && c'), ['a', 'b']));
  expect(util.arrayEquals(util.getEvalValue('a && eval(a) && eval(b) && b && c'), ['a', 'b']));
});

test('bracketCompatible', () => {
  expect(util.bracketCompatible("g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.obj in ('data2', 'data3')")).toEqual(
    "g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.obj in ['data2', 'data3']"
  );
  expect(
    util.bracketCompatible(
      "g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.obj in ('data2', 'data3') || r.obj in ('data4', 'data5')"
    )
  ).toEqual("g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act || r.obj in ['data2', 'data3'] || r.obj in ['data4', 'data5']");
});
