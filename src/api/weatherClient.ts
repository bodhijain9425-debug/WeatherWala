import type { WeatherLayerId } from '../types/weather';

export class WeatherFetchError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'WeatherFetchError';
  }
}

/**
 * Fetches the India-wide weather grid for a single layer.
 * Returns a GeoJSON FeatureCollection where each feature has properties
 * t0..t60 — see api/weather-grid.ts for the exact timeline alignment.
 */
export async function fetchWeatherGrid(
  layer: WeatherLayerId,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(`/api/weather-grid?layer=${layer}`, { signal });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new WeatherFetchError(`Failed to fetch "${layer}" layer: ${body || res.statusText}`, res.status);
  }

  return res.json();
}
