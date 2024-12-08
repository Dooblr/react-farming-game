import { create } from 'zustand'
import { CropType, CROPS } from '../types/crops'

interface Crop {
  type: CropType
  stage: 'seed' | 'growing' | 'ready'
  timer: number
}

interface GameState {
  crops: Record<string, Crop>
  money: number
  selectedCrop: CropType
  plantSeed: (position: string) => void
  updateCrops: () => void
  harvestCrop: (position: string) => void
  selectCrop: (cropType: CropType) => void
  menuOpen: boolean
  selectedCategory: 'plant' | 'build' | null
  soil: Set<string>
  toggleMenu: () => void
  setSelectedCategory: (category: 'plant' | 'build' | null) => void
  placeSoil: (position: string) => void
}

let store = create<GameState>((set) => ({
  crops: {},
  money: 100,
  selectedCrop: 'wheat',
  menuOpen: false,
  selectedCategory: null,
  soil: new Set(),

  selectCrop: (cropType) => set({ selectedCrop: cropType }),

  plantSeed: (position) => set((state) => {
    if (!state.soil.has(position)) return state
    return {
      crops: {
        ...state.crops,
        [position]: { 
          type: state.selectedCrop,
          stage: 'seed', 
          timer: 0 
        }
      }
    }
  }),

  updateCrops: () => set((state) => {
    const newCrops = { ...state.crops }
    Object.entries(newCrops).forEach(([pos, crop]) => {
      const cropData = CROPS[crop.type]
      if (crop.stage === 'seed' && crop.timer >= cropData.growthTime.toSprout) {
        newCrops[pos] = { ...crop, stage: 'growing', timer: 0 }
      } else if (crop.stage === 'growing' && crop.timer >= cropData.growthTime.toMature) {
        newCrops[pos] = { ...crop, stage: 'ready', timer: 0 }
      } else {
        newCrops[pos] = { ...crop, timer: crop.timer + 1 }
      }
    })
    return { crops: newCrops }
  }),

  harvestCrop: (position) => set((state) => {
    const crop = state.crops[position]
    if (!crop || crop.stage !== 'ready') return state

    const { [position]: removedCrop, ...remainingCrops } = state.crops
    return {
      crops: remainingCrops,
      money: state.money + CROPS[crop.type].sellPrice
    }
  }),

  toggleMenu: () => set((state) => ({ 
    menuOpen: !state.menuOpen,
    selectedCategory: state.menuOpen ? null : state.selectedCategory 
  })),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  placeSoil: (position) => set((state) => {
    if (state.money < 5) return state
    const newSoil = new Set(state.soil)
    newSoil.add(position)
    return {
      soil: newSoil,
      money: state.money - 5
    }
  }),
}))

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    const currentState = store.getState()
    store = create<GameState>((set) => ({
      ...currentState,
      selectCrop: (cropType) => set({ selectedCrop: cropType }),
      plantSeed: (position) => set((state) => {
        if (!state.soil.has(position)) return state
        return {
          crops: {
            ...state.crops,
            [position]: { 
              type: state.selectedCrop,
              stage: 'seed', 
              timer: 0 
            }
          }
        }
      }),
      updateCrops: () => set((state) => {
        const newCrops = { ...state.crops }
        Object.entries(newCrops).forEach(([pos, crop]) => {
          const cropData = CROPS[crop.type]
          if (crop.stage === 'seed' && crop.timer >= cropData.growthTime.toSprout) {
            newCrops[pos] = { ...crop, stage: 'growing', timer: 0 }
          } else if (crop.stage === 'growing' && crop.timer >= cropData.growthTime.toMature) {
            newCrops[pos] = { ...crop, stage: 'ready', timer: 0 }
          } else {
            newCrops[pos] = { ...crop, timer: crop.timer + 1 }
          }
        })
        return { crops: newCrops }
      }),
      harvestCrop: (position) => set((state) => {
        const crop = state.crops[position]
        if (!crop || crop.stage !== 'ready') return state

        const { [position]: removedCrop, ...remainingCrops } = state.crops
        return {
          crops: remainingCrops,
          money: state.money + CROPS[crop.type].sellPrice
        }
      })
    }))
  })
}

export const useGameStore = store 