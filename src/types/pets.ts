export type PetType = 'dog'

export interface Pet {
  type: PetType
  position: { x: number, y: number }
}

export const PET_DATA = {
  dog: {
    emoji: '🐕',
    price: 50
  }
} 