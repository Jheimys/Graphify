
import { create, all } from 'mathjs';

const math = create(all);

export const evaluateExpression = (expression: string, x: number): number | null => {
  try {
    // Basic sanitization: allow only typical math chars
    // Replace y = if present
    const cleanExpr = expression.replace(/^y\s*=\s*/, '').trim();
    const compiled = math.compile(cleanExpr);
    const scope = { x };
    const result = compiled.evaluate(scope);
    return typeof result === 'number' ? result : null;
  } catch (e) {
    return null;
  }
};

export const isValidExpression = (expression: string): boolean => {
  try {
    const cleanExpr = expression.replace(/^y\s*=\s*/, '').trim();
    math.parse(cleanExpr);
    return true;
  } catch {
    return false;
  }
};
