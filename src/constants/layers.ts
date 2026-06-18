import type { LayerDefinition } from '../types/weather';

export const WEATHER_LAYERS: LayerDefinition[] = [
  {
    id: 'rainfall',
    label: 'Rainfall',
    unit: 'mm',
    description: 'Precipitation accumulation',
    renderAs: 'heatmap',
  },
  {
    id: 'temperature',
    label: 'Temperature',
    unit: '°C',
    description: 'Air temperature at 2m',
    renderAs: 'heatmap',
  },
  {
    id: 'humidity',
    label: 'Humidity',
    unit: '%',
    description: 'Relative humidity at 2m',
    renderAs: 'heatmap',
  },
  {
    id: 'aqi',
    label: 'AQI',
    unit: 'AQI',
    description: 'Air quality index',
    renderAs: 'circle',
  },
  {
    id: 'heatwave',
    label: 'Heatwave',
    unit: '°C',
    description: 'Zones above heatwave threshold',
    renderAs: 'heatmap',
  },
];

/** India bounding box used for the grid, initial view and map bounds. */
export const INDIA_BOUNDS = {
  minLng: 68,
  maxLng: 97.5,
  minLat: 7,
  maxLat: 36,
};

export const INDIA_CENTER: [number, number] = [82, 22.5];

/** Timeline: 5 days of history + today + 10 days of forecast, 3-hour steps. */
export const PAST_DAYS = 5;
export const FUTURE_DAYS = 10;
export const STEPS_PER_DAY = 4; // every 6 hours, kept small for a smooth demo scrubber
export const TOTAL_STEPS = (PAST_DAYS + FUTURE_DAYS) * STEPS_PER_DAY + 1;
export const NOW_STEP = PAST_DAYS * STEPS_PER_DAY;
