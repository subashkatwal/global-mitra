import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Destination {
  id: string;
  name: string;
  region: string;
  image: string;
  rating: number;
  difficulty: string;
  costPerDay: number;
}

interface ComparisonState {
  selectedIds: string[];
  selectedDestinations: Destination[];
  addToComparison: (dest: Destination) => void;
  removeFromComparison: (id: string) => void;
  toggleComparison: (dest: Destination) => void;
  clearComparison: () => void;
  isSelected: (id: string) => boolean;
  canAddMore: () => boolean;
}

const MAX_COMPARE = 5;

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      selectedDestinations: [],
      
      addToComparison: (dest) => {
        const { selectedIds, selectedDestinations } = get();
        if (selectedIds.length >= MAX_COMPARE) return;
        if (selectedIds.includes(dest.id)) return;
        
        set({
          selectedIds: [...selectedIds, dest.id],
          selectedDestinations: [...selectedDestinations, dest]
        });
      },
      
      removeFromComparison: (id) => {
        const { selectedIds, selectedDestinations } = get();
        set({
          selectedIds: selectedIds.filter(i => i !== id),
          selectedDestinations: selectedDestinations.filter(d => d.id !== id)
        });
      },
      
      toggleComparison: (dest) => {
        const { isSelected, addToComparison, removeFromComparison } = get();
        if (isSelected(dest.id)) {
          removeFromComparison(dest.id);
        } else {
          addToComparison(dest);
        }
      },
      
      clearComparison: () => set({ selectedIds: [], selectedDestinations: [] }),
      
      isSelected: (id) => get().selectedIds.includes(id),
      
      canAddMore: () => get().selectedIds.length < MAX_COMPARE
    }),
    {
      name: 'destination-comparison',
      partialize: (state) => ({ 
        selectedIds: state.selectedIds,
        selectedDestinations: state.selectedDestinations 
      })
    }
  )
);