<script setup lang="ts">
import { reactive, watch } from 'vue'
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
    } else if (val === 0) {
      comboTimeout = window.setTimeout(() => {
        displayCombo.value = 0
      }, 400)
    }
  }
)
</script>

<template>
  <div class="game-view">
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

    <!-- Cascading combo indicator -->
    <Transition name="fade">
      <div v-if="displayCombo.value > 1" :key="displayCombo.key" class="combo-indicator">
        {{ displayCombo.value }}x 连击！
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

.combo-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(24px, 6vw, 48px);
  font-weight: 800;
  color: #ffd43b;
  text-shadow: 0 4px 30px rgba(255, 212, 59, 0.6), 0 0 60px rgba(255, 107, 107, 0.3);
  pointer-events: none;
  animation: comboPop 0.3s ease-out;
  z-index: 50;
  white-space: nowrap;
}

@keyframes comboPop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
