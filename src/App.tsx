import { Header } from './components/layout/Header';
import { LayerSwitcher } from './components/layout/LayerSwitcher';
import { Legend } from './components/map/Legend';
import { MapView } from './components/map/MapView';
import { TimelineBar } from './components/timeline/TimelineBar';

export default function App() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-midnight">
      <div className="absolute inset-0">
        <MapView />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Header />
          <LayerSwitcher />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Legend />
          </div>
          <TimelineBar />
        </div>
      </div>
    </div>
  );
}
