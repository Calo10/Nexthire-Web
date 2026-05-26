/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** E.164-style number for wa.me (digits only ok), e.g. 14155238886 */
  readonly VITE_SOURCING_WHATSAPP_PHONE?: string;
  /** Public site origin for job post links, e.g. https://app.example.com */
  readonly VITE_PUBLIC_APP_URL?: string;
  /** Google Maps JavaScript API key (Maps + Places) for Meta campaign location picker */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

