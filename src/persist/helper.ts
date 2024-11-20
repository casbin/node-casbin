import { Model } from '../model';
import { parse } from 'csv-parse/sync';

export class Helper {
  public static loadPolicyLine(line: string, model: Model): void {
    if (!line || line.trimStart().charAt(0) === '#') {
      return;
    }

    const rawTokens = parse(line, {
      delimiter: ',',
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    if (!rawTokens || rawTokens.length === 0 || !rawTokens[0]) {
      return;
    }

    const tokens: string[] = rawTokens[0];

    const processedTokens: string[] = [];
    let currentToken = '';
    let bracketCount = 0;

    for (const token of tokens) {
      for (const char of token) {
        if (char === '(') {
          bracketCount++;
        } else if (char === ')') {
          bracketCount--;
        }
      }

      currentToken += (currentToken ? ',' : '') + token;

      if (bracketCount === 0) {
        processedTokens.push(currentToken);
        currentToken = '';
      }
    }

    if (bracketCount !== 0) {
      throw new Error(`Unmatched brackets in policy line: ${line}`);
    }

    if (processedTokens.length === 0) {
      return;
    }

    let key = processedTokens[0].trim();
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

    const values = processedTokens.slice(1).map((v) => {
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1);
      }
      return v.replace(/""/g, '"').trim();
    });

    policy.policy.push(values);
  }
}
