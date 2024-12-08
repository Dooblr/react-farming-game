import { CropType, CROPS } from '../../types/crops'
import { useGameStore } from '../../store/gameStore'
import './HUD.scss'
import { useEffect } from 'react';

interface HUDProps {
  playerPosition: { x: number; y: number }
}

export function HUD({ playerPosition }: HUDProps) {
  const { money, selectedCrop, selectCrop } = useGameStore()
  const selectedCropData = CROPS[selectedCrop]

  // Calculate the cells that would be affected by planting
  const affectedCells = []
  for (let y = 0; y < selectedCropData.size.height; y++) {
    for (let x = 0; x < selectedCropData.size.width; x++) {
      affectedCells.push({
        x: playerPosition.x + x,
        y: playerPosition.y + y
      })
    }
  }

  return (
    <div className="hud">
      <div className="hud-money">Money: ${money}</div>
      <div className="crop-selector">
        {(Object.keys(CROPS) as CropType[]).map((cropType) => {
          const cropData = CROPS[cropType]
          return (
            <button
              key={cropType}
              className={`crop-button ${selectedCrop === cropType ? 'selected' : ''}`}
              onClick={() => selectCrop(cropType)}
            >
              <div className="crop-button-content">
                <span className="crop-emoji">{cropData.readyEmoji}</span>
                <div className="crop-info">
                  <span className="crop-name">{cropData.name}</span>
                  <span className="crop-details">
                    ${cropData.sellPrice} • {cropData.growthTime.toSprout + cropData.growthTime.toMature}s
                  </span>
                </div>
              </div>
              {cropData.size.width > 1 || cropData.size.height > 1 ? (
                <div className="crop-size">
                  {cropData.size.width}x{cropData.size.height}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
      {/* <div className="planting-info">
        Space to {selectedCropData.name.toLowerCase()}
      </div> */}
    </div>
  )
} 