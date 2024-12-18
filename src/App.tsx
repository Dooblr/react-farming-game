import { useEffect, useState } from "react";
import "./App.scss";
import { useGameStore } from "./store/gameStore";
import { CropType, CROPS } from "./types/crops";
import { HUD } from "./components/HUD/HUD";
import { NPC_DATA } from "./types/npcs";
import { GRID_SIZE, GRID_CENTER } from "./constants";
import { PET_DATA } from "./types/pets";
import { ANIMAL_DATA } from "./types/animals";

const ANIMALS = {
  chicken: {
    name: 'Chicken',
    emoji: '🐔',
    price: 10,
    description: 'Lays eggs periodically'
  }
};

interface Position {
  x: number;
  y: number;
}

function App() {
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
    updateNPCs,
    playerPosition,
    setPlayerPosition,
    pets,
    spawnPet,
    updatePets,
    setSelectedCategory,
    selectBuildItem,
    menuOpen,
    toggleMenu,
    spawnThief,
    updateThieves,
    thieves,
    selectedAnimal,
    animals,
    placeAnimal,
    buildPreview,
    setBuildPreview,
    updateAnimals,
    selectAnimal,
    pens,
    placePen
  } = useGameStore();

  // Add viewport offset state
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });

  // Add mouse position tracking
  const [mouseGridPos, setMouseGridPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [showMerchantMenu, setShowMerchantMenu] = useState(false);

  // Add merchant position
  const MERCHANT_POS = { x: 1, y: 1 };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );

  // Add a state for preview class
  const [previewClass, setPreviewClass] = useState('');

  useEffect(() => {
    console.log("loaded");
  }, []);

  // Update crops growth timer
  useEffect(() => {
    const interval = setInterval(() => {
      updateCrops();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateCrops]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "escape") {
        // Handle all escape actions in priority order
        if (isDragging) {
          setIsDragging(false);
          setDragStart(null);
          return;
        }
        if (showMerchantMenu) {
          setShowMerchantMenu(false);
          return;
        }
        if (menuOpen) {
          toggleMenu();
          return;
        }
        if (selectedCategory || selectedBuildItem || selectedCrop !== 'wheat' || selectedAnimal) {
          // Clear all selections
          setSelectedCategory(null);
          selectBuildItem(null);
          selectCrop('wheat');
          selectAnimal(null);
          return;
        }
      }

      if (key === " ") {
        const posKey = `${playerPosition.x},${playerPosition.y}`;

        // Check if player is next to merchant
        const nearMerchant =
          Math.abs(playerPosition.x - MERCHANT_POS.x) <= 1 &&
          Math.abs(playerPosition.y - MERCHANT_POS.y) <= 1;

        if (nearMerchant) {
          setShowMerchantMenu(true);
          return;
        }

        // Handle different build items
        if (selectedCategory === "build") {
          if (selectedBuildItem === "soil") {
            placeSoil(posKey);
          } else if (selectedBuildItem === "dog" && money >= 50) {
            spawnPet('dog', playerPosition);
            useGameStore.setState((state) => ({ money: state.money - 50 }));
          }
        } else if (selectedCategory === "animals" && selectedAnimal) {
          // Check if position is within an enclosure
          const enclosure = Object.entries(enclosures).find(([_, enc]) => {
            return playerPosition.x >= enc.topLeft.x && 
                   playerPosition.x < enc.topLeft.x + enc.size.width &&
                   playerPosition.y >= enc.topLeft.y && 
                   playerPosition.y < enc.topLeft.y + enc.size.height;
          });
          
          if (enclosure) {
            placeAnimal(selectedAnimal, playerPosition);
          }
        } else if (soil.has(posKey)) {
          if (!crops[posKey]) {
            plantSeed(posKey);
          } else if (crops[posKey].stage === "ready") {
            harvestCrop(posKey);
          }
        }
        return;
      }

      setPlayerPosition((prev: any) => {
        let newPos = { ...prev };

        switch (key) {
          case "w":
            newPos.y = Math.max(0, prev.y - 1);
            break;
          case "s":
            newPos.y = Math.min(GRID_SIZE - 1, prev.y + 1);
            break;
          case "a":
            newPos.x = Math.max(0, prev.x - 1);
            break;
          case "d":
            newPos.x = Math.min(GRID_SIZE - 1, prev.x + 1);
            break;
        }
        return newPos;
      });
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    crops,
    plantSeed,
    harvestCrop,
    playerPosition,
    selectedCategory,
    selectedBuildItem,
    selectedCrop,
    money,
    setPlayerPosition,
    isDragging,
    showMerchantMenu,
    setSelectedCategory,
    selectBuildItem,
    selectCrop,
    menuOpen,
    toggleMenu,
    selectedAnimal,
    selectAnimal
  ]);

  // Calculate viewport position to center on player
  useEffect(() => {
    const cellSize = 40; // matches our CSS cell size
    const viewportWidth =
      (90 * Math.min(window.innerWidth, window.innerHeight)) / 100; // 90vmin
    const viewportHeight = viewportWidth;

    const targetX =
      playerPosition.x * cellSize - viewportWidth / 2 + cellSize / 2;
    const targetY =
      playerPosition.y * cellSize - viewportHeight / 2 + cellSize / 2;

    setViewportOffset({
      x: -targetX,
      y: -targetY,
    });
  }, [playerPosition]);

  const getCropEmoji = (crop: { type: CropType; stage: string }) => {
    const cropData = CROPS[crop.type];
    switch (crop.stage) {
      case "seed":
        return cropData.seedEmoji;
      case "growing":
        return cropData.growingEmoji;
      case "ready":
        return cropData.readyEmoji;
      default:
        return "";
    }
  };

  const selectedCropData = CROPS[selectedCrop];
  const canPlantHere = (x: number, y: number) => {
    // Check if all required cells are empty and within bounds
    for (let dy = 0; dy < selectedCropData.size.height; dy++) {
      for (let dx = 0; dx < selectedCropData.size.width; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;
        if (
          checkX >= GRID_SIZE ||
          checkY >= GRID_SIZE ||
          crops[`${checkX},${checkY}`]
        ) {
          return false;
        }
      }
    }
    return true;
  };

  const handleGridClick = (x: number, y: number) => {
    const posKey = `${x},${y}`;
    if (selectedBuildItem === "soil") {
      setIsDragging(true);
      setDragStart({ x, y });
    } else if (selectedBuildItem === "barn") {
      placeBuilding("barn", { x, y });
    } else if (selectedBuildItem === "dog" && money >= 50) {
      spawnPet('dog', { x, y });
    } else if (selectedBuildItem === "planter" && money >= 50 && soil.has(posKey)) {
      spawnNPC('planter', { x, y });
      useGameStore.setState(state => ({ money: state.money - 50 }));
    } else if (selectedBuildItem === "pen" && money >= 50) {
      placePen({ x, y });
    } else if (selectedAnimal) {
      // Check if position is within any enclosure
      const enclosure = Object.entries(enclosures).find(([_, enc]) => {
        return x >= enc.topLeft.x && 
               x < enc.topLeft.x + enc.size.width &&
               y >= enc.topLeft.y && 
               y < enc.topLeft.y + enc.size.height;
      });
      
      if (enclosure) {
        const animalData = ANIMAL_DATA[selectedAnimal];
        if (money >= animalData.price) {
          // Check if there's already an animal in this cell
          const isOccupied = animals.some(animal => 
            animal.position.x === x && animal.position.y === y
          );
          
          if (!isOccupied) {
            placeAnimal(selectedAnimal, { x, y });
          }
        }
      }
    }
  };

  const handleGridHover = (x: number, y: number, e: React.MouseEvent) => {
    setMouseGridPos({ x, y });
    
    // Clear any existing preview
    setPreviewClass('');
    
    if (isDragging && dragStart && selectedBuildItem === "soil") {
      const isInSelectedArea =
        x >= Math.min(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
        x <= Math.max(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
        y >= Math.min(dragStart.y, mouseGridPos?.y ?? dragStart.y) &&
        y <= Math.max(dragStart.y, mouseGridPos?.y ?? dragStart.y);

      if (isInSelectedArea) {
        const currentWidth = Math.abs((mouseGridPos?.x ?? dragStart.x) - dragStart.x) + 1;
        const currentHeight = Math.abs((mouseGridPos?.y ?? dragStart.y) - dragStart.y) + 1;
        const totalCost = currentWidth * currentHeight * 5;
        const isAffordable = money >= totalCost;

        setPreviewClass(`soil-preview ${isAffordable ? '' : 'unaffordable'}`);
      }
    } else if (selectedBuildItem) {
      const posKey = `${x},${y}`;
      let isValid = true;
      let size: 1 | 3 = 1;

      switch (selectedBuildItem) {
        case 'pen':
          size = 3;
          isValid = money >= 50;
          // Check 3x3 area for pen placement
          for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
              const checkKey = `${x + dx},${y + dy}`;
              if (soil.has(checkKey) || buildings[checkKey] || 
                  Object.entries(pens).some(([_, pen]) => 
                    x + dx >= pen.topLeft.x && 
                    x + dx < pen.topLeft.x + 3 &&
                    y + dy >= pen.topLeft.y && 
                    y + dy < pen.topLeft.y + 3
                  )) {
                isValid = false;
              }
            }
          }
          break;
        case 'barn':
        case 'dog':
          isValid = money >= 50;
          break;
        case 'planter':
          isValid = soil.has(posKey) && money >= 50;
          break;
      }

      setBuildPreview({
        valid: isValid,
        show: true,
        size
      });
    } else if (selectedAnimal) {
      // Check if position is within a pen
      const isInPen = Object.entries(pens).some(([key, pen]) => {
        const [px, py] = key.split(',').map(Number);
        return x >= px && x < px + 3 &&
               y >= py && y < py + 3;
      });

      setBuildPreview({
        valid: isInPen && money >= 10,  // Chicken costs 10
        show: true,
        size: 1
      });
    }
  };

  const handleGridLeave = () => {
    setMouseGridPos(null);
    setBuildingPreview(null, null);
  };

  // Add mouse up handler
  const handleMouseUp = () => {
    if (isDragging && dragStart && selectedBuildItem === "soil") {
      const minX = Math.min(dragStart.x, mouseGridPos?.x ?? dragStart.x);
      const maxX = Math.max(dragStart.x, mouseGridPos?.x ?? dragStart.x);
      const minY = Math.min(dragStart.y, mouseGridPos?.y ?? dragStart.y);
      const maxY = Math.max(dragStart.y, mouseGridPos?.y ?? dragStart.y);

      // Calculate total cost
      const area = (maxX - minX + 1) * (maxY - minY + 1);
      const totalCost = area * 5;

      if (money >= totalCost) {
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            placeSoil(`${x},${y}`);
          }
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
  };

  // Add useEffect for mouse up listener
  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, dragStart, mouseGridPos, money, selectedBuildItem]);

  // Add function to calculate soil cost
  const calculateSoilCost = (area: number) => area * 5;

  // Add function to check if area is affordable
  const getAffordableArea = (
    start: { x: number; y: number },
    current: { x: number; y: number }
  ) => {
    const width = Math.abs(current.x - start.x) + 1;
    const height = Math.abs(current.y - start.y) + 1;
    const totalArea = width * height;
    const cost = calculateSoilCost(totalArea);

    if (cost <= money) {
      return { width, height, affordable: true };
    }

    // Calculate maximum affordable area
    const maxArea = Math.floor(money / 5);
    const maxWidth = Math.min(width, Math.floor(Math.sqrt(maxArea)));
    const maxHeight = Math.min(height, Math.floor(maxArea / maxWidth));

    return {
      width: maxWidth,
      height: maxHeight,
      affordable: false,
    };
  };

  // Add update interval for pet movement
  useEffect(() => {
    const interval = setInterval(() => {
      updatePets()
    }, 1000/60) // 60 FPS for smooth movement
    return () => clearInterval(interval)
  }, [updatePets])

  // Add NPC update interval
  useEffect(() => {
    const interval = setInterval(() => {
      updateNPCs()
    }, 1000) // Update every second
    return () => clearInterval(interval)
  }, [updateNPCs])

  // Add thief spawning interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance each second
        spawnThief()
      }
      updateThieves()
    }, 1000)
    return () => clearInterval(interval)
  }, [spawnThief, updateThieves])

  return (
    <div className="game-container">
      <HUD playerPosition={playerPosition} />

      {/* Add merchant menu */}
      {showMerchantMenu && (
        <div className="merchant-menu">
          <div className="merchant-header">
            <h2>Merchant</h2>
            <button
              className="close-button"
              onClick={() => setShowMerchantMenu(false)}
            >
              ✕
            </button>
          </div>

          <div className="merchant-inventory">
            {Object.entries(inventory).map(([cropType, amount]) => {
              const crop = CROPS[cropType as CropType];
              if (amount === 0) return null;
              return (
                <div key={cropType} className="merchant-item">
                  <span className="merchant-emoji">{crop.readyEmoji}</span>
                  <span className="merchant-name">{crop.name}</span>
                  <span className="merchant-amount">x{amount}</span>
                  <span className="merchant-price">
                    ${crop.sellPrice * amount}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            className="sell-button"
            onClick={() => {
              sellInventory();
              setShowMerchantMenu(false);
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
            transition: "transform 0.2s ease-out",
          }}
          onMouseLeave={handleGridLeave}
        >
          {Array.from({ length: GRID_SIZE }, (_, y) => (
            <div key={y} className="grid-row">
              {Array.from({ length: GRID_SIZE }, (_, x) => {
                const posKey = `${x},${y}`;

                let previewClass = "";
                if (isDragging && dragStart && selectedBuildItem === "soil") {
                  const isInSelectedArea =
                    x >= Math.min(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
                    x <= Math.max(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
                    y >= Math.min(dragStart.y, mouseGridPos?.y ?? dragStart.y) &&
                    y <= Math.max(dragStart.y, mouseGridPos?.y ?? dragStart.y);

                  if (isInSelectedArea) {
                    const currentWidth = Math.abs((mouseGridPos?.x ?? dragStart.x) - dragStart.x) + 1;
                    const currentHeight = Math.abs((mouseGridPos?.y ?? dragStart.y) - dragStart.y) + 1;
                    const totalCost = currentWidth * currentHeight * 5;
                    const isAffordable = money >= totalCost;

                    previewClass = `soil-preview ${isAffordable ? '' : 'unaffordable'}`;
                  }
                } else if (selectedBuildItem === "barn") {
                  const isInPreview =
                    buildingPreview.type === "barn" &&
                    buildingPreview.position &&
                    x >= buildingPreview.position.x &&
                    x < buildingPreview.position.x + 3 &&
                    y >= buildingPreview.position.y &&
                    y < buildingPreview.position.y + 3;

                  if (isInPreview) {
                    previewClass =
                      money >= 100
                        ? "building-preview"
                        : "building-preview-unaffordable";
                  }
                } else if (selectedBuildItem === "dog") {
                  const isInPreview =
                    x === mouseGridPos?.x && y === mouseGridPos?.y;
                  if (isInPreview) {
                    previewClass =
                      money >= 50
                        ? "building-preview"
                        : "building-preview-unaffordable";
                  }
                } else if (selectedBuildItem === "planter") {
                  const isInPreview = x === mouseGridPos?.x && y === mouseGridPos?.y;
                  if (isInPreview && soil.has(posKey)) { // Only show preview on soil
                    previewClass = money >= 50
                      ? "building-preview"
                      : "building-preview-unaffordable";
                  }
                }

                // Check if this is the top-left corner of a barn
                const isBarnOrigin =
                  buildings[posKey] === "barn" &&
                  !buildings[`${x - 1},${y}`] &&
                  !buildings[`${x},${y - 1}`];

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`grid-cell ${soil.has(posKey) ? "has-soil" : ""}`}
                    onMouseEnter={(e) => handleGridHover(x, y, e)}
                    onMouseDown={() => handleGridClick(x, y)}
                  >
                    {/* Show soil preview when dragging */}
                    {isDragging && dragStart && selectedBuildItem === "soil" && (() => {
                      const isInSelectedArea =
                        x >= Math.min(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
                        x <= Math.max(dragStart.x, mouseGridPos?.x ?? dragStart.x) &&
                        y >= Math.min(dragStart.y, mouseGridPos?.y ?? dragStart.y) &&
                        y <= Math.max(dragStart.y, mouseGridPos?.y ?? dragStart.y);

                      if (isInSelectedArea) {
                        const currentWidth = Math.abs((mouseGridPos?.x ?? dragStart.x) - dragStart.x) + 1;
                        const currentHeight = Math.abs((mouseGridPos?.y ?? dragStart.y) - dragStart.y) + 1;
                        const totalCost = currentWidth * currentHeight * 5;
                        const isAffordable = money >= totalCost;

                        return (
                          <div className={`soil-preview ${isAffordable ? '' : 'unaffordable'}`} />
                        );
                      }
                      return null;
                    })()}

                    {/* Rest of cell content */}
                    {isBarnOrigin && <div className="building barn">🏰</div>}
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
                              height: `${selectedCropData.size.height * 100}%`,
                            }}
                          />
                        )}
                      </>
                    )}
                    {/* Add merchant */}
                    {x === MERCHANT_POS.x && y === MERCHANT_POS.y && (
                      <div className="merchant">🤠</div>
                    )}
                    {Object.values(npcs).map((npc) =>
                      npc.position.x === x && npc.position.y === y ? (
                        <div key={npc.id} className={`npc ${npc.type}`}>
                          {NPC_DATA[npc.type].emoji}
                        </div>
                      ) : null
                    )}
                    {pets.map(pet => 
                      pet.position.x === x && pet.position.y === y && (
                        <div key={pet.id} className={`pet ${pet.type}`}>
                          {PET_DATA[pet.type].emoji}
                        </div>
                      )
                    )}
                    {/* Add thieves */}
                    {thieves.map(thief => 
                      thief.position.x === x && thief.position.y === y ? (
                        <div key={thief.id} className="thief">👿</div>
                      ) : null
                    )}
                    
                    {/* Show build preview */}
                    {mouseGridPos?.x === x && mouseGridPos?.y === y && (
                      <>
                        {buildPreview.show && (
                          <div 
                            className={`build-preview ${buildPreview.valid ? 'valid' : 'invalid'} ${
                              buildPreview.size === 3 ? 'large pen-preview' : ''
                            }`}
                          >
                            {selectedAnimal && buildPreview.valid && (
                              <div className="animal-emoji">{ANIMAL_DATA[selectedAnimal].emoji}</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {/* Render pens */}
                    {Object.entries(pens).map(([key, pen]) => {
                      const [px, py] = key.split(',').map(Number);
                      const isInPen = 
                        x >= px && x < px + 3 &&
                        y >= py && y < py + 3;
                      
                      if (isInPen) {
                        return (
                          <div 
                            key={`pen-${key}`}
                            className={`pen ${
                              x === px ? 'left-wall' : ''
                            } ${
                              x === px + 2 ? 'right-wall' : ''
                            } ${
                              y === py ? 'top-wall' : ''
                            } ${
                              y === py + 2 ? 'bottom-wall' : ''
                            }`}
                          />
                        );
                      }
                      return null;
                    })}

                    {/* Render animals */}
                    {animals.map(animal => 
                      animal.position.x === x && animal.position.y === y && (
                        <div key={animal.id} className="animal">
                          {ANIMALS[animal.type].emoji}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
