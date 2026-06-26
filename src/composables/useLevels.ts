import type { LevelConfig } from '../types/game'

export function useLevels() {
  function getLevelConfig(level: number): LevelConfig {
    const gridSize = 8
    let gemTypes: number
    let targetScore: number
    let maxMoves: number

    if (level <= 150) {
      gemTypes = 5
      targetScore = 500 + Math.floor(level * 6)
      maxMoves = 32
    } else if (level <= 350) {
      gemTypes = 6
      targetScore = 1500 + Math.floor((level - 150) * 7)
      maxMoves = Math.max(28, 32 - Math.floor((level - 150) / 50))
    } else if (level <= 600) {
      gemTypes = 6
      targetScore = 3200 + Math.floor((level - 350) * 8)
      maxMoves = Math.max(24, 30 - Math.floor((level - 350) / 40))
    } else if (level <= 800) {
      gemTypes = 7
      targetScore = 5500 + Math.floor((level - 600) * 10)
      maxMoves = Math.max(20, 26 - Math.floor((level - 600) / 50))
    } else {
      gemTypes = 8
      targetScore = 7500 + Math.floor((level - 800) * 12)
      maxMoves = Math.max(18, 24 - Math.floor((level - 800) / 60))
    }

    return {
      level,
      gridSize,
      gemTypes,
      targetScore,
      maxMoves,
    }
  }

  function calculateStars(score: number, targetScore: number): number {
    if (score >= targetScore * 2) return 3
    if (score >= targetScore * 1.3) return 2
    return 1
  }

  return { getLevelConfig, calculateStars }
}
