import { CropType, CROPS } from '../../types/crops'
import { useGameStore } from '../../store/gameStore'
import './HUD.scss'

interface HUDProps {
  playerPosition: { x: number; y: number }
}

const BUILDABLE_ITEMS = {
  soil: {
    name: 'Soil',
    emoji: '🟫',
    price: 5,
    description: 'Required for planting crops'
  },
  barn: {
    name: 'Barn',
    emoji: '🏚️',
    price: 100,
    description: 'Store your harvested crops'
  }
}

export function HUD({ playerPosition }: HUDProps) {
  const { 
    money, 
    selectedCrop, 
    selectCrop,
    menuOpen,
    toggleMenu,
    selectedCategory,
    setSelectedCategory,
    setBuildingPreview,
    selectedBuildItem,
    selectBuildItem
  } = useGameStore()

  return (
    <>
      <button 
        className="menu-button"
        onClick={toggleMenu}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div className="menu-tray">
          <div className="menu-header">
            <div className="money-display">💰 ${money}</div>
          </div>

          <div className="category-buttons">
            <button 
              className={`category-button ${selectedCategory === 'plant' ? 'selected' : ''}`}
              onClick={() => setSelectedCategory('plant')}
            >
              🌱 Plant
            </button>
            <button 
              className={`category-button ${selectedCategory === 'build' ? 'selected' : ''}`}
              onClick={() => setSelectedCategory('build')}
            >
              🏗️ Build
            </button>
          </div>

          <div className="menu-content">
            {selectedCategory === 'plant' && (
              <div className="crop-list">
                {(Object.keys(CROPS) as CropType[]).map((cropType) => {
                  const cropData = CROPS[cropType]
                  return (
                    <button
                      key={cropType}
                      className={`item-button ${selectedCrop === cropType ? 'selected' : ''}`}
                      onClick={() => selectCrop(cropType)}
                    >
                      <div className="item-emoji">{cropData.readyEmoji}</div>
                      <div className="item-info">
                        <div className="item-name">{cropData.name}</div>
                        <div className="item-details">
                          Sells for ${cropData.sellPrice}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedCategory === 'build' && (
              <div className="build-list">
                {Object.entries(BUILDABLE_ITEMS).map(([id, item]) => (
                  <button
                    key={id}
                    className={`item-button ${selectedBuildItem === id ? 'selected' : ''}`}
                    onClick={() => selectBuildItem(id as 'soil' | 'barn')}
                  >
                    <div className="item-emoji">{item.emoji}</div>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-details">
                        ${item.price} - {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
} 