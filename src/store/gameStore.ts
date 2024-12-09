import { create } from 'zustand'
import { CropType, CROPS } from '../types/crops'
import { NPC, NPCType } from '../types/npcs'
import { NPC_DATA } from '../types/npcs'
import { GRID_SIZE, GRID_CENTER } from '../constants'
import { EnemyManager } from '../enemies/EnemyManager'
import { PetType, Pet, PET_DATA } from '../types/pets'

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
  playerPosition: { x: number, y: number }
  setPlayerPosition: (position: { x: number, y: number } | ((prev: { x: number, y: number }) => { x: number, y: number })) => void
  pet: Pet | null
  spawnPet: (type: PetType, position: { x: number, y: number }) => void
  updatePet: () => void
  thieves: Thief[]
  spawnThief: () => void
  updateThieves: () => void
}

let store = create<GameState>((set, get) => {
  const enemyManager = new EnemyManager()
  
  // Place static enemy at (1,1)
  enemyManager.placeStaticEnemy({ x: 1, y: 1 })

  return {
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
    playerPosition: { x: GRID_CENTER, y: GRID_CENTER },
    pet: null,
    thieves: [],

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
      if (type === 'dog') {
        // Add dog directly to NPCs
        const id = `${type}-${Date.now()}-${Math.random()}`
        return {
          npcs: {
            ...state.npcs,
            [id]: {
              id,
              type: 'dog',
              position,
              targetPosition: null,
              patrolPoint: position
            }
          },
          money: state.money - 50
        }
      }

      // For thieves, let the enemy manager handle it
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

      // Get player position from state
      const playerPosition = get().playerPosition

      // Update enemy manager with player position
      enemyManager.update(readyCrops, playerPosition)

      // Convert enemies to NPCs
      const enemies = enemyManager.getEnemies()
      const enemyNPCs = enemies.reduce((acc, enemy) => {
        acc[enemy.id] = {
          id: enemy.id,
          type: 'thief',
          position: enemy.position,
          targetPosition: enemy.targetPosition,
          stealTimer: enemy.stealTimer
        }
        return acc
      }, {} as Record<string, NPC>)

      // Update dogs
      Object.values(newNPCs).forEach(npc => {
        if (npc.type === 'dog') {
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
            const dx = nearestThief.thief.position.x - npc.position.x
            const dy = nearestThief.thief.position.y - npc.position.y
            const dist = Math.hypot(dx, dy)
            npc.position.x += (dx / dist) * NPC_DATA.dog.speed
            npc.position.y += (dy / dist) * NPC_DATA.dog.speed
          } else if (npc.patrolPoint) {
            // No thieves nearby, patrol around spawn point
            if (!npc.targetPosition) {
              // Generate new random patrol point within radius
              const angle = Math.random() * Math.PI * 2
              const distance = Math.random() * NPC_DATA.dog.patrolRadius
              npc.targetPosition = {
                x: npc.patrolPoint.x + Math.cos(angle) * distance,
                y: npc.patrolPoint.y + Math.sin(angle) * distance
              }
            }

            // Move towards patrol point
            const dx = npc.targetPosition.x - npc.position.x
            const dy = npc.targetPosition.y - npc.position.y
            const dist = Math.hypot(dx, dy)

            if (dist < 0.1) {
              // Reached patrol point, clear target to get new one
              npc.targetPosition = null
            } else {
              // Move towards patrol point
              npc.position.x += (dx / dist) * NPC_DATA.dog.patrolSpeed
              npc.position.y += (dy / dist) * NPC_DATA.dog.patrolSpeed
            }
          }
        }
      })

      return {
        npcs: {
          ...enemyNPCs,
          ...Object.fromEntries(
            Object.entries(newNPCs).filter(([_, npc]) => npc.type === 'dog')
          )
        }
      }
    }),

    setPlayerPosition: (position) => set((state) => {
      if (typeof position === 'function') {
        return { playerPosition: position(state.playerPosition) }
      }
      return { playerPosition: position }
    }),

    spawnPet: (type, position) => set((state) => {
      if (state.pet || state.money < PET_DATA[type].price) return state
      
      return {
        pet: { type, position },
        money: state.money - PET_DATA[type].price
      }
    }),

    updatePet: () => set((state) => {
      if (!state.pet) return state

      // Only move every second (assuming 60 FPS)
      if (Math.random() > 1/60) return state

      const pet = { ...state.pet }
      
      // Pick a random direction: up, right, down, or left
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ]
      const direction = directions[Math.floor(Math.random() * directions.length)]
      
      // Calculate new position
      const newX = Math.max(0, Math.min(GRID_SIZE - 1, pet.position.x + direction.x))
      const newY = Math.max(0, Math.min(GRID_SIZE - 1, pet.position.y + direction.y))
      
      pet.position = { x: newX, y: newY }
      return { pet }
    }),

    spawnThief: () => set((state) => {
      // Only spawn if there are ready crops
      const hasReadyCrops = Object.values(state.crops).some(crop => crop.stage === 'ready')
      if (!hasReadyCrops) return state

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

      return {
        thieves: [...state.thieves, {
          id: `thief-${Date.now()}-${Math.random()}`,
          position,
          targetPosition: null,
          stealTimer: null
        }]
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
        // If stealing, count down timer
        if (thief.stealTimer !== null) {
          if (thief.stealTimer > 0) {
            return { ...thief, stealTimer: thief.stealTimer - 1 }
          }
          // Timer finished, steal crop and retreat
          const cropKey = `${thief.position.x},${thief.position.y}`
          if (state.crops[cropKey]?.stage === 'ready') {
            const { [cropKey]: removedCrop, ...remainingCrops } = state.crops
            state.crops = remainingCrops
          }
          // Find nearest edge to retreat
          const edgeX = thief.position.x < GRID_SIZE / 2 ? -1 : GRID_SIZE
          const edgeY = thief.position.y < GRID_SIZE / 2 ? -1 : GRID_SIZE
          return {
            ...thief,
            stealTimer: null,
            targetPosition: { x: edgeX, y: edgeY }
          }
        }

        // If no target and there are crops, find nearest crop
        if (!thief.targetPosition && readyCrops.length > 0) {
          const nearestCrop = readyCrops.reduce((nearest, current) => {
            const currentDist = Math.hypot(
              current.position.x - thief.position.x,
              current.position.y - thief.position.y
            )
            const nearestDist = nearest ? Math.hypot(
              nearest.position.x - thief.position.x,
              nearest.position.y - thief.position.y
            ) : Infinity
            return currentDist < nearestDist ? current : nearest
          })
          return { ...thief, targetPosition: nearestCrop.position }
        }

        // If no crops or already retreating, keep moving to target
        if (thief.targetPosition) {
          const dx = Math.sign(thief.targetPosition.x - thief.position.x)
          const dy = Math.sign(thief.targetPosition.y - thief.position.y)
          const newPosition = {
            x: thief.position.x + dx,
            y: thief.position.y + dy
          }

          // If reached target crop, start stealing
          if (readyCrops.some(crop => 
            crop.position.x === newPosition.x && 
            crop.position.y === newPosition.y
          )) {
            return {
              ...thief,
              position: newPosition,
              stealTimer: 5 // 5 second steal timer
            }
          }

          // If reached edge while retreating, remove thief
          if (
            newPosition.x < 0 || 
            newPosition.y < 0 || 
            newPosition.x >= GRID_SIZE || 
            newPosition.y >= GRID_SIZE
          ) {
            return null
          }

          return {
            ...thief,
            position: newPosition
          }
        }

        // No target and no crops, retreat to nearest edge
        const edgeX = thief.position.x < GRID_SIZE / 2 ? -1 : GRID_SIZE
        const edgeY = thief.position.y < GRID_SIZE / 2 ? -1 : GRID_SIZE
        return {
          ...thief,
          targetPosition: { x: edgeX, y: edgeY }
        }
      }).filter(Boolean)

      return { 
        thieves: updatedThieves,
        crops: state.crops
      }
    })
  }
})

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