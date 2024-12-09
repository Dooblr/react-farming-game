import { Enemy } from './Enemy'
import { Position } from '../types/common'
import { GRID_SIZE } from '../constants'

export class EnemyManager {
  private enemies: Enemy[] = []
  private spawnTimer: number = 0
  private spawnInterval: number = 10 // seconds

  update(readyCrops: { position: Position, key: string }[], playerPosition: Position): void {
    // Update existing enemies
    this.enemies.forEach(enemy => enemy.update(readyCrops, playerPosition))

    // Remove enemies that have escaped
    this.enemies = this.enemies.filter(enemy => !enemy.shouldBeRemoved())
  }

  placeStaticEnemy(position: Position): void {
    const enemy = new Enemy(position)
    enemy.speed = 0.1  // Slower speed for better gameplay
    this.enemies.push(enemy)
  }

  getEnemies(): Enemy[] {
    return this.enemies
  }

  removeCrop(position: Position): void {
    // Update any enemies targeting this position
    this.enemies.forEach(enemy => {
      if (
        enemy.state === 'stealing' &&
        enemy.targetPosition &&
        enemy.targetPosition.x === position.x &&
        enemy.targetPosition.y === position.y
      ) {
        enemy.state = 'escaping'
      }
    })
  }
} 