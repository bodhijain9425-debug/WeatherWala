export type WeatherLayerId = 'rainfall' | 'temperature' | 'humidity' | 'aqi' | 'heatwave';

export interface LayerDefinition {
  id: WeatherLayerId;
  label: string;
  unit: string;
  /** Short description shown as a hint / aria-label */
  description: string;
  /** How this layer should be rendered on the map */
  renderAs: 'heatmap' | 'circle';
}

export interface ColorStop {
  value: number;
  color: string;
}

/**
 * A single point in the weather grid. Every timestep (t0...tN) is stored as
 * its own property so the timeline can scrub by swapping a style expression
 * instead of re-fetching or re-rendering.
 */
export type WeatherFeatureProperties = Record<`t${number}`, number>;

export interface TimelineStep {
  index: number;
  date: Date;
  isForecast: boolean;
  isNow: boolean;
}
