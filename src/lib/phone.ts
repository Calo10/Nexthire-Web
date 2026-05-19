type CountryMeta = {
  iso2: string; // e.g. "CR"
  callingCode: string; // digits only, e.g. "506"
};

// Minimal calling code → country mapping (extend as needed).
// Note: calling codes are NOT unique globally; for UI hinting this is good enough.
const CALLING_CODE_TO_COUNTRY: Record<string, CountryMeta> = {
  '1': { iso2: 'US', callingCode: '1' },
  '33': { iso2: 'FR', callingCode: '33' },
  '34': { iso2: 'ES', callingCode: '34' },
  '39': { iso2: 'IT', callingCode: '39' },
  '44': { iso2: 'GB', callingCode: '44' },
  '49': { iso2: 'DE', callingCode: '49' },
  '51': { iso2: 'PE', callingCode: '51' },
  '52': { iso2: 'MX', callingCode: '52' },
  '53': { iso2: 'CU', callingCode: '53' },
  '54': { iso2: 'AR', callingCode: '54' },
  '55': { iso2: 'BR', callingCode: '55' },
  '56': { iso2: 'CL', callingCode: '56' },
  '57': { iso2: 'CO', callingCode: '57' },
  '58': { iso2: 'VE', callingCode: '58' },
  '502': { iso2: 'GT', callingCode: '502' },
  '503': { iso2: 'SV', callingCode: '503' },
  '504': { iso2: 'HN', callingCode: '504' },
  '505': { iso2: 'NI', callingCode: '505' },
  '506': { iso2: 'CR', callingCode: '506' },
  '507': { iso2: 'PA', callingCode: '507' },
  '509': { iso2: 'HT', callingCode: '509' },
  '351': { iso2: 'PT', callingCode: '351' },
};

export function onlyDigits(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function chunkFromEnd(digits: string, chunkSizes: number[]): string[] {
  const out: string[] = [];
  let i = digits.length;
  let sizeIdx = 0;
  while (i > 0) {
    const size = chunkSizes[Math.min(sizeIdx, chunkSizes.length - 1)];
    const start = Math.max(0, i - size);
    out.unshift(digits.slice(start, i));
    i = start;
    sizeIdx++;
  }
  return out;
}

function formatNationalNumber(national: string, callingCode: string): string {
  const n = onlyDigits(national);
  if (!n) return '';

  // Costa Rica: 8 digits, format 4 4 (e.g., 8966 7186)
  if (callingCode === '506' && n.length === 8) {
    return `${n.slice(0, 4)} ${n.slice(4)}`;
  }

  // Common heuristics
  if (n.length === 10) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  if (n.length === 9) return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  if (n.length === 8) return `${n.slice(0, 4)} ${n.slice(4)}`;
  if (n.length === 7) return `${n.slice(0, 3)} ${n.slice(3)}`;

  // Fallback: chunk from end with 3s
  return chunkFromEnd(n, [3]).join(' ');
}

function findCallingCode(digits: string): CountryMeta | null {
  // Try longest match first (3, then 2, then 1)
  for (const len of [3, 2, 1]) {
    const code = digits.slice(0, len);
    if (CALLING_CODE_TO_COUNTRY[code]) return CALLING_CODE_TO_COUNTRY[code];
  }
  return null;
}

export function getCountryCallingCodeOptions(): { value: string; label: string }[] {
  const entries = Object.entries(CALLING_CODE_TO_COUNTRY)
    .map(([code, meta]) => {
      const flag = countryFlagEmoji(meta.iso2) || '';
      return { code, iso2: meta.iso2, label: `${flag} +${code}`.trim() };
    })
    // Prefer Central America first then rest by code
    .sort((a, b) => Number(a.code) - Number(b.code));

  // Ensure CR is near top (common for this product)
  const crIdx = entries.findIndex((e) => e.code === '506');
  if (crIdx > 0) {
    const [cr] = entries.splice(crIdx, 1);
    entries.unshift(cr);
  }

  return entries.map((e) => ({ value: e.code, label: e.label }));
}

export function splitE164Phone(raw: string | null | undefined): { callingCode: string; nationalNumber: string } {
  const input = (raw || '').trim();
  if (!input) return { callingCode: '506', nationalNumber: '' }; // default CR

  if (input.startsWith('+')) {
    const digits = onlyDigits(input);
    const meta = findCallingCode(digits);
    if (meta) {
      return {
        callingCode: meta.callingCode,
        nationalNumber: digits.slice(meta.callingCode.length),
      };
    }
    // Unknown: best-effort, keep first 1-3 as calling code
    return { callingCode: digits.slice(0, Math.min(3, digits.length)) || '506', nationalNumber: digits.slice(Math.min(3, digits.length)) };
  }

  // If user saved without +, treat as national number (default CR)
  return { callingCode: '506', nationalNumber: onlyDigits(input) };
}

export function toE164Phone(callingCode: string, nationalNumber: string): string {
  const cc = onlyDigits(callingCode);
  const nn = onlyDigits(nationalNumber);
  if (!cc || !nn) return '';
  return `+${cc}${nn}`;
}

export function countryFlagEmoji(iso2: string): string | null {
  const cc = (iso2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  // regional indicator symbols
  const A = 0x1f1e6;
  const codePoints = [...cc].map((ch) => A + (ch.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}

export function formatPhoneForDisplay(raw: string): { text: string; countryIso2?: string; flag?: string } {
  const input = (raw || '').trim();
  if (!input) return { text: '' };

  // Expecting E.164-ish inputs like +50689667186
  if (input.startsWith('+')) {
    const digits = onlyDigits(input);
    const meta = findCallingCode(digits);
    if (!meta) {
      // Unknown calling code; fallback to "+(digits...)"
      return { text: input };
    }
    const national = digits.slice(meta.callingCode.length);
    const nationalFmt = formatNationalNumber(national, meta.callingCode);
    const text = nationalFmt ? `+(${meta.callingCode}) ${nationalFmt}` : `+(${meta.callingCode})`;
    const flag = countryFlagEmoji(meta.iso2) || undefined;
    return { text, countryIso2: meta.iso2, flag };
  }

  // Fallback: keep as typed, but strip weird spacing lightly
  return { text: input };
}

