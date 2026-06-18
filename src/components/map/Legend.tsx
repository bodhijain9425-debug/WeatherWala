import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/appStore';
import { WEATHER_LAYERS } from '../../constants/layers';
import { colorScales, layerRange } from '../../utils/colorScales';

const AQI_BAND_LABELS = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very poor', 'Severe'];

export function Legend() {
  const activeLayer = useAppStore((s) => s.activeLayer);
  const layer = WEATHER_LAYERS.find((l) => l.id === activeLayer)!;
  const scale = colorScales[activeLayer];
  const [min, max] = layerRange(activeLayer);
  const gradient = `linear-gradient(to right, ${scale.map((s) => s.color).join(', ')})`;

  return (
    <div className="glass-panel pointer-events-auto w-full max-w-[15rem] px-4 py-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLayer}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <p className="text-xs font-medium text-mist">{layer.label}</p>

          {layer.renderAs === 'circle' ? (
            <div className="mt-2 flex flex-col gap-1">
              {scale.map((stop, i) => (
                <div key={stop.value} className="flex items-center gap-2 text-[11px] text-mist">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stop.color }} />
                  <span className="data-readout w-8 text-ink">{stop.value}+</span>
                  <span>{AQI_BAND_LABELS[i]}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-2 h-2 w-full rounded-full" style={{ background: gradient }} />
              <div className="mt-1.5 flex justify-between text-[11px] text-mist">
                <span className="data-readout">
                  {min}
                  {layer.unit}
                </span>
                <span className="data-readout">
                  {max}
                  {layer.unit}
                </span>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
