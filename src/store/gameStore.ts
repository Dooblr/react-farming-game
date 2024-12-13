import { create } from 'zustand'
import { CropType, CROPS } from '../types/crops'
import { NPC, NPCType } from '../types/npcs'
import { NPC_DATA } from '../types/npcs'
import { GRID_SIZE, GRID_CENTER } from '../constants'
import { PetType, Pet, PET_DATA } from '../types/pets'
import { AnimalType, Animal, ANIMAL_DATA } from '../types/animals'

interface Crop {
  type: CropType
  stage: 'seed' | 'growing' | 'ready'
  timer: number
}

interface Thief {
  id: string
  position: { x: number, y: number }
  targetPosition: { x: number, y: number } | null
  stealTimer: number | null
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
  selectedCategory: 'plant' | 'build' | 'animals' | null
  soil: Set<string>
  toggleMenu: () => void
  setSelectedCategory: (category: 'plant' | 'build' | 'animals' | null) => void
  placeSoil: (position: string) => void
  buildings: Record<string, 'barn'>
  buildingPreview: {
    type: 'barn' | null
    position: { x: number, y: number } | null
  }
  setBuildingPreview: (type: 'barn' | null, position: { x: number, y: number } | null) => void
  placeBuilding: (type: 'barn', position: { x: number, y: number }) => void
  selectedBuildItem: 'soil' | 'barn' | 'dog' | 'planter' | 'pen' | null
  selectBuildItem: (item: 'soil' | 'barn' | 'dog' | 'planter' | 'pen' | null) => void
  inventory: Record<CropType, number>
  addToInventory: (cropType: CropType) => void
  sellInventory: () => void
  npcs: Record<string, NPC>
  spawnNPC: (type: NPCType, position: { x: number, y: number }) => void
  removeNPC: (id: string) => void
  updateNPCs: () => void
  playerPosition: { x: number, y: number }
  setPlayerPosition: (position: { x: number, y: number } | ((prev: { x: number, y: number }) => { x: number, y: number })) => void
  pets: Pet[]
  spawnPet: (type: PetType, position: { x: number, y: number }) => void
  updatePets: () => void
  thieves: Thief[]
  spawnThief: () => void
  updateThieves: () => void
  buildPreview: {
    valid: boolean;
    show: boolean;
    size: 1 | 3;  // 1 for single tile, 3 for barn/enclosure
  }
  setBuildPreview: (preview: { valid: boolean; show: boolean; size: 1 | 3 }) => void
  animals: { id: string; type: 'chicken'; position: { x: number; y: number } }[];
  selectedAnimal: 'chicken' | null;
  selectAnimal: (type: 'chicken' | null) => void;
  placeAnimal: (type: 'chicken', position: { x: number; y: number }) => void;
  pens: Record<string, { topLeft: { x: number; y: number } }>;
  placePen: (position: { x: number; y: number }) => void;
}

let store = create<GameState>((set, get) => {
  return {
    crops: {},
    money: 1000,
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
    playerPosition: { x: GRID_CENTER, y: GRID_CENTER },
    pets: [],
    thieves: [],
    buildPreview: {
      valid: false,
      show: false,
      size: 1
    },
    animals: [],
    selectedAnimal: null,
    pens: {},

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
            targetPosition: null,
            ...(type === 'dog' ? { patrolPoint: position } : {}),
            ...(type === 'planter' ? { plantTimer: 0 } : {})
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
      
      // Find empty soil spots and ready crops
      const emptySoilSpots = Array.from(state.soil).filter(pos => !state.crops[pos])
      const readyCrops = Object.entries(state.crops)
        .filter(([_, crop]) => crop.stage === 'ready')
        .map(([key, _]) => key)

      // Update planters
      Object.values(newNPCs).forEach(npc => {
        if (npc.type === 'planter') {
          const currentPos = `${Math.round(npc.position.x)},${Math.round(npc.position.y)}`

          // If on a ready crop, harvest it
          if (readyCrops.includes(currentPos)) {
            const crop = state.crops[currentPos]
            if (crop && crop.stage === 'ready') {
              // Add to inventory
              state.inventory[crop.type] = (state.inventory[crop.type] || 0) + 1
              // Remove crop
              const { [currentPos]: _, ...remainingCrops } = state.crops
              state.crops = remainingCrops
              npc.targetPosition = null // Clear target after harvesting
            }
          }
          // If on empty soil and not currently planting, start planting
          else if (emptySoilSpots.includes(currentPos) && !npc.plantTimer) {
            npc.plantTimer = NPC_DATA.planter.plantDelay
          }
          // If planting, count down timer
          else if (npc.plantTimer && npc.plantTimer > 0) {
            npc.plantTimer--
            if (npc.plantTimer === 0) {
              // Plant a random crop
              if (state.soil.has(currentPos) && !state.crops[currentPos]) {
                const cropTypes = Object.keys(CROPS) as CropType[]
                const randomCrop = cropTypes[Math.floor(Math.random() * cropTypes.length)]
                state.crops[currentPos] = {
                  type: randomCrop,
                  stage: 'seed',
                  timer: 0
                }
              }
              npc.targetPosition = null // Clear target after planting
            }
          }
          // If not doing anything, find new target
          else if (!npc.targetPosition) {
            // Prioritize ready crops for harvesting
            if (readyCrops.length > 0) {
              const [x, y] = readyCrops[Math.floor(Math.random() * readyCrops.length)].split(',').map(Number)
              npc.targetPosition = { x, y }
            }
            // Otherwise look for empty soil
            else if (emptySoilSpots.length > 0) {
              const [x, y] = emptySoilSpots[Math.floor(Math.random() * emptySoilSpots.length)].split(',').map(Number)
              npc.targetPosition = { x, y }
            }
          }

          // Move towards target if we have one
          if (npc.targetPosition) {
            const dx = Math.sign(npc.targetPosition.x - npc.position.x)
            const dy = Math.sign(npc.targetPosition.y - npc.position.y)
            
            // Move one square at a time
            if (dx !== 0 || dy !== 0) {
              const moveX = Math.random() < 0.5
              if (moveX && dx !== 0) {
                npc.position.x += dx
              } else if (!moveX && dy !== 0) {
                npc.position.y += dy
              }
            }

            // If reached target, clear it
            if (
              Math.abs(npc.position.x - npc.targetPosition.x) < 0.1 &&
              Math.abs(npc.position.y - npc.targetPosition.y) < 0.1
            ) {
              npc.targetPosition = null
            }
          }
        }
      })

      return {
        npcs: newNPCs,
        crops: state.crops,
        inventory: state.inventory
      }
    }),

    setPlayerPosition: (position) => set((state) => {
      if (typeof position === 'function') {
        return { playerPosition: position(state.playerPosition) }
      }
      return { playerPosition: position }
    }),

    spawnPet: (type, position) => set((state) => {
      if (state.money < PET_DATA[type].price) return state;
      
      return {
        pets: [...state.pets, { 
          id: `pet-${Date.now()}-${Math.random()}`,
          type, 
          position: { ...position }
        }],
        money: state.money - PET_DATA[type].price
      };
    }),

    updatePets: () => set((state) => {
      // Only move every frame
      if (Math.random() > 1/60) return state

      const updatedPets = state.pets.map(pet => {
        // Look for nearest thief
        const nearestThief = state.thieves.reduce((nearest, thief) => {
          const dist = Math.hypot(
            thief.position.x - pet.position.x,
            thief.position.y - pet.position.y
          )
          return !nearest || dist < nearest.dist ? { thief, dist } : nearest
        }, null as { thief: Thief, dist: number } | null)

        // If there's a thief nearby, move towards it
        if (nearestThief) {
          const dx = Math.sign(nearestThief.thief.position.x - pet.position.x)
          const dy = Math.sign(nearestThief.thief.position.y - pet.position.y)

          // Apply pet-specific speed
          const speed = PET_DATA[pet.type].speed

          // Move directly towards thief (no random direction choice)
          if (Math.abs(dx) > Math.abs(dy)) {
            return {
              ...pet,
              position: {
                ...pet.position,
                x: pet.position.x + (dx * speed)
              }
            }
          } else {
            return {
              ...pet,
              position: {
                ...pet.position,
                y: pet.position.y + (dy * speed)
              }
            }
          }
        }

        return pet
      })

      return { pets: updatedPets }
    }),

    spawnThief: () => set((state) => {
      // Only spawn if there are ready crops and less than 2 thieves
      const hasReadyCrops = Object.values(state.crops).some(crop => crop.stage === 'ready')
      if (!hasReadyCrops || state.thieves.length >= 2) return state

      // Pick a random edge position
      const side = Math.floor(Math.random() * 4)
      let position
      switch (side) {
        case 0: // Top
          position = { x: Math.floor(Math.random() * GRID_SIZE), y: 0 }
          break
        case 1: // Right
          position = { x: GRID_SIZE - 1, y: Math.floor(Math.random() * GRID_SIZE) }
          break
        case 2: // Bottom
          position = { x: Math.floor(Math.random() * GRID_SIZE), y: GRID_SIZE - 1 }
          break
        default: // Left
          position = { x: 0, y: Math.floor(Math.random() * GRID_SIZE) }
      }

      const newThief = {
        id: `thief-${Date.now()}-${Math.random()}`,
        position,
        targetPosition: null,
        stealTimer: null
      }

      return {
        thieves: [...state.thieves, newThief]
      }
    }),

    updateThieves: () => set((state) => {
      const readyCrops = Object.entries(state.crops)
        .filter(([_, crop]) => crop.stage === 'ready')
        .map(([key, _]) => {
          const [x, y] = key.split(',').map(Number)
          return { position: { x, y }, key }
        })

      const updatedThieves = state.thieves.map(thief => {
        // Check if any dog is in the same cell
        const isCollidingWithDog = state.pets.some(pet => 
          pet.position.x === thief.position.x && 
          pet.position.y === thief.position.y
        )

        if (isCollidingWithDog) {
          return null // Remove thief on collision
        }

        // Find nearest dog
        const nearestDog = state.pets.reduce((nearest, pet) => {
          const dist = Math.hypot(
            pet.position.x - thief.position.x,
            pet.position.y - thief.position.y
          )
          return !nearest || dist < nearest.dist ? { pet, dist } : nearest
        }, null as { pet: Pet, dist: number } | null)

        // Run away if dog is nearby (within 3 cells)
        if (nearestDog && nearestDog.dist < 3) {
          // Run in opposite direction of dog
          const dx = Math.sign(thief.position.x - nearestDog.pet.position.x)
          const dy = Math.sign(thief.position.y - nearestDog.pet.position.y)
          
          // Choose either horizontal or vertical movement randomly
          const moveHorizontally = Math.random() < 0.5
          const newPosition = {
            x: thief.position.x + (moveHorizontally ? dx : 0),
            y: thief.position.y + (!moveHorizontally ? dy : 0)
          }

          // If would hit edge, remove thief
          if (
            newPosition.x < 0 || newPosition.x >= GRID_SIZE ||
            newPosition.y < 0 || newPosition.y >= GRID_SIZE
          ) {
            return null
          }

          return {
            ...thief,
            position: newPosition,
            stealTimer: null,
            targetPosition: null
          }
        }

        // Normal thief behavior if no dogs nearby
        if (thief.stealTimer !== null) {
          // ... existing stealing logic ...
        } else if (readyCrops.length > 0) {
          // ... existing crop targeting logic ...
        }

        return thief
      }).filter(Boolean) as Thief[]

      return { 
        thieves: updatedThieves,
        crops: state.crops
      }
    }),

    setBuildPreview: (preview) => set({ buildPreview: preview }),

    placePen: (position) => set((state) => {
      if (state.money < 50) return state;

      // Check if area is clear
      for (let y = position.y; y < position.y + 3; y++) {
        for (let x = position.x; x < position.x + 3; x++) {
          const posKey = `${x},${y}`;
          if (state.soil.has(posKey) || state.buildings[posKey]) return state;
        }
      }

      return {
        pens: {
          ...state.pens,
          [`${position.x},${position.y}`]: { topLeft: position }
        },
        money: state.money - 50
      };
    }),

    placeAnimal: (type, position) => set((state) => {
      // Check if position is within a pen
      const isInPen = Object.entries(state.pens).some(([key, pen]) => {
        const [px, py] = key.split(',').map(Number);
        return position.x >= px && position.x < px + 3 &&
               position.y >= py && position.y < py + 3;
      });

      if (!isInPen) return state;

      return {
        animals: [...state.animals, {
          id: `${type}-${Date.now()}`,
          type,
          position
        }],
        money: state.money - 10
      };
    }),

    selectAnimal: (type) => set({ selectedAnimal: type })
  }
})

// Helper function to find enclosed area
function findEnclosure(position: { x: number, y: number }, fences: Set<string>): Set<string> | null {
  const enclosure = new Set<string>()
  const toCheck = [`${position.x},${position.y}`]
  
  while (toCheck.length > 0) {
    const current = toCheck.pop()!
    if (enclosure.has(current)) continue
    
    const [x, y] = current.split(',').map(Number)
    if (fences.has(current)) continue
    
    enclosure.add(current)
    
    // Check adjacent cells
    const adjacent = [
      `${x+1},${y}`, `${x-1},${y}`,
      `${x},${y+1}`, `${x},${y-1}`
    ]
    
    for (const pos of adjacent) {
      if (!fences.has(pos) && !enclosure.has(pos)) {
        toCheck.push(pos)
      }
    }
  }
  
  // Check if enclosure is completely surrounded by fences
  for (const pos of enclosure) {
    const [x, y] = pos.split(',').map(Number)
    const adjacent = [
      `${x+1},${y}`, `${x-1},${y}`,
      `${x},${y+1}`, `${x},${y-1}`
    ]
    
    for (const adjPos of adjacent) {
      if (!enclosure.has(adjPos) && !fences.has(adjPos)) {
        return null // Found a gap in the fence
      }
    }
  }
  
  return enclosure
}

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