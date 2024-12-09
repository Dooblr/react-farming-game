import { create } from 'zustand'
import { CropType, CROPS } from '../types/crops'
import { NPC, NPCType } from '../types/npcs'
import { NPC_DATA } from '../types/npcs'
import { GRID_SIZE } from '../constants'

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
  buildings: Record<string, 'barn'>
  buildingPreview: {
    type: 'barn' | null
    position: { x: number, y: number } | null
  }
  setBuildingPreview: (type: 'barn' | null, position: { x: number, y: number } | null) => void
  placeBuilding: (type: 'barn', position: { x: number, y: number }) => void
  selectedBuildItem: 'soil' | 'barn' | 'dog' | null
  selectBuildItem: (item: 'soil' | 'barn' | 'dog' | null) => void
  inventory: Record<CropType, number>
  addToInventory: (cropType: CropType) => void
  sellInventory: () => void
  npcs: Record<string, NPC>
  spawnNPC: (type: NPCType, position: { x: number, y: number }) => void
  removeNPC: (id: string) => void
  updateNPCs: () => void
}

let store = create<GameState>((set, get) => ({
  crops: {},
  money: 100,
  selectedCrop: 'wheat',
  menuOpen: false,
  selectedCategory: null,
  soil: new Set(),
  buildings: {},
  buildingPreview: {
    type: null,
    position: null
  },
  selectedBuildItem: null,
  inventory: {
    wheat: 0,
    carrot: 0,
    spinach: 0
  },
  npcs: {},

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
      inventory: {
        ...state.inventory,
        [crop.type]: state.inventory[crop.type] + 1
      }
    }
  }),

  toggleMenu: () => set((state) => ({ 
    menuOpen: !state.menuOpen,
    selectedCategory: state.menuOpen ? null : state.selectedCategory 
  })),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  placeSoil: (position) => set((state) => {
    if (state.selectedBuildItem !== 'soil' || state.money < 5) return state
    const newSoil = new Set(state.soil)
    newSoil.add(position)
    return {
      soil: newSoil,
      money: state.money - 5
    }
  }),

  setBuildingPreview: (type, position) => set({
    buildingPreview: { type, position }
  }),

  placeBuilding: (type, position) => set((state) => {
    if (type === 'barn' && state.money < 100) return state

    // Check 3x3 area is clear
    for (let y = position.y; y < position.y + 3; y++) {
      for (let x = position.x; x < position.x + 3; x++) {
        const posKey = `${x},${y}`
        if (state.buildings[posKey] || state.crops[posKey] || state.soil.has(posKey)) {
          return state
        }
      }
    }

    const newBuildings = { ...state.buildings }
    for (let y = position.y; y < position.y + 3; y++) {
      for (let x = position.x; x < position.x + 3; x++) {
        newBuildings[`${x},${y}`] = type
      }
    }

    return {
      buildings: newBuildings,
      money: state.money - 100,
      buildingPreview: { type: null, position: null },
      selectedCategory: null,
      menuOpen: false
    }
  }),

  selectBuildItem: (item) => set((state) => ({
    selectedBuildItem: item,
    selectedCategory: 'build',
    buildingPreview: item === 'barn' ? { type: 'barn', position: null } : { type: null, position: null }
  })),

  addToInventory: (cropType) => set((state) => ({
    inventory: {
      ...state.inventory,
      [cropType]: state.inventory[cropType] + 1
    }
  })),

  sellInventory: () => set((state) => {
    let totalValue = 0
    Object.entries(state.inventory).forEach(([cropType, amount]) => {
      totalValue += CROPS[cropType as CropType].sellPrice * amount
    })

    return {
      money: state.money + totalValue,
      inventory: {
        wheat: 0,
        carrot: 0,
        spinach: 0
      }
    }
  }),

  spawnNPC: (type, position) => set((state) => {
    const id = `${type}-${Date.now()}-${Math.random()}`
    return {
      npcs: {
        ...state.npcs,
        [id]: {
          id,
          type,
          position,
          targetPosition: null
        }
      }
    }
  }),

  removeNPC: (id) => set((state) => {
    const { [id]: removed, ...remainingNPCs } = state.npcs
    return { npcs: remainingNPCs }
  }),

  updateNPCs: () => set((state) => {
    const newNPCs = { ...state.npcs }
    const readyCrops: { position: { x: number, y: number }, key: string }[] = []

    // Find ready crops
    Object.entries(state.crops).forEach(([key, crop]) => {
      if (crop.stage === 'ready') {
        const [x, y] = key.split(',').map(Number)
        readyCrops.push({ position: { x, y }, key })
      }
    })

    // Update each NPC
    Object.values(newNPCs).forEach(npc => {
      if (npc.type === 'thief') {
        // If thief is waiting after stealing
        if (npc.stealTimer && npc.stealTimer > 0) {
          npc.stealTimer--
          return
        }

        // If thief has no target or finished waiting, find nearest ready crop
        if (!npc.targetPosition || (npc.stealTimer === 0)) {
          const nearestCrop = readyCrops.reduce((nearest, current) => {
            const currentDist = Math.hypot(
              current.position.x - npc.position.x,
              current.position.y - npc.position.y
            )
            const nearestDist = nearest ? Math.hypot(
              nearest.position.x - npc.position.x,
              nearest.position.y - npc.position.y
            ) : Infinity
            return currentDist < nearestDist ? current : nearest
          }, null as { position: { x: number, y: number }, key: string } | null)

          if (nearestCrop) {
            npc.targetPosition = nearestCrop.position
            npc.stealTimer = undefined
          } else {
            // No crops to steal, run away
            npc.targetPosition = { x: -1, y: -1 }
          }
        }

        // Move towards target
        if (npc.targetPosition) {
          const dx = Math.sign(npc.targetPosition.x - npc.position.x)
          const dy = Math.sign(npc.targetPosition.y - npc.position.y)
          npc.position.x += dx
          npc.position.y += dy

          // If reached target, steal crop and start waiting
          if (npc.position.x === npc.targetPosition.x && 
              npc.position.y === npc.targetPosition.y) {
            const cropKey = `${npc.position.x},${npc.position.y}`
            if (state.crops[cropKey]?.stage === 'ready') {
              const { [cropKey]: removedCrop, ...remainingCrops } = state.crops
              state.crops = remainingCrops
              npc.stealTimer = NPC_DATA.thief.stealDelay
              npc.targetPosition = null
            }
          }
        }
      } else if (npc.type === 'dog') {
        // Find nearest thief within range
        const nearestThief = Object.values(newNPCs)
          .filter(other => other.type === 'thief')
          .reduce((nearest, thief) => {
            const dist = Math.hypot(
              thief.position.x - npc.position.x,
              thief.position.y - npc.position.y
            )
            if (dist <= NPC_DATA.dog.range && (!nearest || dist < nearest.dist)) {
              return { thief, dist }
            }
            return nearest
          }, null as { thief: NPC, dist: number } | null)

        if (nearestThief) {
          // Chase thief
          const dx = Math.sign(nearestThief.thief.position.x - npc.position.x)
          const dy = Math.sign(nearestThief.thief.position.y - npc.position.y)
          npc.position.x += dx * NPC_DATA.dog.speed
          npc.position.y += dy * NPC_DATA.dog.speed

          // If caught thief, remove it
          if (Math.abs(npc.position.x - nearestThief.thief.position.x) < 1 &&
              Math.abs(npc.position.y - nearestThief.thief.position.y) < 1) {
            delete newNPCs[nearestThief.thief.id]
          }
        }
      }
    })

    // Remove NPCs that have left the map
    Object.entries(newNPCs).forEach(([id, npc]) => {
      if (npc.position.x < -1 || npc.position.y < -1 || 
          npc.position.x > GRID_SIZE || npc.position.y > GRID_SIZE) {
        delete newNPCs[id]
      }
    })

    return { npcs: newNPCs }
  })
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
          inventory: {
            ...state.inventory,
            [crop.type]: state.inventory[crop.type] + 1
          }
        }
      })
    }))
  })
}

export const useGameStore = store 