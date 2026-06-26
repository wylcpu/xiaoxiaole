<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Screen } from './types/game'
import { useLevels } from './composables/useLevels'
import { useStorage } from './composables/useStorage'
import LevelSelect from './components/LevelSelect.vue'
import GameView from './components/GameView.vue'
import GameModal from './components/GameModal.vue'

const { getLevelConfig } = useLevels()
const { load, saveLevelScore, reset: resetProgress } = useStorage()
const currentLevelConfig = computed(() => getLevelConfig(currentLevel.value))

const screen = ref<Screen>('menu')
const progress = ref(load())
const currentLevel = ref(1)
const earnedStars = ref(0)
const lastScore = ref(0)
const gameId = ref(0) // increments to force GameView remount

function startGame() {
  gameId.value++
  screen.value = 'playing'
}

function selectLevel(level: number) {
  currentLevel.value = level
  startGame()
}

function goToMenu() {
  screen.value = 'menu'
  progress.value = load()
}

function onWin(score: number, stars: number) {
  lastScore.value = score
  earnedStars.value = stars
  progress.value = saveLevelScore(currentLevel.value, score, stars)
  screen.value = 'levelComplete'
}

function onLose(score: number) {
  lastScore.value = score
  earnedStars.value = 0
  screen.value = 'gameOver'
}

function nextLevel() {
  if (currentLevel.value < 1000) {
    currentLevel.value++
    startGame()
  }
}

function retryLevel() {
  startGame()
}

function handleReset() {
  progress.value = resetProgress()
  currentLevel.value = 1
}
</script>

<template>
  <div class="app-container">
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <!-- Level Select -->
    <LevelSelect
      v-if="screen === 'menu'"
      :progress="progress"
      @select-level="selectLevel"
      @reset="handleReset"
    />

    <!-- Game View (remounts on gameId change) -->
    <GameView
      v-if="screen === 'playing' || screen === 'levelComplete' || screen === 'gameOver'"
      :key="gameId"
      :level="currentLevel"
      @back="goToMenu"
      @win="onWin"
      @lose="onLose"
    />

    <!-- Modal overlay -->
    <GameModal
      :screen="screen"
      :score="lastScore"
      :target-score="currentLevelConfig.targetScore"
      :level="currentLevel"
      :stars="earnedStars"
      :next-level-unlocked="currentLevel < 1000"
      @next-level="nextLevel"
      @retry="retryLevel"
      @menu="goToMenu"
    />
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  width: 100%;
  height: 100dvh;
  height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding:
    env(safe-area-inset-top, 0px)
    max(env(safe-area-inset-right, 0px), 0px)
    env(safe-area-inset-bottom, 0px)
    max(env(safe-area-inset-left, 0px), 0px);
}

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: -1;
}

.bg-orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.15), transparent);
  top: -80px;
  right: -80px;
  animation: orbFloat 12s ease-in-out infinite;
}

.bg-orb-2 {
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(245, 87, 108, 0.12), transparent);
  bottom: -60px;
  left: -60px;
  animation: orbFloat 15s ease-in-out infinite reverse;
}

.bg-orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(106, 130, 251, 0.10), transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat 18s ease-in-out infinite 2s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}
</style>
