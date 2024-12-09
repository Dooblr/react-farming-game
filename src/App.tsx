import { useEffect, useState } from 'react'
import './App.scss'
import { useGameStore } from './store/gameStore'
import { CropType, CROPS } from './types/crops'
import { HUD } from './components/HUD/HUD'
import { NPC_DATA } from './types/npcs'
import { GRID_SIZE, GRID_CENTER } from './constants'

interface Position {
  x: number
  y: number
}

function App() {
  const [playerPosition, setPlayerPosition] = useState<Position>({ 
    x: GRID_CENTER, 
    y: GRID_CENTER 
  })
  const { 
    crops, 
    money, 
    selectedCrop,
    plantSeed, 
    updateCrops, 
    harvestCrop,
    selectCrop,
    soil,
    placeSoil,
    selectedCategory,
    buildings,
    buildingPreview,
    setBuildingPreview,
    placeBuilding,
    selectedBuildItem,
    inventory,
    sellInventory,
    npcs,
    spawnNPC,
    updateNPCs
  } = useGameStore()

  // Add viewport offset state
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })

  // Add mouse position tracking
  const [mouseGridPos, setMouseGridPos] = useState<{ x: number, y: number } | null>(null)

  const [showMerchantMenu, setShowMerchantMenu] = useState(false)

  // Add merchant position
  const MERCHANT_POS = { x: 1, y: 1 }

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)

  useEffect(() => {
    console.log('loaded')
  }, [])

  // Update crops growth timer
  useEffect(() => {
    const interval = setInterval(() => {
      updateCrops()
    }, 1000)
    return () => clearInterval(interval)
  }, [updateCrops])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      
      if (key === ' ') {
        const posKey = `${playerPosition.x},${playerPosition.y}`
        
        // Check if player is next to merchant
        const nearMerchant = Math.abs(playerPosition.x - MERCHANT_POS.x) <= 1 && 
                            Math.abs(playerPosition.y - MERCHANT_POS.y) <= 1
        
        if (nearMerchant) {
          setShowMerchantMenu(true)
          return
        }

        if (selectedCategory === 'build') {
          placeSoil(posKey)
        } else if (soil.has(posKey)) {
          if (!crops[posKey]) {
            plantSeed(posKey)
          } else if (crops[posKey].stage === 'ready') {
            harvestCrop(posKey)
          }
        }
        return
      }

      setPlayerPosition(prev => {
        let newPos = { ...prev }
        
        switch (key) {
          case 'w':
            newPos.y = Math.max(0, prev.y - 1)
            break
          case 's':
            newPos.y = Math.min(GRID_SIZE - 1, prev.y + 1)
            break
          case 'a':
            newPos.x = Math.max(0, prev.x - 1)
            break
          case 'd':
            newPos.x = Math.min(GRID_SIZE - 1, prev.x + 1)
            break
        }
        return newPos
      })
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [crops, plantSeed, harvestCrop, playerPosition, selectedCategory])

  // Calculate viewport position to center on player
  useEffect(() => {
    const cellSize = 40 // matches our CSS cell size
    const viewportWidth = 90 * Math.min(window.innerWidth, window.innerHeight) / 100 // 90vmin
    const viewportHeight = viewportWidth

    const targetX = (playerPosition.x * cellSize) - (viewportWidth / 2) + (cellSize / 2)
    const targetY = (playerPosition.y * cellSize) - (viewportHeight / 2) + (cellSize / 2)

    setViewportOffset({
      x: -targetX,
      y: -targetY
    })
  }, [playerPosition])

  const getCropEmoji = (crop: { type: CropType, stage: string }) => {
    const cropData = CROPS[crop.type]
    switch (crop.stage) {
      case 'seed': return cropData.seedEmoji
      case 'growing': return cropData.growingEmoji
      case 'ready': return cropData.readyEmoji
      default: return ''
    }
  }

  const selectedCropData = CROPS[selectedCrop]
  const canPlantHere = (x: number, y: number) => {
    // Check if all required cells are empty and within bounds
    for (let dy = 0; dy < selectedCropData.size.height; dy++) {
      for (let dx = 0; dx < selectedCropData.size.width; dx++) {
        const checkX = x + dx
        const checkY = y + dy
        if (
          checkX >= GRID_SIZE || 
          checkY >= GRID_SIZE || 
          crops[`${checkX},${checkY}`]
        ) {
          return false
        }
      }
    }
    return true
  }

  const handleGridClick = (x: number, y: number) => {
    if (selectedBuildItem === 'soil') {
      setIsDragging(true)
      setDragStart({ x, y })
    } else if (selectedBuildItem === 'barn') {
      placeBuilding('barn', { x, y })
    } else if (selectedBuildItem === 'dog' && money >= 50) {
      spawnNPC('dog', { x, y })
      useGameStore.setState(state => ({ money: state.money - 50 }))
    }
  }

  const handleGridHover = (x: number, y: number) => {
    setMouseGridPos({ x, y })
    if (selectedCategory === 'build' && selectedBuildItem === 'barn') {
      setBuildingPreview('barn', { x, y })
    }
  }

  const handleGridLeave = () => {
    setMouseGridPos(null)
    setBuildingPreview(null, null)
  }

  // Add NPC update interval
  useEffect(() => {
    const interval = setInterval(() => {
      // Random thief spawning
      if (Math.random() < NPC_DATA.thief.spawnRate) {
        // Spawn from random edge of map
        const side = Math.floor(Math.random() * 4)
        let position
        switch (side) {
          case 0: // Top
            position = { x: Math.floor(Math.random() * GRID_SIZE), y: -1 }
            break
          case 1: // Right
            position = { x: GRID_SIZE, y: Math.floor(Math.random() * GRID_SIZE) }
            break
          case 2: // Bottom
            position = { x: Math.floor(Math.random() * GRID_SIZE), y: GRID_SIZE }
            break
          default: // Left
            position = { x: -1, y: Math.floor(Math.random() * GRID_SIZE) }
        }
        spawnNPC('thief', position)
      }
      updateNPCs()
    }, 1000)
    return () => clearInterval(interval)
  }, [spawnNPC, updateNPCs])

  // Add mouse up handler
  const handleMouseUp = () => {
    if (isDragging && dragStart && selectedBuildItem === 'soil') {
      const minX = Math.min(dragStart.x, mouseGridPos?.x ?? dragStart.x)
      const maxX = Math.max(dragStart.x, mouseGridPos?.x ?? dragStart.x)
      const minY = Math.min(dragStart.y, mouseGridPos?.y ?? dragStart.y)
      const maxY = Math.max(dragStart.y, mouseGridPos?.y ?? dragStart.y)

      // Calculate total cost
      const area = (maxX - minX + 1) * (maxY - minY + 1)
      const totalCost = area * 5

      if (money >= totalCost) {
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            placeSoil(`${x},${y}`)
          }
        }
      }
    }
    setIsDragging(false)
    setDragStart(null)
  }

  // Add useEffect for mouse up listener
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [isDragging, dragStart, mouseGridPos, money, selectedBuildItem])

  return (
    <div className="game-container">
      <HUD playerPosition={playerPosition} />
      
      {/* Add merchant menu */}
      {showMerchantMenu && (
        <div className="merchant-menu">
          <div className="merchant-header">
            <h2>Merchant</h2>
            <button className="close-button" onClick={() => setShowMerchantMenu(false)}>✕</button>
          </div>
          
          <div className="merchant-inventory">
            {Object.entries(inventory).map(([cropType, amount]) => {
              const crop = CROPS[cropType as CropType]
              if (amount === 0) return null
              return (
                <div key={cropType} className="merchant-item">
                  <span className="merchant-emoji">{crop.readyEmoji}</span>
                  <span className="merchant-name">{crop.name}</span>
                  <span className="merchant-amount">x{amount}</span>
                  <span className="merchant-price">${crop.sellPrice * amount}</span>
                </div>
              )
            })}
          </div>

          <button 
            className="sell-button"
            onClick={() => {
              sellInventory()
              setShowMerchantMenu(false)
            }}
          >
            Sell All
          </button>
        </div>
      )}

      <div className="game-viewport">
        <div 
          className="game-grid"
          style={{
            transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px)`,
            transition: 'transform 0.2s ease-out'
          }}
          onMouseLeave={handleGridLeave}
        >
          {Array.from({ length: GRID_SIZE }, (_, y) => (
            <div key={y} className="grid-row">
              {Array.from({ length: GRID_SIZE }, (_, x) => {
                const posKey = `${x},${y}`
                const isInPreview = (
                  (selectedBuildItem === 'barn' && buildingPreview.type === 'barn' && 
                    buildingPreview.position &&
                    x >= buildingPreview.position.x && 
                    x < buildingPreview.position.x + 3 &&
                    y >= buildingPreview.position.y && 
                    y < buildingPreview.position.y + 3) ||
                  (selectedBuildItem === 'soil' && isDragging && dragStart && mouseGridPos && 
                    x >= Math.min(dragStart.x, mouseGridPos.x) &&
                    x <= Math.max(dragStart.x, mouseGridPos.x) &&
                    y >= Math.min(dragStart.y, mouseGridPos.y) &&
                    y <= Math.max(dragStart.y, mouseGridPos.y))
                )

                // Check if this is the top-left corner of a barn
                const isBarnOrigin = buildings[posKey] === 'barn' && 
                  !buildings[`${x-1},${y}`] && 
                  !buildings[`${x},${y-1}`]

                return (
                  <div 
                    key={`${x}-${y}`} 
                    className={`grid-cell ${soil.has(posKey) ? 'has-soil' : ''} ${isInPreview ? 'building-preview' : ''}`}
                    onMouseEnter={() => handleGridHover(x, y)}
                    onMouseDown={() => handleGridClick(x, y)}
                  >
                    {isBarnOrigin && (
                      <div className="building barn">🏚️</div>
                    )}
                    {crops[posKey] && (
                      <div className={`crop ${crops[posKey].stage}`}>
                        {getCropEmoji(crops[posKey])}
                      </div>
                    )}
                    {x === playerPosition.x && y === playerPosition.y && (
                      <>
                        <div className="player">🧑‍🌾</div>
                        {canPlantHere(x, y) && (
                          <div 
                            className="planting-preview"
                            style={{
                              width: `${selectedCropData.size.width * 100}%`,
                              height: `${selectedCropData.size.height * 100}%`
                            }}
                          />
                        )}
                      </>
                    )}
                    {/* Add merchant */}
                    {x === MERCHANT_POS.x && y === MERCHANT_POS.y && (
                      <div className="merchant">🤠</div>
                    )}
                    {Object.values(npcs).map(npc => 
                      npc.position.x === x && npc.position.y === y ? (
                        <div key={npc.id} className={`npc ${npc.type}`}>
                          {NPC_DATA[npc.type].emoji}
                        </div>
                      ) : null
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
