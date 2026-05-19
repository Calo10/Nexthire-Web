import { buildWhatsappMeUrl, sourcingWhatsAppPhoneFromEnv } from './sourcingWhatsAppApplyLink';

export function defaultWhatsappApplyMessage(jobCode: string): string {
  return `Quiero aplicar al job post ${jobCode}`;
}

export function buildPublicJobPostUrl(origin: string, orgSegment: string, jobId: string): string {
  const base = (origin || '').replace(/\/$/, '');
  const org = encodeURIComponent(orgSegment || '');
  const jid = encodeURIComponent(String(jobId).trim());
  return `${base}/org/${org}/jobs/${jid}`;
}

export function resolveSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  if (fromEnv && /^https?:\/\//i.test(fromEnv.trim())) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function buildWhatsappDestinationUrl(message: string): string {
  const phone = sourcingWhatsAppPhoneFromEnv();
  if (!phone || !message.trim()) return '';
  return buildWhatsappMeUrl(phone, message.trim());
}
