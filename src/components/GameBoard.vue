<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Gem, Position, GameState } from '../types/game'
import GemTile from './GemTile.vue'

const props = defineProps<{
  gems: Gem[]
  gridSize: number
  gameState: GameState
  scorePopups: { id: number; score: number; x: number; y: number; key: string }[]
  selectedPos: Position | null
}>()

const emit = defineEmits<{
  select: [pos: Position]
}>()

const boardRef = ref<HTMLElement | null>(null)
const touchStart = ref<{ x: number; y: number; row: number; col: number } | null>(null)

function gemStyle(gem: Gem) {
  const size = 100 / props.gridSize
  return {
    position: 'absolute' as const,
    width: `${size}%`,
    height: `${size}%`,
    left: `${gem.col * size}%`,
    top: `${gem.row * size}%`,
    padding: '4px',
    boxSizing: 'border-box' as const,
  }
}

function onGemClick(gem: Gem) {
  emit('select', { row: gem.row, col: gem.col })
}

// Touch/swipe support
function getCellFromPos(e: MouseEvent | Touch): { row: number; col: number } | null {
  if (!boardRef.value) return null
  const rect = boardRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const col = Math.floor(x / (rect.width / props.gridSize))
  const row = Math.floor(y / (rect.height / props.gridSize))
  if (row < 0 || row >= props.gridSize || col < 0 || col >= props.gridSize) return null
  return { row, col }
}

function onPointerDown(e: PointerEvent) {
  const cell = getCellFromPos(e)
  if (!cell) return
  touchStart.value = { x: e.clientX, y: e.clientY, ...cell }
}

function onPointerUp(e: PointerEvent) {
  if (!touchStart.value) return
  const cell = getCellFromPos(e)
  if (!cell) {
    touchStart.value = null
    return
  }

  const dx = e.clientX - touchStart.value.x
  const dy = e.clientY - touchStart.value.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const threshold = 15

    if (dist > threshold) {
      // Swipe gesture — emit both positions immediately
      let targetRow = touchStart.value.row
      let targetCol = touchStart.value.col
      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1
      } else {
        targetRow += dy > 0 ? 1 : -1
      }
      if (targetRow >= 0 && targetRow < props.gridSize && targetCol >= 0 && targetCol < props.gridSize) {
        emit('select', { row: touchStart.value.row, col: touchStart.value.col })
        nextTick(() => {
          emit('select', { row: targetRow, col: targetCol })
        })
      }
    } else {
      // Tap
      emit('select', cell)
    }

  touchStart.value = null
}
</script>

<template>
  <div
    ref="boardRef"
    class="game-board"
    @pointerdown.prevent="onPointerDown"
    @pointerup.prevent="onPointerUp"
  >
    <!-- Grid background lines -->
    <svg class="board-grid-lines" :viewBox="`0 0 ${gridSize} ${gridSize}`">
      <line
        v-for="i in gridSize - 1" :key="'h' + i"
        :x1="0" :y1="i" :x2="gridSize" :y2="i"
        stroke="rgba(255,255,255,0.06)" stroke-width="0.03"
      />
      <line
        v-for="i in gridSize - 1" :key="'v' + i"
        :x1="i" :y1="0" :x2="i" :y2="gridSize"
        stroke="rgba(255,255,255,0.06)" stroke-width="0.03"
      />
    </svg>

    <!-- Gems -->
    <div
      v-for="gem in gems" :key="gem.id"
      :class="[
        'gem-wrapper',
        {
          matched: gem.matched,
          'is-new': gem.isNew,
          selected: gem.isSelected,
          disabled: gameState !== 'idle',
        }
      ]"
      :style="gemStyle(gem)"
      @click.stop="onGemClick(gem)"
    >
      <GemTile :type="gem.type" :selected="gem.isSelected" />
    </div>

    <!-- Score popups -->
    <div
      v-for="popup in scorePopups" :key="popup.id"
      class="score-popup"
      :style="{
        left: `${(popup.x + 0.5) * (100 / gridSize)}%`,
        top: `${(popup.y + 0.5) * (100 / gridSize)}%`,
      }"
    >
      +{{ popup.score }}{{ popup.key }}
    </div>
  </div>
</template>

<style scoped>
.game-board {
  position: relative;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border: 2px solid rgba(255,255,255,0.08);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.06);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  --board-size: min(calc(100vw - 24px), calc(100dvh - 130px));
  width: var(--board-size);
  height: var(--board-size);
}

.board-grid-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.gem-wrapper {
  transition: top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.25s ease,
              transform 0.25s ease;
  z-index: 1;
}

.gem-wrapper.matched {
  animation: gemMatched 0.3s ease-out forwards;
  z-index: 3;
  pointer-events: none;
}

.gem-wrapper.is-new {
  animation: gemAppear 0.25s ease-out;
}

.gem-wrapper.selected {
  z-index: 2;
  animation: gemSelected 0.8s ease-in-out infinite;
}

.gem-wrapper.disabled {
  pointer-events: none;
}

@keyframes gemMatched {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(0.2);
    opacity: 0;
  }
}

@keyframes gemAppear {
  from {
    transform: scale(0.3) translateY(-12px);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes gemSelected {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
  }
  50% {
    transform: scale(1.06);
    filter: drop-shadow(0 0 14px rgba(255,255,255,0.5));
  }
}

.score-popup {
  position: absolute;
  transform: translate(-50%, -50%);
  color: #ffd43b;
  font-size: clamp(12px, 3vw, 20px);
  font-weight: 800;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,212,59,0.3);
  pointer-events: none;
  z-index: 10;
  animation: scoreFloat 1s ease-out forwards;
  white-space: nowrap;
}

@keyframes scoreFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -80%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -150%) scale(0.8);
  }
}
</style>
