import { Model } from '../model';

export class Helper {
  public static loadPolicyLine(line: string, model: Model): void {
    if (!line || line.trimStart().charAt(0) === '#') {
      return;
    }

    let tokens: any = undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const parse = require('csv-parse/lib/sync');
      tokens = parse(line, {
        delimiter: ',',
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new Error('Please add csv-parse to your dependency.');
    }

    if (!tokens || !tokens[0]) {
      return;
    }

    const key = tokens[0][0];
    const sec = key.substring(0, 1);
    const item = model.model.get(sec);
    if (!item) {
      return;
    }

    const policy = item.get(key);
    if (!policy) {
      return;
    }
    policy.policy.push(tokens[0].slice(1));
  }
}
