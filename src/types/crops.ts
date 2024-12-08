export interface CropData {
  name: string
  seedEmoji: string
  growingEmoji: string
  readyEmoji: string
  growthTime: {
    toSprout: number  // seconds from seed to sprout
    toMature: number  // seconds from sprout to mature
  }
  sellPrice: number
  size: {
    width: number
    height: number
  }
}

export type CropType = 'wheat' | 'carrot' | 'spinach'

export const CROPS: Record<CropType, CropData> = {
  wheat: {
    name: 'Wheat',
    seedEmoji: '🌱',
    growingEmoji: '🌾',
    readyEmoji: '🌾',
    growthTime: {
      toSprout: 3,
      toMature: 5
    },
    sellPrice: 2,
    size: {
      width: 1,
      height: 1
    }
  },
  carrot: {
    name: 'Carrot',
    seedEmoji: '🌱',
    growingEmoji: '🥕',
    readyEmoji: '🥕',
    growthTime: {
      toSprout: 4,
      toMature: 8
    },
    sellPrice: 4,
    size: {
      width: 1,
      height: 1
    }
  },
  spinach: {
    name: 'Spinach',
    seedEmoji: '🌱',
    growingEmoji: '🥬',
    readyEmoji: '🥬',
    growthTime: {
      toSprout: 2,
      toMature: 4
    },
    sellPrice: 3,
    size: {
      width: 1,
      height: 1
    }
  }
} 