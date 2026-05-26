const MAPS_SCRIPT_ID = 'nexthire-google-maps-js';

let loadPromise: Promise<void> | null = null;

export function googleMapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : undefined;
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in the browser.'));
  }
  if (window.google?.maps) return Promise.resolve();

  const key = googleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured.'));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')));
      if (window.google?.maps) resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
