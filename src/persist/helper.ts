import { Model } from '../model';

export class Helper {
  public static loadPolicyLine(line: string, model: Model): void {
    if (!line || line.trimStart().charAt(0) === '#') {
      return;
    }

    const tokens: string[] = [];
    let currentToken = '';
    let inQuotes = false;
    let bracketCount = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === '(' && !inQuotes) {
        bracketCount++;
      } else if (char === ')' && !inQuotes) {
        bracketCount--;
      }

      if (char === ',' && !inQuotes && bracketCount === 0) {
        tokens.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }

    if (currentToken) {
      tokens.push(currentToken.trim());
    }

    if (!tokens || tokens.length === 0) {
      return;
    }

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

    const values = tokens.slice(1).map((v) => {
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      return v.replace(/""/g, '"');
    });

    policy.policy.push(values);
  }
}
