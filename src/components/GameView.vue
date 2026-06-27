<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'
import { useLevels } from '../composables/useLevels'
import type { LevelConfig } from '../types/game'
import TopBar from './TopBar.vue'
import GameBoard from './GameBoard.vue'

const props = defineProps<{
  level: number
}>()

const emit = defineEmits<{
  back: []
  win: [score: number, stars: number]
  lose: [score: number]
}>()

const { getLevelConfig, calculateStars } = useLevels()
const levelConfig: LevelConfig = getLevelConfig(props.level)

// Wrap game logic in reactive() so all refs auto-unwrap in template
const game = reactive(useGameLogic(levelConfig))
game.initBoard()

// Watch game state → detect win/lose when idle
watch(
  () => game.gameState,
  (state) => {
    if (state !== 'idle') return
    if (game.isWin()) {
      const stars = calculateStars(game.score, levelConfig.targetScore)
      emit('win', game.score, stars)
    } else if (game.isLose()) {
      emit('lose', game.score)
    }
  }
)

// Combo display with a brief tail
const displayCombo = reactive<{ value: number; key: number }>({ value: 0, key: 0 })
let comboTimeout = 0

watch(
  () => game.combo,
  (val) => {
    if (val > 1) {
      clearTimeout(comboTimeout)
      displayCombo.value = val
      displayCombo.key++
      // Trigger screen flash
      triggerFlash()
    } else if (val === 0) {
      comboTimeout = window.setTimeout(() => {
        displayCombo.value = 0
      }, 400)
    }
  }
)

// Screen flash on combo
const flashVisible = ref(false)
let flashTimer = 0

function triggerFlash() {
  flashVisible.value = true
  clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => {
    flashVisible.value = false
  }, 250)
}
</script>

<template>
  <div class="game-view">
    <!-- Screen flash overlay -->
    <Transition name="flash-fade">
      <div v-if="flashVisible" class="combo-flash"></div>
    </Transition>

    <TopBar
      :level="level"
      :score="game.score"
      :target-score="levelConfig.targetScore"
      :moves-left="game.movesLeft"
      :max-moves="levelConfig.maxMoves"
      @back="emit('back')"
    />

    <div class="board-area">
      <GameBoard
        :gems="game.allGems"
        :grid-size="levelConfig.gridSize"
        :game-state="game.gameState"
        :score-popups="game.scorePopups"
        :selected-pos="game.selectedPos"
        @select="game.selectGem"
      />
    </div>

    <!-- Cascading combo indicator (enhanced) -->
    <Transition name="combo-enter">
      <div v-if="displayCombo.value > 1" :key="displayCombo.key" class="combo-indicator">
        <span class="combo-x">{{ displayCombo.value }}x</span>
        <span class="combo-text">连击！</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.board-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  overflow: hidden;
  min-height: 0;
}

/* ========== Combo Flash Overlay ========== */
.combo-flash {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.20), rgba(255, 212, 59, 0.08) 40%, transparent 70%);
  pointer-events: none;
  z-index: 40;
  animation: flashPulse 0.25s ease-out forwards;
}

@keyframes flashPulse {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

.flash-fade-enter-active,
.flash-fade-leave-active {
  transition: opacity 0.15s ease;
}
.flash-fade-enter-from,
.flash-fade-leave-to {
  opacity: 0;
}

/* ========== Combo Indicator (Enhanced) ========== */
.combo-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  animation: comboAppear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.combo-x {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-size: clamp(36px, 8vw, 64px);
  font-weight: 900;
  background: linear-gradient(135deg, #ffd43b, #ff6b6b, #cc5de8, #6bb5ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 0 20px rgba(255, 212, 59, 0.4)) drop-shadow(0 0 40px rgba(255, 107, 107, 0.2));
  line-height: 1;
}

.combo-text {
  font-size: clamp(14px, 3vw, 24px);
  font-weight: 800;
  color: #fff;
  text-shadow:
    0 0 15px rgba(255, 212, 59, 0.5),
    0 0 30px rgba(255, 107, 107, 0.3);
  letter-spacing: 2px;
}

@keyframes comboAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
}

/* Combo transition */
.combo-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.combo-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.combo-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
</style>
