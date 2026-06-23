/**
 * api/weather-grid.ts
 *
 * Vercel Edge Function (also runs via Vite SSR middleware locally).
 * Route: GET /api/weather-grid?layer={layerId}
 *
 * Returns a GeoJSON FeatureCollection where every feature is an India-grid
 * point with properties t0..t60 (61 steps, 6 h apart).
 *   t0  = 5 days ago
 *   t20 = now          ← NOW_STEP = PAST_DAYS × STEPS_PER_DAY = 5×4 = 20
 *   t60 = 10 days from now
 *
 * Open-Meteo supports multi-location in one request:
 *   ?latitude=lat1,lat2,...&longitude=lon1,lon2,...
 * We chunk the India grid into batches of BATCH_SIZE to stay within URL limits.
 */

// ─── constants (kept inline so this file is self-contained on the edge) ─────

const PAST_DAYS   = 5;
const FUTURE_DAYS = 10;
const STEPS_PER_DAY = 4;           // one step every 6 h
const TOTAL_STEPS  = (PAST_DAYS + FUTURE_DAYS) * STEPS_PER_DAY + 1; // 61
const NOW_STEP     = PAST_DAYS * STEPS_PER_DAY;                       // 20
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_HOUR_MS  =     60 * 60 * 1000;

const INDIA_BOUNDS = { minLng: 68, maxLng: 97.5, minLat: 7, maxLat: 36 };
const GRID_STEP    = 1.5;   // degrees — gives ~440 points
const BATCH_SIZE   = 500;   // max locations per Open-Meteo request (up to 1000 supported by Open-Meteo API)

// ─── Open-Meteo variable names per layer ─────────────────────────────────────

type LayerId = 'temperature' | 'rainfall' | 'humidity' | 'aqi' | 'heatwave';

interface LayerConfig {
  variable : string;
  endpoint : 'forecast' | 'air-quality';
  /** Post-process a raw value (e.g. clamp negatives for rainfall). */
  transform?: (v: number) => number;
}

const LAYER_CONFIG: Record<LayerId, LayerConfig> = {
  temperature : { variable: 'temperature_2m',       endpoint: 'forecast'     },
  rainfall    : { variable: 'precipitation',         endpoint: 'forecast',    transform: v => Math.max(0, v) },
  humidity    : { variable: 'relative_humidity_2m',  endpoint: 'forecast'     },
  heatwave    : { variable: 'temperature_2m',        endpoint: 'forecast'     },
  aqi         : { variable: 'us_aqi',                endpoint: 'air-quality'  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpenMeteoHourly {
  time   : string[];
  [key: string]: (string | number | null)[];
}

interface OpenMeteoResult {
  latitude : number;
  longitude: number;
  hourly   : OpenMeteoHourly;
}

// ─── Grid generation ─────────────────────────────────────────────────────────

function buildGrid(): [number, number][] {
  const pts: [number, number][] = [];
  for (let lng = INDIA_BOUNDS.minLng; lng <= INDIA_BOUNDS.maxLng; lng += GRID_STEP) {
    for (let lat = INDIA_BOUNDS.minLat; lat <= INDIA_BOUNDS.maxLat; lat += GRID_STEP) {
      pts.push([
        Math.round(lng * 10) / 10,
        Math.round(lat * 10) / 10,
      ]);
    }
  }
  return pts;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Open-Meteo fetch ────────────────────────────────────────────────────────

async function fetchBatch(
  points  : [number, number][],
  config  : LayerConfig,
): Promise<OpenMeteoResult[]> {
  const lats = points.map(p => p[1]).join(',');
  const lngs = points.map(p => p[0]).join(',');

  const base = config.endpoint === 'air-quality'
    ? 'https://air-quality-api.open-meteo.com/v1/air-quality'
    : 'https://api.open-meteo.com/v1/forecast';

  const forecastDays = config.endpoint === 'air-quality' ? 7 : FUTURE_DAYS;
  const params = new URLSearchParams({
    latitude    : lats,
    longitude   : lngs,
    hourly      : config.variable,
    past_days   : String(PAST_DAYS),
    forecast_days: String(forecastDays),
    timezone    : 'UTC',
  });

  const res = await fetch(`${base}?${params}`, {
    // Tell the edge runtime to wait up to 10 s per batch
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  // Single location → object; multiple → array
  return Array.isArray(json) ? json : [json];
}

// ─── Timeline alignment ───────────────────────────────────────────────────────
//
// Open-Meteo returns hourly timestamps like "2024-06-01T00:00" (UTC, no Z).
// We append 'Z' before parsing to force UTC interpretation in JS.
//
// For each of our 61 steps we compute the target UTC time, then find the
// nearest hourly index in the Open-Meteo array using simple arithmetic
// (no linear scan needed since the array is uniformly spaced at 1 h).

function alignToTimeline(
  hourlyTimes : string[],
  hourlyValues: (number | null)[],
  config      : LayerConfig,
): Record<string, number> {
  // Parse first timestamp to get the array's epoch start
  const startMs = new Date(hourlyTimes[0] + 'Z').getTime();
  const nowMs   = Date.now();

  const result: Record<string, number> = {};

  for (let step = 0; step < TOTAL_STEPS; step++) {
    // Target UTC time for this step
    const targetMs = nowMs + (step - NOW_STEP) * SIX_HOURS_MS;

    // Nearest index in the hourly array (uniform 1 h spacing)
    const rawIdx    = Math.round((targetMs - startMs) / ONE_HOUR_MS);
    const idx       = Math.max(0, Math.min(hourlyTimes.length - 1, rawIdx));
    const raw       = hourlyValues[idx] ?? 0;
    const value     = config.transform ? config.transform(raw) : raw;

    result[`t${step}`] = Math.round(value * 10) / 10;
  }

  return result;
}

// ─── GeoJSON builder ──────────────────────────────────────────────────────────

function buildFeatureCollection(
  results : OpenMeteoResult[],
  config  : LayerConfig,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = results.map(r => {
    const values = r.hourly[config.variable] as (number | null)[];
    const props  = alignToTimeline(r.hourly.time, values, config);

    return {
      type    : 'Feature',
      geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
      properties: props,
    };
  });

  return { type: 'FeatureCollection', features };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
  const url   = new URL(req.url, 'http://localhost');
  const layer = url.searchParams.get('layer') as LayerId | null;

  if (!layer || !(layer in LAYER_CONFIG)) {
    return new Response(
      JSON.stringify({ error: `Unknown layer: "${layer}". Valid: ${Object.keys(LAYER_CONFIG).join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const config  = LAYER_CONFIG[layer];
    const grid    = buildGrid();
    const batches = chunk(grid, BATCH_SIZE);

    // Fetch all batches sequentially (with a small delay) to avoid concurrent request rate limits
    const allResults: OpenMeteoResult[] = [];
    for (const batch of batches) {
      const batchRes = await fetchBatch(batch, config);
      allResults.push(...batchRes);
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    const geojson      = buildFeatureCollection(allResults, config);

    return new Response(JSON.stringify(geojson), {
      status : 200,
      headers: {
        'Content-Type' : 'application/json',
        // Cache at the edge for 1 h; serve stale for 1 h while revalidating.
        // Vercel's CDN will respect this so only one cold-fetch hits Open-Meteo
        // per hour regardless of how many users are on the site.
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[weather-grid]', err);
    return new Response(
      JSON.stringify({ error: 'Upstream fetch failed', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// Vercel Edge Runtime declaration
export const config = { runtime: 'edge' };
