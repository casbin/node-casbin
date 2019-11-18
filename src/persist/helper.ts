import { Model } from '../model';

export class Helper {
  public static loadPolicyLine(line: string, model: Model): void {
    if (!line || line.trim() === '' || line.charAt(0) === '#') {
      return;
    }

    const tokens = line.split(',').map(n => n.trim());
    const key = tokens[0];
    const sec = key.substring(0, 1);
    const item = model.model.get(sec);
    if (!item) {
      return;
    }

    const policy = item.get(key);
    if (!policy) {
      return;
    }
    policy.policy.push(tokens.slice(1));
  }
}
