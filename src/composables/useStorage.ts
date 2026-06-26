import type { LevelProgress } from '../types/game'

const STORAGE_KEY = 'match3_progress'

function getDefaultProgress(): LevelProgress {
  return {
    unlocked: 1,
    stars: {},
    highScores: {},
  }
}

export function useStorage() {
  function load(): LevelProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as LevelProgress
        return {
          unlocked: parsed.unlocked || 1,
          stars: parsed.stars || {},
          highScores: parsed.highScores || {},
        }
      }
    } catch {
      // ignore parse errors
    }
    return getDefaultProgress()
  }

  function save(progress: LevelProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // ignore storage errors
    }
  }

  function saveLevelScore(level: number, score: number, stars: number): LevelProgress {
    const progress = load()
    if (level >= progress.unlocked) {
      progress.unlocked = level + 1
    }
    if (!progress.highScores[level] || score > progress.highScores[level]) {
      progress.highScores[level] = score
    }
    if (!progress.stars[level] || stars > progress.stars[level]) {
      progress.stars[level] = stars
    }
    save(progress)
    return progress
  }

  function reset(): LevelProgress {
    const defaultProgress = getDefaultProgress()
    save(defaultProgress)
    return defaultProgress
  }

  return { load, save, saveLevelScore, reset }
}
