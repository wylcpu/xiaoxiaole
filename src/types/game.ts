export interface Position {
  row: number
  col: number
}

export interface Gem {
  id: number
  type: number
  row: number
  col: number
  matched: boolean
  isNew: boolean
  isDestroyed: boolean
  isSelected: boolean
}

export interface LevelConfig {
  level: number
  gridSize: number
  gemTypes: number
  targetScore: number
  maxMoves: number
}

export interface LevelProgress {
  unlocked: number
  stars: Record<number, number>
  highScores: Record<number, number>
}

export type GameState = 'idle' | 'swapping' | 'reverting' | 'matching' | 'removing' | 'dropping' | 'filling' | 'checking'

export type Screen = 'menu' | 'playing' | 'levelComplete' | 'gameOver'

export const GEM_COLORS: { bg: string; shadow: string; highlight: string; symbol: string }[] = [
  { bg: 'linear-gradient(135deg, #FF6B6B, #EE4444)', shadow: '#CC2222', highlight: '#FF9999', symbol: '♥' },
  { bg: 'linear-gradient(135deg, #6BB5FF, #4488EE)', shadow: '#2266CC', highlight: '#99CCFF', symbol: '♦' },
  { bg: 'linear-gradient(135deg, #51CF66, #2B8A3E)', shadow: '#1A6B2E', highlight: '#8CE99A', symbol: '♣' },
  { bg: 'linear-gradient(135deg, #FFD43B, #F0A500)', shadow: '#CC8800', highlight: '#FFE066', symbol: '★' },
  { bg: 'linear-gradient(135deg, #CC5DE8, #8E24AA)', shadow: '#6A1B7A', highlight: '#DA77F2', symbol: '◆' },
  { bg: 'linear-gradient(135deg, #FF922B, #E8590C)', shadow: '#C04400', highlight: '#FFB066', symbol: '●' },
  { bg: 'linear-gradient(135deg, #20C997, #0C8599)', shadow: '#086577', highlight: '#63E6BE', symbol: '▲' },
  { bg: 'linear-gradient(135deg, #F06595, #C2255C)', shadow: '#9C1A4A', highlight: '#F783AC', symbol: '■' },
]
