import { useMemo } from 'react';
import Map, { AttributionControl, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '../../store/appStore';
import { WEATHER_LAYERS, INDIA_CENTER, INDIA_BOUNDS } from '../../constants/layers';
import { useWeatherLayer } from '../../hooks/useWeatherLayer';
import { buildHeatmapColorExpression, buildCircleColorExpression, layerRange } from '../../utils/colorScales';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MAX_BOUNDS: [[number, number], [number, number]] = [
  [INDIA_BOUNDS.minLng - 6, INDIA_BOUNDS.minLat - 6],
  [INDIA_BOUNDS.maxLng + 6, INDIA_BOUNDS.maxLat + 6],
];

export function MapView() {
  const activeLayer = useAppStore((s) => s.activeLayer);
  const timelineIndex = useAppStore((s) => s.timelineIndex);
  const layerDef = WEATHER_LAYERS.find((l) => l.id === activeLayer)!;
  const valueKey = `t${timelineIndex}`;

  const { data, loading, error } = useWeatherLayer(activeLayer);

  const paint = useMemo<Record<string, unknown>>(() => {
    const [min, max] = layerRange(activeLayer);

    if (layerDef.renderAs === 'circle') {
      return {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 8, 14],
        'circle-color': buildCircleColorExpression(activeLayer, ['get', valueKey]),
        'circle-opacity': 0.85,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.25)',
        'circle-opacity-transition': { duration: 300 },
      };
    }

    return {
      'heatmap-weight': ['interpolate', ['linear'], ['get', valueKey], min, 0, max, 1],
      'heatmap-intensity': 1,
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 24, 8, 50],
      'heatmap-color': buildHeatmapColorExpression(activeLayer),
      'heatmap-opacity': 0.75,
      'heatmap-opacity-transition': { duration: 300 },
    };
  }, [activeLayer, layerDef.renderAs, valueKey]);

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={{ longitude: INDIA_CENTER[0], latitude: INDIA_CENTER[1], zoom: 4.3 }}
        minZoom={3.2}
        maxZoom={9}
        maxBounds={MAX_BOUNDS}
        mapStyle={DARK_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <AttributionControl compact position="bottom-left" />
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Re-keying on the layer id swaps the source when the layer changes;
            changing the timeline only updates `paint`, so MapLibre patches the
            style in place with no data reload. Source is only mounted once
            its data has arrived, so we never feed MapLibre an empty grid. */}
        {data && (
          <Source key={activeLayer} id="weather-grid" type="geojson" data={data}>
            <Layer
              id={`weather-${activeLayer}`}
              {...({ type: layerDef.renderAs, paint } as LayerProps)}
            />
          </Source>
        )}
      </Map>

      {/* Subtle status indicator — never blocks the map, just informs */}
      {loading && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-panel/80 px-3 py-1.5 text-xs text-mist backdrop-blur-glass">
          Loading {layerDef.label.toLowerCase()} data…
        </div>
      )}
      {error && !loading && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-panel/80 px-3 py-1.5 text-xs text-marigold backdrop-blur-glass">
          Couldn&apos;t load {layerDef.label.toLowerCase()} data — retrying on next layer switch
        </div>
      )}
    </div>
  );
}
