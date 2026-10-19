import * as XLSX from 'xlsx';

export type ExcelCell = string | number | null;

export function exportFileName(prefix: string): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.xlsx`;
}

export function formatExportDate(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function downloadExcel(filename: string, sheetName: string, headers: string[], rows: ExcelCell[][]): void {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet['!cols'] = headers.map((header, index) => {
    const longest = rows.reduce((max, row) => Math.max(max, String(row[index] ?? '').length), header.length);
    return { wch: Math.min(42, Math.max(12, longest + 2)) };
  });
  const book = XLSX.utils.book_new();
  const safeName = sheetName.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet1';
  XLSX.utils.book_append_sheet(book, sheet, safeName);
  XLSX.writeFile(book, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
