import { useState, useEffect } from 'react';
import { fetchWeatherGrid } from '../api/weatherClient';
import type { WeatherLayerId } from '../types/weather';

const cache: Record<string, GeoJSON.FeatureCollection> = {};

export function useWeatherLayer(layerId: WeatherLayerId) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(cache[layerId] || null);
  const [loading, setLoading] = useState(!cache[layerId]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cache[layerId]) {
      setData(cache[layerId]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchWeatherGrid(layerId, new Date().toISOString())
      .then((geojson) => {
        if (!mounted) return;
        cache[layerId] = geojson;
        setData(geojson);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [layerId]);

  return { data, loading, error };
}
