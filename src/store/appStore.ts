import { create } from 'zustand';
import { NOW_STEP } from '../constants/layers';
import type { WeatherLayerId } from '../types/weather';

interface AppState {
  activeLayer: WeatherLayerId;
  timelineIndex: number;
  isPlaying: boolean;
  setActiveLayer: (layer: WeatherLayerId) => void;
  setTimelineIndex: (index: number) => void;
  togglePlaying: () => void;
  setPlaying: (playing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeLayer: 'temperature',
  timelineIndex: NOW_STEP,
  isPlaying: false,
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setTimelineIndex: (index) => set({ timelineIndex: index }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
}));
