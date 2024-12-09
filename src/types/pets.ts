export type PetType = 'dog' | 'fast_dog'

export interface Pet {
  id: string;
  type: PetType;
  position: { x: number; y: number };
}

export const PET_DATA = {
  dog: {
    emoji: '🐕',
    price: 50,
    speed: 1
  },
  fast_dog: {
    emoji: '🐕‍🦺',
    price: 100,
    speed: 2,
    description: 'Moves twice as fast'
  }
} 