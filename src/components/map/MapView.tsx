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

  const { data: geojson, loading } = useWeatherLayer(activeLayer);

  const paint = useMemo<Record<string, unknown>>(() => {
    const [min, max] = layerRange(activeLayer);

    if (layerDef.renderAs === 'circle') {
      return {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 8, 14],
        'circle-color': buildCircleColorExpression(activeLayer, ['get', valueKey]),
        'circle-opacity': loading ? 0 : 0.85,
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
      'heatmap-opacity': loading ? 0 : 0.75,
      'heatmap-opacity-transition': { duration: 300 },
    };
  }, [activeLayer, layerDef.renderAs, valueKey, loading]);

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

        {geojson && (
          <Source id="weather-grid" type="geojson" data={geojson}>
            <Layer
              id={`weather-${activeLayer}`}
              {...({ type: layerDef.renderAs, paint } as LayerProps)}
            />
          </Source>
        )}
      </Map>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-midnight/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full bg-panel/80 px-4 py-2 border border-panel-border shadow-glass">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-monsoon border-t-transparent" />
            <span className="text-sm font-medium text-ink">Loading {layerDef.label}...</span>
          </div>
        </div>
      )}
    </div>
  );
}
