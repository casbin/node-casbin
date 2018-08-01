/**
 * JavaScript expression parsing and evaluation, safely.
 * code from https://github.com/donmccurdy/expression-eval
 * Powered by jsep.
 */
import * as jsep from 'jsep';

export class Valuate {
  /* tslint:disable */
  public binops: any = {
    '||'(a: any, b: any) {
      return a || b;
    },
    '&&'(a: any, b: any) {
      return a && b;
    },
    '|'(a: any, b: any) {
      return a | b;
    },
    '^'(a: any, b: any) {
      return a ^ b;
    },
    '&'(a: any, b: any) {
      return a & b;
    },
    '=='(a: any, b: any) {
      return a == b;
    },
    '!='(a: any, b: any) {
      return a != b;
    },
    '==='(a: any, b: any) {
      return a === b;
    },
    '!=='(a: any, b: any) {
      return a !== b;
    },
    '<'(a: any, b: any) {
      return a < b;
    },
    '>'(a: any, b: any) {
      return a > b;
    },
    '<='(a: any, b: any) {
      return a <= b;
    },
    '>='(a: any, b: any) {
      return a >= b;
    },
    '<<'(a: any, b: any) {
      return a << b;
    },
    '>>'(a: any, b: any) {
      return a >> b;
    },
    '>>>'(a: any, b: any) {
      return a >>> b;
    },
    '+'(a: any, b: any) {
      return a + b;
    },
    '-'(a: any, b: any) {
      return a - b;
    },
    '*'(a: any, b: any) {
      return a * b;
    },
    '/'(a: any, b: any) {
      return a / b;
    },
    '%'(a: any, b: any) {
      return a % b;
    }
  };

  public unops: any = {
    '-'(a: any) {
      return -a;
    },
    '+'(a: any) {
      return a;
    },
    '~'(a: any) {
      return ~a;
    },
    '!'(a: any) {
      return !a;
    }
  };

  public evaluateArray(list: any, context: object) {
    return list.map((v: any) => this.evaluate(v, context));
  }

  public evaluateMember(node: any, context: object) {
    const object: any = this.evaluate(node.object, context);
    if (node.computed) {
      return [object, object[this.evaluate(node.property, context)]];
    } else {
      return [object, object[node.property.name]];
    }
  }

  public evaluate(node: any, context?: any): any {
    if (!context) {
      context = {};
    }
    switch (node.type) {
      case 'ArrayExpression':
        return this.evaluateArray(node.elements, context);

      case 'BinaryExpression':
        return this.binops[node.operator](
          this.evaluate(node.left, context),
          this.evaluate(node.right, context)
        );

      case 'CallExpression':
        let caller, fn, assign;
        if (node.callee.type === 'MemberExpression') {
          assign = this.evaluateMember(node.callee, context);
          caller = assign[0];
          fn = assign[1];
        } else {
          fn = this.evaluate(node.callee, context);
        }
        if (typeof fn !== 'function') {
          return undefined;
        }
        return fn.apply(caller, this.evaluateArray(node.arguments, context));

      case 'ConditionalExpression':
        return this.evaluate(node.test, context)
          ? this.evaluate(node.consequent, context)
          : this.evaluate(node.alternate, context);

      case 'Identifier':
        return context[node.name];

      case 'Literal':
        return node.value;

      case 'LogicalExpression':
        return this.binops[node.operator](
          this.evaluate(node.left, context),
          this.evaluate(node.right, context)
        );

      case 'MemberExpression':
        return this.evaluateMember(node, context)[1];

      case 'ThisExpression':
        return context;

      case 'UnaryExpression':
        return this.unops[node.operator](this.evaluate(node.argument, context));

      default:
        return undefined;
    }
  }

  public compile(expression: any) {
    return this.evaluate.bind(null, jsep(expression));
  }

  public static parse(val: string | jsep.Expression): jsep.Expression {
    return jsep(val);
  }
}
