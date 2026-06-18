import { INDIA_BOUNDS, TOTAL_STEPS } from '../constants/layers';
import { layerRange } from './colorScales';
import type { WeatherLayerId } from '../types/weather';

const GRID_STEP_DEG = 1.25;

/** Deterministic pseudo-random in [0, 1) so the demo grid is stable across renders. */
function noise(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Generates a India-wide point grid where every feature carries one value
 * per timestep (t0..tN). This mirrors the shape the real `/api/weather-grid`
 * endpoint will return, so swapping the data source later is a drop-in
 * replacement.
 */
export function generateLayerGrid(layer: WeatherLayerId): GeoJSON.FeatureCollection {
  const [min, max] = layerRange(layer);
  const span = max - min;
  const features: GeoJSON.Feature[] = [];

  for (let lng = INDIA_BOUNDS.minLng; lng <= INDIA_BOUNDS.maxLng; lng += GRID_STEP_DEG) {
    for (let lat = INDIA_BOUNDS.minLat; lat <= INDIA_BOUNDS.maxLat; lat += GRID_STEP_DEG) {
      const base = min + noise(lat, lng) * span;
      const phase = noise(lng, lat) * Math.PI * 2;
      const properties: Record<string, number> = {};

      for (let t = 0; t < TOTAL_STEPS; t++) {
        const drift = Math.sin(t * 0.35 + phase) * span * 0.12;
        const value = Math.max(min, Math.min(max, base + drift));
        properties[`t${t}`] = Math.round(value * 10) / 10;
      }

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties,
      });
    }
  }

  return { type: 'FeatureCollection', features };
}
