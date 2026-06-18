import type { ColorStop, WeatherLayerId } from '../types/weather';

/**
 * Single source of truth for layer colors. The map paint expressions and the
 * legend both derive from this, so they can never drift out of sync.
 */
export const colorScales: Record<WeatherLayerId, ColorStop[]> = {
  temperature: [
    { value: 10, color: '#3B82F6' },
    { value: 20, color: '#22C55E' },
    { value: 28, color: '#EAB308' },
    { value: 36, color: '#F97316' },
    { value: 44, color: '#DC2626' },
  ],
  rainfall: [
    { value: 0, color: 'rgba(79, 209, 197, 0)' },
    { value: 5, color: '#93C5FD' },
    { value: 20, color: '#3B82F6' },
    { value: 50, color: '#1D4ED8' },
    { value: 100, color: '#6D28D9' },
  ],
  humidity: [
    { value: 20, color: '#FDE68A' },
    { value: 45, color: '#A3E635' },
    { value: 70, color: '#22D3EE' },
    { value: 95, color: '#0E7490' },
  ],
  aqi: [
    { value: 0, color: '#22C55E' },
    { value: 50, color: '#A3E635' },
    { value: 100, color: '#FACC15' },
    { value: 200, color: '#F97316' },
    { value: 300, color: '#EF4444' },
    { value: 400, color: '#9F1239' },
  ],
  heatwave: [
    { value: 30, color: 'rgba(244, 163, 64, 0)' },
    { value: 38, color: '#F4A340' },
    { value: 42, color: '#F97316' },
    { value: 46, color: '#DC2626' },
  ],
};

export const layerRange = (layer: WeatherLayerId): [number, number] => {
  const stops = colorScales[layer];
  return [stops[0].value, stops[stops.length - 1].value];
};

/**
 * Builds a MapLibre `heatmap-color` expression from a color scale, mapping
 * the 0-1 `heatmap-density` value to the scale's color stops.
 */
export function buildHeatmapColorExpression(layer: WeatherLayerId): unknown[] {
  const stops = colorScales[layer];
  const [min, max] = layerRange(layer);
  const expr: unknown[] = ['interpolate', ['linear'], ['heatmap-density']];

  stops.forEach((stop) => {
    const density = (stop.value - min) / (max - min || 1);
    expr.push(Math.max(0, Math.min(1, density)), stop.color);
  });

  return expr;
}

/**
 * Builds a MapLibre `circle-color` expression that maps a raw data value
 * directly to a color, e.g. for AQI points using CPCB-style bands.
 */
export function buildCircleColorExpression(layer: WeatherLayerId, getExpr: unknown[]): unknown[] {
  const stops = colorScales[layer];
  const expr: unknown[] = ['interpolate', ['linear'], getExpr];

  stops.forEach((stop) => {
    expr.push(stop.value, stop.color);
  });

  return expr;
}
