import { EMPLOYEE_IMPORT_COLUMNS } from '../models/employee';

/** Minimal RFC 4180 parser (quotes, escaped quotes, CRLF) used only for the import preview. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endRow = () => {
    row.push(field);
    field = '';
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      endRow();
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) endRow();
  return rows;
}

const normalizeHeader = (h: string) => h.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export type CsvPreview = {
  headers: string[];
  rows: string[][];
  totalRows: number;
  missingRequired: string[];
  unknownColumns: string[];
};

export function buildCsvPreview(text: string, maxRows = 5): CsvPreview {
  const all = parseCsv(text);
  const headers = (all[0] ?? []).map((h) => h.trim());
  const known = new Map(EMPLOYEE_IMPORT_COLUMNS.map((c) => [normalizeHeader(c), c]));
  const present = new Set(headers.map(normalizeHeader));
  const missingRequired = ['FirstName', 'LastName'].filter((c) => !present.has(normalizeHeader(c)));
  const unknownColumns = headers.filter((h) => h && !known.has(normalizeHeader(h)));
  return {
    headers,
    rows: all.slice(1, 1 + maxRows),
    totalRows: Math.max(0, all.length - 1),
    missingRequired,
    unknownColumns,
  };
}

/** Header-only CSV template with the columns the API accepts. */
export function importTemplateCsv(): string {
  return `\uFEFF${EMPLOYEE_IMPORT_COLUMNS.join(',')}\r\n`;
}
