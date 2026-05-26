import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { googleMapsApiKey, loadGoogleMaps } from '../../../lib/googleMapsLoader';
import { buildMetaGeoResolveQueries, resolveMetaGeoBestMatch } from '../../../lib/metaGeoResolve';
import type { MetaGeoSelection } from '../../../types/metaCampaign';
import {
  clampMetaGeoRadiusMiles,
  META_GEO_RADIUS_MI_DEFAULT,
  META_GEO_RADIUS_MI_MAX,
  META_GEO_RADIUS_MI_MIN,
  applyRadiusToSelection,
  selectionFromGeoResolve,
} from '../../../types/metaCampaign';

const DEFAULT_CENTER = { lat: 25.7617, lng: -80.1918 };
const DEFAULT_ZOOM = 10;
const METERS_PER_MILE = 1609.34;

interface Props {
  value: MetaGeoSelection | null;
  onChange: (v: MetaGeoSelection | null) => void;
  countryCode?: string;
  error?: string;
}

type ResolveInput = {
  lat: number;
  lng: number;
  formatted?: string;
  addressComponents?: google.maps.GeocoderAddressComponent[];
};

function countryFromComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  fallback: string
): string {
  const cc = components?.find((c) => c.types.includes('country'))?.short_name;
  return (cc || fallback).toUpperCase();
}

function reverseGeocodeResults(lat: number, lng: number): Promise<
  Array<{ formatted: string; addressComponents?: google.maps.GeocoderAddressComponent[] }>
> {
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.length) {
        resolve(
          results
            .filter((r) => r.formatted_address)
            .map((r) => ({
              formatted: r.formatted_address,
              addressComponents: r.address_components,
            }))
        );
        return;
      }
      reject(new Error(status || 'GEOCODER_FAILED'));
    });
  });
}

function queriesFromResolveInput(input: ResolveInput): string[] {
  if (input.formatted?.trim()) {
    return buildMetaGeoResolveQueries(input.formatted, input.addressComponents);
  }
  return [];
}

async function queriesFromLatLng(lat: number, lng: number): Promise<string[]> {
  const rows = await reverseGeocodeResults(lat, lng);
  const all: string[] = [];
  for (const row of rows.slice(0, 4)) {
    all.push(...buildMetaGeoResolveQueries(row.formatted, row.addressComponents));
  }
  return [...new Set(all)];
}

export default function MetaGeoLocationPicker({ value, onChange, countryCode = 'US', error }: Props) {
  const { t } = useTranslation();
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const resolveLocationRef = useRef<(input: ResolveInput, fromMap?: boolean) => Promise<void>>(async () => {});
  const resolveDebounceRef = useRef<number | null>(null);
  const scheduleResolveRef = useRef<(input: ResolveInput, fromMap: boolean) => void>(() => {});
  const radiusMilesRef = useRef(META_GEO_RADIUS_MI_DEFAULT);

  const [mapReady, setMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(META_GEO_RADIUS_MI_DEFAULT);

  useEffect(() => {
    radiusMilesRef.current = radiusMiles;
  }, [radiusMiles]);

  useEffect(() => {
    if (!value) return;
    const raw =
      value.radiusMiles ?? value.geoLocations.cities?.[0]?.radius ?? META_GEO_RADIUS_MI_DEFAULT;
    const r = clampMetaGeoRadiusMiles(raw);
    setRadiusMiles(r);
    radiusMilesRef.current = r;
    if (circleRef.current) {
      circleRef.current.setRadius(r * METERS_PER_MILE);
    }
    const cityRadius = value.geoLocations.cities?.[0]?.radius;
    if (value.radiusMiles !== r || cityRadius !== r) {
      onChange(applyRadiusToSelection(value, r));
    }
  }, [value, onChange]);

  const updateCircleRadius = useCallback((miles: number) => {
    if (circleRef.current) {
      circleRef.current.setRadius(miles * METERS_PER_MILE);
    }
  }, []);

  const handleRadiusChange = useCallback(
    (miles: number) => {
      const clamped = clampMetaGeoRadiusMiles(miles);
      setRadiusMiles(clamped);
      updateCircleRadius(clamped);
      if (value) {
        onChange(applyRadiusToSelection(value, clamped));
      }
    },
    [onChange, updateCircleRadius, value]
  );

  const placeMarker = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const pos = { lat, lng };
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position: pos,
        draggable: true,
      });
      markerRef.current.addListener('dragend', () => {
        const p = markerRef.current?.getPosition();
        if (p) scheduleResolveRef.current({ lat: p.lat(), lng: p.lng() }, true);
      });
    } else {
      markerRef.current.setPosition(pos);
    }
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: pos,
        radius: radiusMilesRef.current * METERS_PER_MILE,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        strokeColor: '#059669',
        strokeOpacity: 0.8,
        strokeWeight: 2,
      });
    } else {
      circleRef.current.setCenter(pos);
      circleRef.current.setRadius(radiusMilesRef.current * METERS_PER_MILE);
    }
    map.panTo(pos);
  }, []);

  const resolveLocation = useCallback(
    async (input: ResolveInput, fromMap = false) => {
      const { lat, lng, addressComponents } = input;
      setResolving(true);
      setResolveError(null);
      placeMarker(lat, lng);

      try {
        let queries = queriesFromResolveInput(input);
        let components = addressComponents;

        if (!queries.length) {
          try {
            queries = await queriesFromLatLng(lat, lng);
            if (queries.length) {
              // use country from first geocode pass when possible
              const rows = await reverseGeocodeResults(lat, lng);
              components = rows[0]?.addressComponents;
            }
          } catch (geoStatus: unknown) {
            const status = geoStatus instanceof Error ? geoStatus.message : String(geoStatus);
            if (status === 'REQUEST_DENIED') {
              throw new Error(t('metaCampaign.geo.geocodingApiDisabled'));
            }
            throw new Error(t('metaCampaign.geo.geocodeFailed'));
          }
        }

        const cc = countryFromComponents(components, countryCode);
        const match = await resolveMetaGeoBestMatch(queries, cc);

        if (!match) {
          setResolveError(fromMap ? t('metaCampaign.geo.noMatchMap') : t('metaCampaign.geo.noMatch'));
          return;
        }

        const label = match.candidate.name || match.query;
        const sel = applyRadiusToSelection(selectionFromGeoResolve(match.candidate, label), radiusMilesRef.current);
        const resolvedCountry = (match.candidate.countryCode || cc || 'US').trim().toUpperCase();
        onChange({ ...sel, countryCode: resolvedCountry });
        setRadiusMiles(sel.radiusMiles ?? META_GEO_RADIUS_MI_DEFAULT);
        if (searchRef.current) searchRef.current.value = label;
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : t('metaCampaign.geo.searchFailed');
        setResolveError(msg);
      } finally {
        setResolving(false);
      }
    },
    [countryCode, onChange, placeMarker, t]
  );

  const scheduleResolve = useCallback((input: ResolveInput, fromMap: boolean) => {
    if (resolveDebounceRef.current) window.clearTimeout(resolveDebounceRef.current);
    resolveDebounceRef.current = window.setTimeout(() => {
      void resolveLocationRef.current(input, fromMap);
    }, fromMap ? 500 : 0);
  }, []);

  useEffect(() => {
    resolveLocationRef.current = resolveLocation;
    scheduleResolveRef.current = scheduleResolve;
  }, [resolveLocation, scheduleResolve]);

  useEffect(() => {
    const key = googleMapsApiKey();
    if (!key) {
      setMapLoadError(t('metaCampaign.geo.missingApiKey'));
      return;
    }

    let cancelled = false;

    void loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;

        const map = new google.maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        clickListenerRef.current = map.addListener('click', (e) => {
          const ll = e.latLng;
          if (!ll) return;
          scheduleResolve({ lat: ll.lat(), lng: ll.lng() }, true);
        });

        if (searchRef.current) {
          const ac = new google.maps.places.Autocomplete(searchRef.current, {
            types: ['(cities)'],
            fields: ['geometry', 'formatted_address', 'address_components', 'name'],
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const loc = place.geometry?.location;
            if (!loc) {
              setResolveError(t('metaCampaign.geo.pickFromList'));
              return;
            }
            const formatted =
              place.formatted_address?.trim() ||
              place.name?.trim() ||
              searchRef.current?.value.trim() ||
              '';
            if (!formatted) {
              setResolveError(t('metaCampaign.geo.pickFromList'));
              return;
            }
            void resolveLocationRef.current(
              {
                lat: loc.lat(),
                lng: loc.lng(),
                formatted,
                addressComponents: place.address_components,
              },
              false
            );
          });
          autocompleteRef.current = ac;
        }

        setMapReady(true);
        setMapLoadError(null);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : t('metaCampaign.geo.mapLoadFailed');
        setMapLoadError(msg);
      });

    return () => {
      cancelled = true;
      if (resolveDebounceRef.current) window.clearTimeout(resolveDebounceRef.current);
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      mapRef.current = null;
      autocompleteRef.current = null;
    };
  }, [t]);

  useEffect(() => {
    if (!mapReady || !value?.label || markerRef.current) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: value.label }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) return;
      const loc = results[0].geometry.location;
      placeMarker(loc.lat(), loc.lng());
    });
  }, [mapReady, value?.label, placeMarker]);

  const clear = () => {
    onChange(null);
    setResolveError(null);
    markerRef.current?.setMap(null);
    markerRef.current = null;
    circleRef.current?.setMap(null);
    circleRef.current = null;
    if (searchRef.current) searchRef.current.value = '';
  };

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-gray-700">{t('metaCampaign.geo.label')}</label>
      <p className="text-xs text-gray-500">{t('metaCampaign.geo.mapHint')}</p>

      {mapLoadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{mapLoadError}</div>
      ) : (
        <>
          <input
            ref={searchRef}
            type="text"
            placeholder={t('metaCampaign.geo.searchPlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="off"
          />
          <div
            ref={mapDivRef}
            className="w-full h-56 md:h-64 rounded-xl border border-gray-200 overflow-hidden bg-gray-100"
            role="application"
            aria-label={t('metaCampaign.geo.mapAria')}
          />
          {resolving ? <p className="text-xs text-gray-500">{t('metaCampaign.geo.resolving')}</p> : null}
        </>
      )}

      {value ? (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-emerald-900">
              {t('metaCampaign.geo.selectedHint', { label: value.label })}
            </p>
            <button type="button" onClick={clear} className="text-xs font-medium text-gray-600 hover:text-gray-900 shrink-0">
              {t('metaCampaign.geo.clear')}
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label htmlFor="meta-geo-radius" className="text-sm font-medium text-gray-800">
                {t('metaCampaign.geo.radiusLabel')}
              </label>
              <span className="text-sm font-semibold text-emerald-800 tabular-nums">
                {radiusMiles} {t('metaCampaign.geo.radiusUnit')}
              </span>
            </div>
            <input
              id="meta-geo-radius"
              type="range"
              min={META_GEO_RADIUS_MI_MIN}
              max={META_GEO_RADIUS_MI_MAX}
              step={1}
              value={radiusMiles}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('metaCampaign.geo.radiusRange', { min: META_GEO_RADIUS_MI_MIN, max: META_GEO_RADIUS_MI_MAX })}
            </p>
          </div>
        </div>
      ) : null}

      {resolveError ? <p className="text-sm text-red-600">{resolveError}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
