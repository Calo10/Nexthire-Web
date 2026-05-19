/** Digits only — wa.me expects country code without + or spaces. */
export function sourcingWhatsAppDigits(raw: string | undefined | null): string {
  if (raw == null || raw === '') return '';
  return String(raw).replace(/\D/g, '');
}

export function sourcingWhatsAppPhoneFromEnv(): string {
  return sourcingWhatsAppDigits(import.meta.env.VITE_SOURCING_WHATSAPP_PHONE);
}

/** Plain job id (UUID or numeric) embedded in the WhatsApp prefill — no prefix letter. */
export function jobPostRef(jobId: string | number): string {
  return String(jobId).trim();
}

export function buildWhatsappMeUrl(phoneDigits: string, message: string): string {
  const d = sourcingWhatsAppDigits(phoneDigits);
  if (!d || !message) return '';
  return `https://wa.me/${d}?text=${encodeURIComponent(message)}`;
}

/**
 * Recover job id from a saved wa.me URL when the API omits `jobId`.
 * Supports "job post {id}" and legacy "job post N{id}".
 */
export function parseJobIdFromWhatsappLandingUrl(url: string): string {
  const raw = (url || '').trim();
  if (!raw.includes('wa.me')) return '';
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw.replace(/^\/\//, '')}`);
    const text = u.searchParams.get('text');
    if (!text) return '';
    const decoded = decodeURIComponent(text.replace(/\+/g, ' '));
    const m = decoded.match(/job\s+post\s+N?([a-z0-9-]+|\d+)/i);
    if (m?.[1]) return m[1].trim();
    const legacy = decoded.match(/\bN([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|[0-9]+)\b/i);
    if (legacy?.[1]) return legacy[1].trim();
  } catch {
    /* ignore */
  }
  return '';
}

/** Title from auto-generated campaign name: "WhatsApp — {job title}" */
export function parseJobTitleFromWhatsappAutoName(name: string): string | null {
  const s = (name || '').trim();
  if (!s) return null;
  const m = s.match(/^WhatsApp\s*[—–-]\s*(.+)$/i);
  if (m?.[1]) return m[1].trim();
  return null;
}
