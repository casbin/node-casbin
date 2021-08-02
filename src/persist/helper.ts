import { Model } from '../model';
import { policyStringToArray } from '../util';

export class Helper {
  public static loadPolicyLine(line: string, model: Model): void {
    if (!line || line.trimStart().charAt(0) === '#') {
      return;
    }

    const tokens = policyStringToArray(line);

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
