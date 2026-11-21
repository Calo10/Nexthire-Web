/**
 * Parse/serialize helpers for flow.branch `configuration.condition`.
 * Matches LeadSphereBranchActivity: Variable Op Value
 */

export const BRANCH_OPERATORS = ['==', '!=', '>', '>=', '<', '<='] as const;

export type BranchOperator = (typeof BRANCH_OPERATORS)[number];

export type ExpressionValueKind = 'string' | 'number' | 'boolean' | 'unknown';

export type ParsedBranchExpression = {
  variable: string;
  operator: BranchOperator;
  /** Raw UI value (unquoted for strings). */
  value: string;
  valueKind: ExpressionValueKind;
};

/** Same shape as LeadSphereBranchActivity.ConditionRegex. */
const CONDITION_REGEX =
  /^\s*(?<left>[A-Za-z_][A-Za-z0-9_.]*)\s*(?<op>==|!=|>=|<=|>|<)\s*(?<right>.+?)\s*$/;

export function isBranchOperator(value: string): value is BranchOperator {
  return (BRANCH_OPERATORS as readonly string[]).includes(value);
}

export function parseLiteralRight(raw: string): {
  value: string;
  valueKind: ExpressionValueKind;
} {
  const trimmed = raw.trim();

  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return {
      value: unescapeQuoted(trimmed.slice(1, -1), trimmed[0]),
      valueKind: 'string',
    };
  }

  if (/^(true|false)$/i.test(trimmed)) {
    return {
      value: trimmed.toLowerCase() === 'true' ? 'true' : 'false',
      valueKind: 'boolean',
    };
  }

  if (trimmed !== '' && Number.isFinite(Number(trimmed)) && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return { value: trimmed, valueKind: 'number' };
  }

  // Bare word — backend treats as string literal
  return { value: trimmed, valueKind: 'string' };
}

function unescapeQuoted(inner: string, quote: string): string {
  let result = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '\\' && i + 1 < inner.length) {
      const next = inner[i + 1];
      if (next === '\\' || next === quote) {
        result += next;
        i += 1;
        continue;
      }
    }
    result += ch;
  }
  return result;
}

function quoteStringLiteral(value: string): string {
  const useSingle = value.includes('"') && !value.includes("'");
  const quote = useSingle ? "'" : '"';
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(new RegExp(quote, 'g'), `\\${quote}`);
  return `${quote}${escaped}${quote}`;
}

/**
 * Parse a condition string into visual parts.
 * Returns null when the expression is not a simple Variable Op Value.
 */
export function parseBranchCondition(
  condition: string | null | undefined,
): ParsedBranchExpression | null {
  if (condition == null) return null;
  const trimmed = condition.trim();
  if (!trimmed) return null;

  const match = CONDITION_REGEX.exec(trimmed);
  if (!match?.groups) return null;

  const variable = match.groups.left;
  const op = match.groups.op;
  const rightRaw = match.groups.right.trim();

  if (!isBranchOperator(op)) return null;

  const { value, valueKind } = parseLiteralRight(rightRaw);
  return { variable, operator: op, value, valueKind };
}

export function serializeBranchCondition(parts: {
  variable: string;
  operator: BranchOperator;
  value: string;
  valueKind: ExpressionValueKind;
}): string {
  const variable = parts.variable.trim();
  const right = serializeLiteral(parts.value, parts.valueKind);
  return `${variable} ${parts.operator} ${right}`;
}

export function serializeLiteral(value: string, valueKind: ExpressionValueKind): string {
  switch (valueKind) {
    case 'number': {
      const trimmed = value.trim();
      if (trimmed === '' || !Number.isFinite(Number(trimmed))) return trimmed;
      return trimmed;
    }
    case 'boolean':
      return value.trim().toLowerCase() === 'true' ? 'true' : 'false';
    case 'string':
      return quoteStringLiteral(value);
    case 'unknown':
    default: {
      const trimmed = value.trim();
      if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase();
      if (trimmed !== '' && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return trimmed;
      return quoteStringLiteral(value);
    }
  }
}

export function isCompleteBranchExpression(parts: {
  variable: string;
  operator: string;
  value: string;
  valueKind: ExpressionValueKind;
}): boolean {
  if (!parts.variable.trim()) return false;
  if (!isBranchOperator(parts.operator)) return false;
  if (parts.valueKind === 'number' && parts.value.trim() === '') return false;
  if (parts.valueKind === 'boolean' && !/^(true|false)$/i.test(parts.value.trim())) {
    return false;
  }
  // string / unknown: empty string is a valid literal ("")
  return true;
}

export function mapVariableTypeToValueKind(
  type: string | undefined | null,
): ExpressionValueKind {
  switch ((type ?? '').toLowerCase()) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'unknown';
  }
}

/** Short summary for canvas nodes. */
export function conditionSummary(
  condition: string | null | undefined,
  maxLength = 42,
): string | null {
  if (!condition?.trim()) return null;
  const text = condition.trim().replace(/\s+/g, ' ');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
