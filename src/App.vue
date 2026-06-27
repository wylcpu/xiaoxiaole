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

// Background floating particles
const bgParticles = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 5}px`,
  duration: `${18 + Math.random() * 30}s`,
  delay: `${Math.random() * 25}s`,
  drift: `${-30 + Math.random() * 60}px`,
  opacity: 0.08 + Math.random() * 0.25,
}))
</script>

<template>
  <div class="app-container">
    <!-- Enhanced background orbs -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>
    <div class="bg-orb bg-orb-4"></div>
    <div class="bg-orb bg-orb-5"></div>
    <div class="bg-orb bg-orb-6"></div>

    <!-- Floating background particles -->
    <div class="bg-particles">
      <div
        v-for="p in bgParticles"
        :key="p.id"
        class="bg-particle"
        :style="{
          left: p.left,
          width: p.size,
          height: p.size,
          animationDuration: p.duration,
          animationDelay: p.delay,
          '--float-drift': p.drift,
          '--particle-opacity': p.opacity,
        }"
      ></div>
    </div>

    <!-- Subtle grain overlay -->
    <div class="grain-overlay"></div>

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

/* ========== Background Orbs ========== */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: -1;
}

.bg-orb-1 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.18), transparent);
  top: -120px;
  right: -100px;
  animation: orbFloat 12s ease-in-out infinite;
}

.bg-orb-2 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(245, 87, 108, 0.15), transparent);
  bottom: -80px;
  left: -80px;
  animation: orbFloat 15s ease-in-out infinite reverse;
}

.bg-orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(106, 130, 251, 0.12), transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat 18s ease-in-out infinite 2s;
}

.bg-orb-4 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(81, 207, 102, 0.08), transparent);
  top: 10%;
  left: 5%;
  animation: orbFloat 20s ease-in-out infinite 5s;
}

.bg-orb-5 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255, 212, 59, 0.10), transparent);
  bottom: 15%;
  right: 5%;
  animation: orbFloat 14s ease-in-out infinite 3s reverse;
}

.bg-orb-6 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(204, 93, 232, 0.10), transparent);
  top: 30%;
  left: 60%;
  animation: orbFloat 22s ease-in-out infinite 7s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -40px) scale(1.15); }
  66% { transform: translate(-30px, 30px) scale(0.85); }
}

/* ========== Floating Particles ========== */
.bg-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  animation: float-up linear infinite;
  pointer-events: none;
}

/* ========== Grain Overlay ========== */
.grain-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
</style>
