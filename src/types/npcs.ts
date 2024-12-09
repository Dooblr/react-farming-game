export type NPCType = 'thief' | 'dog'

export interface NPC {
  id: string
  type: NPCType
  position: { x: number, y: number }
  targetPosition: { x: number, y: number } | null
  stealTimer?: number
}

export const NPC_DATA = {
  thief: {
    emoji: '🦹',
    speed: 1,
    spawnRate: 0.005,
    stealDelay: 10,
  },
  dog: {
    emoji: '🐕',
    speed: 1.5,
    range: 5,
  }
} 