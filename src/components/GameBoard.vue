<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Gem, Position, GameState } from '../types/game'
import { GEM_COLORS } from '../types/game'
import GemTile from './GemTile.vue'

const props = defineProps<{
  gems: Gem[]
  gridSize: number
  gameState: GameState
  scorePopups: { id: number; score: number; x: number; y: number; key: string }[]
  selectedPos: Position | null
}>()

// Grid dots at intersections
const gridDots = computed(() => {
  const dots: { row: number; col: number }[] = []
  for (let r = 0; r < props.gridSize; r++) {
    for (let c = 0; c < props.gridSize; c++) {
      dots.push({ row: r, col: c })
    }
  }
  return dots
})

const emit = defineEmits<{
  select: [pos: Position]
}>()

const boardRef = ref<HTMLElement | null>(null)
const touchStart = ref<{ x: number; y: number; row: number; col: number } | null>(null)

// ========== Particle System ==========
interface Particle {
  id: number
  x: number
  y: number
  color: string
  tx: number
  ty: number
  size: number
  delay: number
}

const particles = ref<Particle[]>([])
let particleId = 0

function spawnBurst(gem: Gem) {
  const color = GEM_COLORS[gem.type]?.shadow || '#fff'
  const cx = (gem.col + 0.5) * (100 / props.gridSize)
  const cy = (gem.row + 0.5) * (100 / props.gridSize)

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const speed = 6 + Math.random() * 6
    const id = particleId++
    particles.value.push({
      id,
      x: cx,
      y: cy,
      color,
      tx: Math.cos(angle) * speed,
      ty: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.08,
    })
    // Self-destruct
    setTimeout(() => {
      particles.value = particles.value.filter(p => p.id !== id)
    }, 900)
  }
}

// Watch for matched gems to spawn particles
watch(() => props.gameState, (state) => {
  if (state === 'removing') {
    for (const gem of props.gems) {
      if (gem.matched) {
        spawnBurst(gem)
      }
    }
  }
})

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
    <!-- Board glow border -->
    <div class="board-glow-border"></div>

    <!-- Grid background lines (enhanced) -->
    <svg class="board-grid-lines" :viewBox="`0 0 ${gridSize} ${gridSize}`" preserveAspectRatio="none">
      <line
        v-for="i in gridSize - 1" :key="'h' + i"
        :x1="0" :y1="i" :x2="gridSize" :y2="i"
        stroke="rgba(255,255,255,0.08)" stroke-width="0.025"
      />
      <line
        v-for="i in gridSize - 1" :key="'v' + i"
        :x1="i" :y1="0" :x2="i" :y2="gridSize"
        stroke="rgba(255,255,255,0.08)" stroke-width="0.025"
      />
    </svg>

    <!-- Background dots at intersections -->
    <div class="board-dots">
      <div
        v-for="dot in gridDots" :key="'dot-' + dot.row + '-' + dot.col"
        class="board-dot"
        :style="{
          left: ((dot.col + 0.5) / gridSize * 100) + '%',
          top: ((dot.row + 0.5) / gridSize * 100) + '%',
        }"
      ></div>
    </div>

    <!-- Particle layer -->
    <div class="particle-layer">
      <div
        v-for="p in particles" :key="p.id"
        class="particle"
        :style="{
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          background: p.color,
          '--tx': p.tx + 'px',
          '--ty': p.ty + 'px',
          animationDelay: p.delay + 's',
        }"
      ></div>
    </div>

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

    <!-- Score popups (enhanced) -->
    <div
      v-for="popup in scorePopups" :key="popup.id"
      class="score-popup"
      :style="{
        left: `${(popup.x + 0.5) * (100 / gridSize)}%`,
        top: `${(popup.y + 0.5) * (100 / gridSize)}%`,
      }"
    >
      <span class="score-popup-num">+{{ popup.score.toLocaleString() }}</span>
      <span v-if="popup.key" class="score-popup-combo">{{ popup.key }}</span>
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
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 0 30px rgba(106, 130, 251, 0.06),
    0 0 60px rgba(106, 130, 251, 0.03);
  overflow: visible;
  touch-action: none;
  user-select: none;
  --board-size: min(calc(100vw - 24px), calc(100dvh - 130px));
  width: var(--board-size);
  height: var(--board-size);
}

/* ========== Board Glow Border ========== */
.board-glow-border {
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.15), rgba(106, 130, 251, 0.15), rgba(81, 207, 102, 0.10));
  z-index: -1;
  animation: borderGlow 4s ease-in-out infinite alternate;
  filter: blur(4px);
  pointer-events: none;
}

@keyframes borderGlow {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.02);
  }
}

/* ========== Grid Lines ========== */
.board-grid-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ========== Board Dots ========== */
.board-dots {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.board-dot {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  transform: translate(-50%, -50%);
}

/* ========== Particle Layer ========== */
.particle-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
  overflow: visible;
}

.particle {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: particleBurst 0.7s ease-out forwards;
  pointer-events: none;
  box-shadow: 0 0 6px currentColor, 0 0 12px currentColor;
}

@keyframes particleBurst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.1);
  }
}

/* ========== Gem Wrapper ========== */
.gem-wrapper {
  transition: top 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.25s ease,
              transform 0.25s ease;
  z-index: 1;
}

.gem-wrapper.matched {
  animation: gemMatched 0.35s ease-out forwards;
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
  25% {
    transform: scale(1.25);
    opacity: 0.9;
  }
  100% {
    transform: scale(0.1);
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
    filter: drop-shadow(0 0 8px rgba(255,255,255,0.3));
  }
  50% {
    transform: scale(1.06);
    filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));
  }
}

/* ========== Score Popups (enhanced) ========== */
.score-popup {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
  animation: scoreFloat 1s ease-out forwards;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.score-popup-num {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-size: clamp(14px, 3.5vw, 24px);
  font-weight: 800;
  color: #ffd43b;
  text-shadow:
    0 0 10px rgba(255, 212, 59, 0.6),
    0 0 30px rgba(255, 212, 59, 0.3),
    0 2px 8px rgba(0,0,0,0.5);
  animation: scoreNumPop 0.3s ease-out;
}

.score-popup-combo {
  font-size: clamp(10px, 2.5vw, 16px);
  font-weight: 800;
  color: #ff6b6b;
  text-shadow:
    0 0 8px rgba(255, 107, 107, 0.5),
    0 0 20px rgba(255, 107, 107, 0.2);
  animation: comboLabelPop 0.3s ease-out;
}

@keyframes scoreFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.3);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -80%) scale(1.3) rotate(-5deg);
  }
  40% {
    transform: translate(-50%, -100%) scale(1.1) rotate(3deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -180%) scale(0.8) rotate(0deg);
  }
}

@keyframes scoreNumPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes comboLabelPop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
