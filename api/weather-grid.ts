import { INDIA_BOUNDS } from '../src/constants/layers';

export const config = {
  runtime: 'edge',
};

const GRID_STEP = 1.5; // Slightly finer grid

function generateGrid() {
  const coords: { lat: number; lng: number }[] = [];
  for (let lat = INDIA_BOUNDS.minLat; lat <= INDIA_BOUNDS.maxLat; lat += GRID_STEP) {
    for (let lng = INDIA_BOUNDS.minLng; lng <= INDIA_BOUNDS.maxLng; lng += GRID_STEP) {
      coords.push({ lat, lng });
    }
  }
  return coords;
}

const LAYER_MAPPING: Record<string, { api: string; hourly: string }> = {
  temperature: { api: 'forecast', hourly: 'temperature_2m' },
  rainfall: { api: 'forecast', hourly: 'precipitation' },
  humidity: { api: 'forecast', hourly: 'relative_humidity_2m' },
  heatwave: { api: 'forecast', hourly: 'temperature_2m' },
  aqi: { api: 'air-quality', hourly: 'european_aqi' },
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const layer = searchParams.get('layer') || 'temperature';

  const mapping = LAYER_MAPPING[layer];
  if (!mapping) {
    return new Response(JSON.stringify({ error: 'Invalid layer' }), { status: 400 });
  }

  const allCoords = generateGrid();
  const batchSize = 50; // Small batches for better reliability
  const batches: { lat: number; lng: number }[][] = [];
  for (let i = 0; i < allCoords.length; i += batchSize) {
    batches.push(allCoords.slice(i, i + batchSize));
  }

  const baseUrl =
    mapping.api === 'forecast'
      ? 'https://api.open-meteo.com/v1/forecast'
      : 'https://air-quality-api.open-meteo.com/v1/air-quality';

  try {
    const batchPromises = batches.map(async (batch) => {
      const lats = batch.map((c) => c.lat).join(',');
      const lngs = batch.map((c) => c.lng).join(',');
      const url = `${baseUrl}?latitude=${lats}&longitude=${lngs}&hourly=${mapping.hourly}&past_days=5&forecast_days=10`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.reason || 'Open-Meteo error');
      return Array.isArray(data) ? data : [data];
    });

    const results = await Promise.all(batchPromises);
    const flatResults = results.flat();

    const features = flatResults.map((loc, i) => {
      const coord = allCoords[i];
      const hourlyData = loc.hourly[mapping.hourly];
      const properties: Record<string, number> = {};
      
      // Sample every 6 hours (61 steps total)
      for (let step = 0; step < 61; step++) {
        const hourlyIndex = step * 6;
        let val = hourlyData[hourlyIndex] ?? 0;
        
        // Derived heatwave: only show values > 30, and focus on the intensity
        if (layer === 'heatwave') {
          val = val > 30 ? val : 30;
        }
        
        properties[`t${step}`] = Math.round(val * 10) / 10;
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coord.lng, coord.lat],
        },
        properties,
      };
    });

    return new Response(
      JSON.stringify({
        type: 'FeatureCollection',
        features,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
