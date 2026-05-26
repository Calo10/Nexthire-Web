import { resolveMetaGeo } from '../api/metaCampaignApi';
import type { MetaGeoResolveCandidate } from '../types/metaCampaign';

function pickComponentName(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  types: string[]
): string | undefined {
  const hit = components?.find((c) => types.some((t) => c.types.includes(t)));
  return hit?.long_name?.trim() || hit?.short_name?.trim() || undefined;
}

/** Build several query strings (most specific first) for Meta geo/resolve. */
export function buildMetaGeoResolveQueries(
  formatted: string,
  components?: google.maps.GeocoderAddressComponent[]
): string[] {
  const out: string[] = [];
  const locality = pickComponentName(components, [
    'locality',
    'postal_town',
    'administrative_area_level_2',
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
  ]);
  const region = pickComponentName(components, ['administrative_area_level_1']);
  const country = pickComponentName(components, ['country']);

  if (locality && region && country) out.push(`${locality}, ${region}, ${country}`);
  if (locality && country) out.push(`${locality}, ${country}`);
  if (locality && region) out.push(`${locality}, ${region}`);
  if (region && country) out.push(`${region}, ${country}`);
  if (locality) out.push(locality);
  if (region) out.push(region);
  if (formatted.trim()) out.push(formatted.trim());

  return [...new Set(out)];
}

export async function resolveMetaGeoBestMatch(
  queries: string[],
  countryCode: string
): Promise<{ candidate: MetaGeoResolveCandidate; query: string } | null> {
  const unique = [...new Set(queries.map((q) => q.trim()).filter(Boolean))];
  for (const query of unique) {
    try {
      const res = await resolveMetaGeo({
        query,
        countryCode,
        locationTypes: ['city', 'region'],
        limit: 10,
      });
      const candidate = res.best ?? res.candidates[0];
      if (candidate?.key) return { candidate, query };
    } catch {
      // try next query variant
    }
  }
  return null;
}
