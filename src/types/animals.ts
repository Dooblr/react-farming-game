export type AnimalType = 'chicken' | 'cow' | 'sheep'

export interface Animal {
  id: string
  type: AnimalType
  position: { x: number, y: number }
  enclosureKey: string
}

export const ANIMAL_DATA = {
  chicken: {
    emoji: '🐔',
    price: 20,
    description: 'Lays eggs periodically',
    requiredSpace: 4 // Minimum enclosed area needed
  },
  cow: {
    emoji: '🐄',
    price: 50,
    description: 'Produces milk periodically',
    requiredSpace: 9
  },
  sheep: {
    emoji: '🐑',
    price: 35,
    description: 'Produces wool periodically',
    requiredSpace: 6
  }
} 