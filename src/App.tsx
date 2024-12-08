import { useEffect, useState } from 'react'
import './App.scss'
import { useGameStore } from './store/gameStore'
import { CropType, CROPS } from './types/crops'
import { HUD } from './components/HUD/HUD'

interface Position {
  x: number
  y: number
}

const GRID_SIZE = 20
const GRID_CENTER = Math.floor(GRID_SIZE / 2)

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
    selectedBuildItem
  } = useGameStore()

  // Add viewport offset state
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })

  // Add mouse position tracking
  const [mouseGridPos, setMouseGridPos] = useState<{ x: number, y: number } | null>(null)

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
    const posKey = `${x},${y}`
    if (selectedBuildItem === 'barn') {
      placeBuilding('barn', { x, y })
    } else if (selectedBuildItem === 'soil') {
      placeSoil(posKey)
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

  return (
    <div className="game-container">
      <HUD playerPosition={playerPosition} />
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
                  (selectedBuildItem === 'soil' && mouseGridPos?.x === x && mouseGridPos?.y === y)
                )

                return (
                  <div 
                    key={`${x}-${y}`} 
                    className={`grid-cell ${soil.has(posKey) ? 'has-soil' : ''} ${isInPreview ? 'building-preview' : ''}`}
                    onMouseEnter={() => handleGridHover(x, y)}
                    onClick={() => handleGridClick(x, y)}
                  >
                    {buildings[posKey] === 'barn' && (
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
