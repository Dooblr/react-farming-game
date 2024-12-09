export type NPCType = 'thief' | 'dog' | 'planter'

export interface NPC {
  id: string
  type: NPCType
  position: { x: number, y: number }
  targetPosition: { x: number, y: number } | null
  stealTimer?: number
  patrolPoint?: { x: number, y: number }
  plantTimer?: number
}

export const NPC_DATA = {
  thief: {
    emoji: '🦹',
    speed: 0.2,
    stealDelay: 5,
    stealRange: 1,
  },
  dog: {
    emoji: '🐕',
    speed: 0.3,
    range: 7,
    patrolRadius: 5,
    patrolSpeed: 0.25
  },
  planter: {
    emoji: '🚜',
    speed: 0.2,
    plantDelay: 3,
    harvestDelay: 2
  }
} 