import { create } from 'zustand';
import type { Place, Report, FilterOptions, PlaceCategory } from '@/types';
import { destinationsData } from '@/data/destinations';

interface PlaceState {
  places: Place[];
  selectedPlace: Place | null;
  filteredPlaces: Place[];
  savedPlaces: string[];
  comparisonList: Place[];
  filters: FilterOptions;
  searchQuery: string;
  isLoading: boolean;
  
  // Actions
  setPlaces: (places: Place[]) => void;
  selectPlace: (place: Place | null) => void;
  addReport: (placeId: string, report: Report) => void;
  toggleSavePlace: (placeId: string) => void;
  addToComparison: (place: Place) => void;
  removeFromComparison: (placeId: string) => void;
  clearComparison: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSearchQuery: (query: string) => void;
  filterPlaces: () => void;
  getPlaceById: (id: string) => Place | undefined;
  getTrendingPlaces: () => Place[];
  getNearbyPlaces: (lat: number, lng: number, radius: number) => Place[];
  getPlacesByCategory: (category: PlaceCategory) => Place[];
}

const initialFilters: FilterOptions = {
  categories: [],
  priceRange: [],
  rating: 0,
  distance: 500,
  verifiedOnly: false
};

export const usePlaceStore = create<PlaceState>((set, get) => ({
  places: destinationsData,
  selectedPlace: null,
  filteredPlaces: destinationsData,
  savedPlaces: [],
  comparisonList: [],
  filters: initialFilters,
  searchQuery: '',
  isLoading: false,

  setPlaces: (places) => set({ places }),

  selectPlace: (place) => set({ selectedPlace: place }),

  addReport: (placeId, report) => {
    const { places } = get();
    const updatedPlaces = places.map(place => {
      if (place.id === placeId) {
        return { ...place, reports: [report, ...place.reports] };
      }
      return place;
    });
    set({ places: updatedPlaces });
  },

  toggleSavePlace: (placeId) => {
    const { savedPlaces } = get();
    if (savedPlaces.includes(placeId)) {
      set({ savedPlaces: savedPlaces.filter(id => id !== placeId) });
    } else {
      set({ savedPlaces: [...savedPlaces, placeId] });
    }
  },

  addToComparison: (place) => {
    const { comparisonList } = get();
    if (comparisonList.length < 4 && !comparisonList.find(p => p.id === place.id)) {
      set({ comparisonList: [...comparisonList, place] });
    }
  },

  removeFromComparison: (placeId) => {
    const { comparisonList } = get();
    set({ comparisonList: comparisonList.filter(p => p.id !== placeId) });
  },

  clearComparison: () => set({ comparisonList: [] }),

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
    get().filterPlaces();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().filterPlaces();
  },

  filterPlaces: () => {
    const { places, filters, searchQuery } = get();
    
    let filtered = [...places];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.location.city.toLowerCase().includes(query) ||
        place.location.country.toLowerCase().includes(query) ||
        place.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(place => filters.categories.includes(place.category));
    }
    
    // Price range filter
    if (filters.priceRange.length > 0) {
      filtered = filtered.filter(place => filters.priceRange.includes(place.priceRange));
    }
    
    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(place => place.rating >= filters.rating);
    }
    
    // Verified only filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(place => place.isVerified);
    }
    
    set({ filteredPlaces: filtered });
  },

  getPlaceById: (id) => {
    return get().places.find(place => place.id === id);
  },

  getTrendingPlaces: () => {
    return get().places
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 6);
  },

  getNearbyPlaces: () => {
    // Simplified distance calculation
    return get().places.slice(0, 5);
  },

  getPlacesByCategory: (category) => {
    return get().places.filter(place => place.category === category);
  }
}));
