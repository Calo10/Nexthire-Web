/** Minimal Google Maps JS API types for Meta geo picker (full types: @types/google.maps). */
declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  interface MapOptions {
    center?: LatLng | { lat: number; lng: number };
    zoom?: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
    setCenter(center: LatLng | { lat: number; lng: number }): void;
    setZoom(zoom: number): void;
    panTo(center: LatLng | { lat: number; lng: number }): void;
    addListener(event: string, handler: (e: MapMouseEvent) => void): MapsEventListener;
  }

  interface MapMouseEvent {
    latLng: LatLng | null;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface MarkerOptions {
    map?: Map | null;
    position?: LatLng | { lat: number; lng: number };
    draggable?: boolean;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(pos: LatLng | { lat: number; lng: number }): void;
    getPosition(): LatLng | null | undefined;
    addListener(event: string, handler: () => void): MapsEventListener;
  }

  interface CircleOptions {
    map?: Map | null;
    center?: LatLng | { lat: number; lng: number };
    radius?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }

  class Circle {
    constructor(opts?: CircleOptions);
    setMap(map: Map | null): void;
    setCenter(center: LatLng | { lat: number; lng: number }): void;
    setRadius(radius: number): void;
  }

  interface GeocoderRequest {
    location?: { lat: number; lng: number };
    address?: string;
  }

  interface GeocoderAddressComponent {
    short_name: string;
    long_name: string;
    types: string[];
  }

  interface GeocoderResult {
    formatted_address: string;
    address_components?: GeocoderAddressComponent[];
    geometry: { location: LatLng };
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[] | null, status: string) => void
    ): void;
  }

  namespace places {
    interface AutocompleteOptions {
      types?: string[];
      fields?: string[];
    }

    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(event: string, handler: () => void): MapsEventListener;
      getPlace(): {
        formatted_address?: string;
        name?: string;
        geometry?: { location?: LatLng };
        address_components?: GeocoderAddressComponent[];
      };
    }
  }
}

declare const google: {
  maps: typeof google.maps;
};
