import { ref, computed } from 'vue'
import type { Gem, Position, GameState, LevelConfig } from '../types/game'

let nextId = 0

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useGameLogic(levelConfig: LevelConfig) {
  const gridSize = levelConfig.gridSize
  const numTypes = levelConfig.gemTypes

  const board = ref<(Gem | null)[][]>([])
  const score = ref(0)
  const movesLeft = ref(levelConfig.maxMoves)
  const gameState = ref<GameState>('idle')
  const selectedPos = ref<Position | null>(null)
  const scorePopups = ref<{ id: number; score: number; x: number; y: number; key: string }[]>([])
  const combo = ref(0)

  const allGems = computed(() => {
    const gems: Gem[] = []
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const gem = board.value[r]?.[c]
        if (gem && !gem.isDestroyed) gems.push(gem)
      }
    }
    return gems
  })

  function createGem(row: number, col: number, type?: number): Gem {
    return {
      id: nextId++,
      type: type ?? Math.floor(Math.random() * numTypes),
      row,
      col,
      matched: false,
      isNew: true,
      isDestroyed: false,
      isSelected: false,
    }
  }

  function neighbourType(r: number, c: number): number | null {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return null
    return board.value[r][c]?.type ?? null
  }

  function initBoard(): void {
    const newBoard: (Gem | null)[][] = []
    for (let r = 0; r < gridSize; r++) {
      newBoard[r] = []
      for (let c = 0; c < gridSize; c++) {
        let type: number
        do {
          type = Math.floor(Math.random() * numTypes)
        } while (
          (r >= 2 &&
            newBoard[r - 1][c]?.type === type &&
            newBoard[r - 2][c]?.type === type) ||
          (c >= 2 &&
            newBoard[r][c - 1]?.type === type &&
            newBoard[r][c - 2]?.type === type)
        )
        const gem = createGem(r, c, type)
        gem.isNew = false
        newBoard[r][c] = gem
      }
    }
    board.value = newBoard
    score.value = 0
    movesLeft.value = levelConfig.maxMoves
    combo.value = 0
    gameState.value = 'idle'
    selectedPos.value = null
    scorePopups.value = []
  }

  function getGem(row: number, col: number): Gem | null {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null
    return board.value[row]?.[col] ?? null
  }

  function isAdjacent(a: Position, b: Position): boolean {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
  }

  function swapOnly(r1: number, c1: number, r2: number, c2: number): void {
    const temp = board.value[r1][c1]
    board.value[r1][c1] = board.value[r2][c2]
    board.value[r2][c2] = temp

    if (board.value[r1][c1]) {
      board.value[r1][c1]!.row = r1
      board.value[r1][c1]!.col = c1
    }
    if (board.value[r2][c2]) {
      board.value[r2][c2]!.row = r2
      board.value[r2][c2]!.col = c2
    }
  }

  function findMatchGroups(): { positions: Position[]; count: number }[] {
    const groups: { positions: Position[]; count: number }[] = []

    // Horizontal matches
    for (let r = 0; r < gridSize; r++) {
      let c = 0
      while (c < gridSize) {
        const gem = getGem(r, c)
        if (!gem) {
          c++
          continue
        }
        let end = c + 1
        while (end < gridSize) {
          const next = getGem(r, end)
          if (next && next.type === gem.type) end++
          else break
        }
        if (end - c >= 3) {
          const positions: Position[] = []
          for (let i = c; i < end; i++) positions.push({ row: r, col: i })
          groups.push({ positions, count: end - c })
        }
        c = end
      }
    }

    // Vertical matches
    for (let c = 0; c < gridSize; c++) {
      let r = 0
      while (r < gridSize) {
        const gem = getGem(r, c)
        if (!gem) {
          r++
          continue
        }
        let end = r + 1
        while (end < gridSize) {
          const next = getGem(end, c)
          if (next && next.type === gem.type) end++
          else break
        }
        if (end - r >= 3) {
          const positions: Position[] = []
          for (let i = r; i < end; i++) positions.push({ row: i, col: c })
          groups.push({ positions, count: end - r })
        }
        r = end
      }
    }

    return groups
  }

  function matchScore(count: number, comboLevel: number): number {
    const base = count === 3 ? 30 : count === 4 ? 60 : 100
    return base * (comboLevel || 1)
  }

  async function processMatches(): Promise<boolean> {
    let groups = findMatchGroups()
    if (groups.length === 0) return false

    let cascade = 0

    while (groups.length > 0) {
      cascade++
      combo.value = cascade

      // Collect all unique positions and calculate total score
      const posSet = new Set<string>()
      let totalScore = 0
      for (const g of groups) {
        totalScore += matchScore(g.count, cascade)
        for (const p of g.positions) posSet.add(`${p.row},${p.col}`)
      }
      score.value += totalScore

      // Show score popup at the center of matched area
      const positions = Array.from(posSet).map((s) => {
        const [r, c] = s.split(',').map(Number)
        return { row: r, col: c }
      })
      const mid = positions[Math.floor(positions.length / 2)]
      const popupId = Date.now() + Math.random()
      const comboLabel = cascade > 1 ? ` 连击x${cascade}!` : ''
      scorePopups.value.push({
        id: popupId,
        score: totalScore,
        x: mid.col,
        y: mid.row,
        key: comboLabel,
      })
      setTimeout(() => {
        scorePopups.value = scorePopups.value.filter((p) => p.id !== popupId)
      }, 1000)

      // Animate matched state
      gameState.value = 'removing'
      for (const p of positions) {
        const gem = getGem(p.row, p.col)
        if (gem) gem.matched = true
      }
      await delay(400)

      // Remove from board
      for (const p of positions) {
        const gem = getGem(p.row, p.col)
        if (gem) {
          gem.isDestroyed = true
          board.value[p.row][p.col] = null
        }
      }

      // Apply gravity
      gameState.value = 'dropping'
      applyGravity()
      await delay(350)

      // Fill empty
      gameState.value = 'filling'
      fillEmpty()
      await delay(350)

      // Reset flags
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const gem = getGem(r, c)
          if (gem) {
            gem.isNew = false
            gem.matched = false
          }
        }
      }

      // Check for cascading matches
      groups = findMatchGroups()
    }

    combo.value = 0
    return true
  }

  function applyGravity(): void {
    for (let c = 0; c < gridSize; c++) {
      // Collect non-null gems top-to-bottom
      const colGems: Gem[] = []
      for (let r = 0; r < gridSize; r++) {
        const gem = getGem(r, c)
        if (gem) colGems.push(gem)
      }
      // Clear column
      for (let r = 0; r < gridSize; r++) {
        board.value[r][c] = null
      }
      // Place gems at the bottom
      let writeRow = gridSize - 1
      for (let i = colGems.length - 1; i >= 0; i--) {
        const gem = colGems[i]
        gem.row = writeRow
        board.value[writeRow][c] = gem
        writeRow--
      }
    }
  }

  function fillEmpty(): void {
    for (let c = 0; c < gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        if (!getGem(r, c)) {
          board.value[r][c] = createGem(r, c)
        }
      }
    }
  }

  function hasValidMove(): boolean {
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (c + 1 < gridSize) {
          swapOnly(r, c, r, c + 1)
          if (findMatchGroups().length > 0) {
            swapOnly(r, c, r, c + 1)
            return true
          }
          swapOnly(r, c, r, c + 1)
        }
        if (r + 1 < gridSize) {
          swapOnly(r, c, r + 1, c)
          if (findMatchGroups().length > 0) {
            swapOnly(r, c, r + 1, c)
            return true
          }
          swapOnly(r, c, r + 1, c)
        }
      }
    }
    return false
  }

  function reshuffleBoard(): void {
    for (let attempt = 0; attempt < 100; attempt++) {
      // Randomize avoiding initial matches
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const gem = getGem(r, c)
          if (!gem) continue
          let type: number
          do {
            type = Math.floor(Math.random() * numTypes)
          } while (
            (r >= 2 &&
              board.value[r - 1][c]?.type === type &&
              board.value[r - 2][c]?.type === type) ||
            (c >= 2 &&
              board.value[r][c - 1]?.type === type &&
              board.value[r][c - 2]?.type === type)
          )
          gem.type = type
        }
      }
      if (hasValidMove()) return
    }
    // Fallback: full board reset (keeps IDs stable)
    initBoard()
  }

  async function handleSwap(pos1: Position, pos2: Position): Promise<void> {
    if (gameState.value !== 'idle') return
    if (!isAdjacent(pos1, pos2)) return

    // Deselect
    if (selectedPos.value) {
      const prevGem = getGem(selectedPos.value.row, selectedPos.value.col)
      if (prevGem) prevGem.isSelected = false
      selectedPos.value = null
    }

    gameState.value = 'swapping'
    swapOnly(pos1.row, pos1.col, pos2.row, pos2.col)
    await delay(200)

    const groups = findMatchGroups()
    if (groups.length === 0) {
      // Invalid swap → revert
      gameState.value = 'reverting'
      swapOnly(pos1.row, pos1.col, pos2.row, pos2.col)
      await delay(200)
      gameState.value = 'idle'
      return
    }

    // Valid swap
    movesLeft.value--
    await processMatches()

    // Check terminal conditions
    if (movesLeft.value <= 0 || score.value >= levelConfig.targetScore) {
      gameState.value = 'idle'
      return
    }

    // Check if any valid moves remain, otherwise reshuffle
    if (!hasValidMove()) {
      reshuffleBoard()
    }

    gameState.value = 'idle'
  }

  function selectGem(pos: Position): void {
    if (gameState.value !== 'idle') return
    const gem = getGem(pos.row, pos.col)
    if (!gem) return

    if (!selectedPos.value) {
      selectedPos.value = { row: pos.row, col: pos.col }
      gem.isSelected = true
    } else {
      const prev = selectedPos.value
      const prevGem = getGem(prev.row, prev.col)
      if (prevGem) prevGem.isSelected = false

      if (prev.row === pos.row && prev.col === pos.col) {
        // Deselect
        selectedPos.value = null
      } else if (isAdjacent(prev, pos)) {
        // Adjacent → swap
        selectedPos.value = null
        handleSwap(prev, pos)
      } else {
        // Select new gem
        selectedPos.value = { row: pos.row, col: pos.col }
        gem.isSelected = true
      }
    }
  }

  function isWin(): boolean {
    return score.value >= levelConfig.targetScore
  }

  function isLose(): boolean {
    return movesLeft.value <= 0 && score.value < levelConfig.targetScore
  }

  return {
    board,
    score,
    movesLeft,
    gameState,
    selectedPos,
    allGems,
    scorePopups,
    combo,
    initBoard,
    handleSwap,
    selectGem,
    isWin,
    isLose,
    hasValidMove,
  }
}
