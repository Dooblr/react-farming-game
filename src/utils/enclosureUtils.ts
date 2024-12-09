export function findEnclosure(position: { x: number, y: number }, fences: Set<string>): Set<string> | null {
  const enclosure = new Set<string>()
  const toCheck = [`${position.x},${position.y}`]
  
  while (toCheck.length > 0) {
    const current = toCheck.pop()!
    if (enclosure.has(current)) continue
    
    const [x, y] = current.split(',').map(Number)
    if (fences.has(current)) continue
    
    enclosure.add(current)
    
    // Check adjacent cells
    const adjacent = [
      `${x+1},${y}`, `${x-1},${y}`,
      `${x},${y+1}`, `${x},${y-1}`
    ]
    
    for (const pos of adjacent) {
      if (!fences.has(pos) && !enclosure.has(pos)) {
        toCheck.push(pos)
      }
    }
  }
  
  // Check if enclosure is completely surrounded by fences
  for (const pos of enclosure) {
    const [x, y] = pos.split(',').map(Number)
    const adjacent = [
      `${x+1},${y}`, `${x-1},${y}`,
      `${x},${y+1}`, `${x},${y-1}`
    ]
    
    for (const adjPos of adjacent) {
      if (!enclosure.has(adjPos) && !fences.has(adjPos)) {
        return null // Found a gap in the fence
      }
    }
  }
  
  return enclosure
} 