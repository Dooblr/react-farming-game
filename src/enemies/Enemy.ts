import { Position } from '../types/common'
import { NPC_DATA } from '../types/npcs'

export type EnemyState = 'spawning' | 'approaching' | 'stealing' | 'escaping'

export class Enemy {
  id: string
  position: Position
  targetPosition: Position | null
  state: EnemyState
  stealTimer: number
  speed: number

  constructor(spawnPosition: Position) {
    this.id = `thief-${Date.now()}-${Math.random()}`
    this.position = spawnPosition
    this.targetPosition = null
    this.state = 'spawning'
    this.stealTimer = 0
    this.speed = NPC_DATA.thief.speed
  }

  update(readyCrops: { position: Position, key: string }[], playerPosition: Position): void {
    // Always target player
    const dx = playerPosition.x - this.position.x
    const dy = playerPosition.y - this.position.y
    const dist = Math.hypot(dx, dy)

    if (dist > 0) {
      // Move towards player with constant speed
      this.position.x += (dx / dist) * this.speed
      this.position.y += (dy / dist) * this.speed
    }
  }

  private findTarget(readyCrops: { position: Position, key: string }[]): void {
    if (readyCrops.length === 0) {
      this.state = 'escaping'
      this.findEscapePoint()
      return
    }

    const nearestCrop = readyCrops.reduce((nearest, current) => {
      const currentDist = this.distanceTo(current.position)
      const nearestDist = nearest ? this.distanceTo(nearest.position) : Infinity
      return currentDist < nearestDist ? current : nearest
    })

    if (nearestCrop) {
      this.targetPosition = nearestCrop.position
    }
  }

  private findEscapePoint(): void {
    const { x, y } = this.position
    this.targetPosition = {
      x: x < 10 ? -1 : 21,
      y: y < 10 ? -1 : 21
    }
  }

  private distanceTo(target: Position): number {
    return Math.hypot(
      target.x - this.position.x,
      target.y - this.position.y
    )
  }

  private moveTowards(target: Position): void {
    const dx = target.x - this.position.x
    const dy = target.y - this.position.y
    const dist = Math.hypot(dx, dy)
    
    if (dist > 0) {
      this.position.x += (dx / dist) * this.speed
      this.position.y += (dy / dist) * this.speed
    }
  }

  shouldBeRemoved(): boolean {
    return (
      this.state === 'escaping' &&
      (this.position.x < -1 ||
        this.position.y < -1 ||
        this.position.x > 21 ||
        this.position.y > 21)
    )
  }
} 