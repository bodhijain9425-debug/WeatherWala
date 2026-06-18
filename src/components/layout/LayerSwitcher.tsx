import { motion } from 'framer-motion';
import { CloudRain, Thermometer, Droplets, Wind, Flame } from 'lucide-react';
import { WEATHER_LAYERS } from '../../constants/layers';
import { useAppStore } from '../../store/appStore';
import type { WeatherLayerId } from '../../types/weather';

const ICONS: Record<WeatherLayerId, typeof CloudRain> = {
  rainfall: CloudRain,
  temperature: Thermometer,
  humidity: Droplets,
  aqi: Wind,
  heatwave: Flame,
};

export function LayerSwitcher() {
  const activeLayer = useAppStore((s) => s.activeLayer);
  const setActiveLayer = useAppStore((s) => s.setActiveLayer);

  return (
    <div
      className="glass-panel pointer-events-auto flex items-center gap-1 overflow-x-auto p-1"
      role="tablist"
      aria-label="Weather layer"
    >
      {WEATHER_LAYERS.map((layer) => {
        const Icon = ICONS[layer.id];
        const isActive = layer.id === activeLayer;

        return (
          <button
            key={layer.id}
            role="tab"
            aria-selected={isActive}
            aria-label={layer.label}
            title={layer.description}
            onClick={() => setActiveLayer(layer.id)}
            className="relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="layer-pill-highlight"
                className="absolute inset-0 rounded-lg bg-monsoon/15 ring-1 ring-monsoon/40"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Icon
              size={16}
              strokeWidth={2}
              className={`relative z-10 ${isActive ? 'text-monsoon' : 'text-mist'}`}
            />
            <span className={`relative z-10 hidden sm:inline ${isActive ? 'text-ink' : 'text-mist'}`}>
              {layer.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
