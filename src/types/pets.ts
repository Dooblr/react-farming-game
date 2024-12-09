export type PetType = 'dog'

export interface Pet {
  type: PetType
  position: { x: number, y: number }
  targetPosition: { x: number, y: number } | null
}

export const PET_DATA = {
  dog: {
    emoji: '🐕',
    price: 50,
    speed: 0.1,  // Slow movement speed
    roamRadius: 5  // How far from spawn point the dog will roam
  }
} 