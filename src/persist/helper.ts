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

      if (char === '(') {
        bracketCount++;
      } else if (char === ')') {
        bracketCount--;
      }

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
        currentToken += char;
        continue;
      }

      if (char === ',' && !inQuotes && bracketCount === 0) {
        if (currentToken) {
          tokens.push(currentToken.trim());
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }

    if (bracketCount !== 0) {
      throw new Error(`Unmatched brackets in policy line: ${line}`);
    }

    if (currentToken) {
      tokens.push(currentToken.trim());
    }

    if (!tokens || tokens.length === 0) {
      return;
    }

    let key = tokens[0].trim();
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1);
    }

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
      v = v.trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      return v.replace(/""/g, '"').trim();
    });

    policy.policy.push(values);
  }
}
