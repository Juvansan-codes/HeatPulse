import { create } from 'zustand';
import { SeverityLevel } from '../lib/types';

export type MapLayerKey = 'risk' | 'htsi' | 'utci' | 'wbgt' | 'exposure' | 'healthcare';

interface HeatPulseState {
  // Shared UI Client State
  selectedWardId: number;
  selectedLayer: MapLayerKey;
  selectedZone: number | 'all';
  selectedSeverity: SeverityLevel | 'All';
  searchQuery: string;
  isExplainOpen: boolean;
  explainWardId: number | null;
  isSearchModalOpen: boolean;
  staleTimestamp: string;

  // Actions
  setSelectedWardId: (wardId: number) => void;
  setSelectedLayer: (layer: MapLayerKey) => void;
  setSelectedZone: (zone: number | 'all') => void;
  setSelectedSeverity: (severity: SeverityLevel | 'All') => void;
  setSearchQuery: (query: string) => void;
  setExplainOpen: (open: boolean, wardId?: number) => void;
  setSearchModalOpen: (open: boolean) => void;
  updateStaleTimestamp: (timestamp: string) => void;
}

export const useHeatPulseStore = create<HeatPulseState>((set) => ({
  selectedWardId: 114,
  selectedLayer: 'risk',
  selectedZone: 'all',
  selectedSeverity: 'All',
  searchQuery: '',
  isExplainOpen: false,
  explainWardId: null,
  isSearchModalOpen: false,
  staleTimestamp: 'Last synced today at 12:00 IST',

  setSelectedWardId: (wardId) =>
    set({ selectedWardId: wardId, explainWardId: wardId }),

  setSelectedLayer: (layer) => set({ selectedLayer: layer }),

  setSelectedZone: (zone) => set({ selectedZone: zone }),

  setSelectedSeverity: (severity) => set({ selectedSeverity: severity }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setExplainOpen: (open, wardId) =>
    set((state) => ({
      isExplainOpen: open,
      explainWardId: wardId ?? state.selectedWardId
    })),

  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  updateStaleTimestamp: (timestamp) => set({ staleTimestamp: timestamp })
}));
