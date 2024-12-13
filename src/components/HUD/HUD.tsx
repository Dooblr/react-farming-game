import { CropType, CROPS } from '../../types/crops'
import { useGameStore } from '../../store/gameStore'
import './HUD.scss'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimalType, ANIMAL_DATA } from '../../types/animals'

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
  },
  dog: {
    name: 'Watch Dog',
    emoji: '🐕',
    price: 50,
    description: 'Protects your crops from thieves'
  },
  planter: {
    name: 'Auto Planter',
    emoji: '🚜',
    price: 50,
    description: 'Automatically plants crops in empty soil'
  },
  pen: {
    name: 'Animal Pen',
    emoji: '🏕️',
    price: 50,
    description: '3x3 pen for animals'
  }
}

const ANIMALS = {
  chicken: {
    name: 'Chicken',
    emoji: '🐔',
    price: 10,
    description: 'Lays eggs periodically'
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
    selectBuildItem,
    inventory,
    selectedAnimal,
    selectAnimal,
  } = useGameStore()

  return (
    <>
      <motion.button 
        className="menu-button"
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault()
          }
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {menuOpen ? '✕' : '☰'}
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className="menu-tray"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <div className="menu-header">
              <motion.div 
                className="money-display"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                💰 ${money}
              </motion.div>
            </div>

            <motion.div 
              className="inventory-section"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>Inventory</h3>
              {Object.entries(inventory).map(([cropType, amount], index) => {
                const crop = CROPS[cropType as CropType]
                if (amount === 0) return null
                return (
                  <motion.div 
                    key={cropType} 
                    className="inventory-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <span className="inventory-emoji">{crop.readyEmoji}</span>
                    <span className="inventory-name">{crop.name}</span>
                    <span className="inventory-amount">x{amount}</span>
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.div 
              className="category-buttons"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
              <button 
                className={`category-button ${selectedCategory === 'animals' ? 'selected' : ''}`}
                onClick={() => setSelectedCategory('animals')}
              >
                🐄 Animals
              </button>
            </motion.div>

            <motion.div 
              className="menu-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
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
                      onClick={() => selectBuildItem(id as 'soil' | 'barn' | 'dog' | 'planter')}
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

              {selectedCategory === 'animals' && (
                <div className="animal-list">
                  {Object.entries(ANIMALS).map(([type, data]) => (
                    <button
                      key={type}
                      className={`item-button ${selectedAnimal === type ? 'selected' : ''}`}
                      onClick={() => selectAnimal(type as 'chicken')}
                    >
                      <div className="item-emoji">{data.emoji}</div>
                      <div className="item-info">
                        <div className="item-name">{data.name}</div>
                        <div className="item-details">
                          ${data.price} - {data.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 