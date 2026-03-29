import { create } from 'zustand';

export type Variant = 'current' | 'shortest' | 'safest';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface SingleRoute {
  distance_m: number;
  node_count: number;
  start_node: number;
  end_node: number;
  total_accidents: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  }
}

export interface RouteResponse {
  current?: SingleRoute;
  shortest: SingleRoute;
  safest: SingleRoute;
}

export interface TrafficIncident {
  category: string;
  from: string;
  to: string;
  description: string;
  delay: number;
  geometry: {
    type: string;
    coordinates: [number, number][] | [number, number];
  };
}

interface StoreState {
  start: RoutePoint;
  end: RoutePoint;
  startLabel: string;
  endLabel: string;
  response: RouteResponse | null;
  incidents: TrafficIncident[];
  isLoading: boolean;
  error: string | null;
  currentVariant: Variant;
  setCurrentVariant: (variant: Variant) => void;
  setStart: (point: Partial<RoutePoint>, label?: string) => void;
  setEnd: (point: Partial<RoutePoint>, label?: string) => void;
  fetchRoutes: () => Promise<void>;
  fetchIncidents: (bounds: { minLat: number; minLng: number; maxLat: number; maxLng: number }) => Promise<void>;
  reset: () => void;
}

const defaultPoint: RoutePoint = {
  lat: 42.6977,
  lng: 23.3219,
};

export const useStore = create<StoreState>((set, get) => ({
  start: { ...defaultPoint },
  end: { ...defaultPoint },
  startLabel: '',
  endLabel: '',
  response: null,
  incidents: [],
  isLoading: false,
  error: null,
  currentVariant: 'current',

  setCurrentVariant: (variant) =>
    set({ currentVariant: variant }),

  setStart: (point, label?) =>
    set((state) => ({
      start: { ...state.start, ...point },
      ...(label !== undefined && { startLabel: label }),
    })),

  setEnd: (point, label?) =>
    set((state) => ({
      end: { ...state.end, ...point },
      ...(label !== undefined && { endLabel: label }),
    })),

  fetchRoutes: async () => {
    const { start, end } = get();

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/navigation`, {
        method: 'POST',
        body: JSON.stringify({ start, end, risk_factor: 15 }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      set({ response: data, currentVariant: 'current' });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchIncidents: async (bounds) => {
    try {
      const params = new URLSearchParams({
        min_lat: bounds.minLat.toString(),
        min_lng: bounds.minLng.toString(),
        max_lat: bounds.maxLat.toString(),
        max_lng: bounds.maxLng.toString(),
      });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/traffic/incidents?${params}`);
      const data = await response.json();
      set({ incidents: data.incidents || [] });
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  },

  reset: () =>
    set({
      start: { ...defaultPoint },
      end: { ...defaultPoint },
      startLabel: '',
      endLabel: '',
      response: null,
      incidents: [],
      isLoading: false,
      error: null,
    }),
}));
