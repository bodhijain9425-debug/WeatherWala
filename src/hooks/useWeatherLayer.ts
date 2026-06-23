import { useEffect, useRef, useState } from 'react';
import { fetchWeatherGrid } from '../api/weatherClient';
import type { WeatherLayerId } from '../types/weather';

interface UseWeatherLayerResult {
  data: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache: once a layer's grid is fetched, re-selecting it is
// instant and costs zero network requests for the rest of the session.
const cache = new Map<WeatherLayerId, GeoJSON.FeatureCollection>();

/**
 * Fetches the GeoJSON grid for `layer`, caching results across the session
 * so switching back to an already-loaded layer is instant. Each layer is
 * only ever fetched once per page load (the edge function itself is cached
 * for an hour, so this is a deliberate two-tier cache: browser session +
 * CDN edge).
 */
export function useWeatherLayer(layer: WeatherLayerId): UseWeatherLayerResult {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(cache.get(layer) ?? null);
  const [loading, setLoading] = useState(!cache.has(layer));
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const cached = cache.get(layer);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetchWeatherGrid(layer, controller.signal)
      .then((geojson) => {
        if (currentRequest !== requestId.current) return; // stale response, layer changed again
        cache.set(layer, geojson);
        setData(geojson);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (currentRequest !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load weather data');
        setLoading(false);
      });

    return () => controller.abort();
  }, [layer]);

  return { data, loading, error };
}
