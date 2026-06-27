<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Screen } from '../types/game'

const props = defineProps<{
  screen: Screen
  score: number
  targetScore: number
  level: number
  stars: number
  nextLevelUnlocked: boolean
}>()

const emit = defineEmits<{
  nextLevel: []
  retry: []
  menu: []
}>()

const isWin = computed(() => props.screen === 'levelComplete')
const isGameOver = computed(() => props.screen === 'gameOver')
const showModal = computed(() => isWin.value || isGameOver.value)

const starDisplay = computed(() => {
  const s = props.stars
  const filled = '⭐'
  const empty = '☆'
  return filled.repeat(s) + empty.repeat(3 - s)
})

// ========== Confetti Particles (Win only) ==========
interface ConfettiPiece {
  id: number
  x: number
  color: string
  size: number
  duration: number
  delay: number
  rotate: number
  shape: 'circle' | 'square'
}

const confetti = ref<ConfettiPiece[]>([])
let confettiTimer = 0

function generateConfetti() {
  const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#6bb5ff', '#cc5de8', '#f093fb', '#ff922b', '#20c997']
  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < 40; i++) {
    pieces.push({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 8,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 1.5,
      rotate: Math.random() * 720,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    })
  }
  confetti.value = pieces
  // Clean up
  clearTimeout(confettiTimer)
  confettiTimer = window.setTimeout(() => {
    confetti.value = []
  }, 4000)
}

// Track which stars are visible (delayed reveal)
const visibleStars = ref(0)
let starTimers: number[] = []

function triggerStarReveal() {
  // Clear previous timers
  starTimers.forEach(t => clearTimeout(t))
  starTimers = []
  visibleStars.value = 0

  if (props.stars > 0) {
    for (let i = 1; i <= props.stars; i++) {
      const timer = window.setTimeout(() => {
        visibleStars.value = i
      }, 300 + i * 400)
      starTimers.push(timer)
    }
  }
}

// Watch for screen changes to trigger effects
watch(() => props.screen, (screen) => {
  if (screen === 'levelComplete') {
    generateConfetti()
    triggerStarReveal()
  } else if (screen === 'gameOver') {
    visibleStars.value = 0
    confetti.value = []
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="$emit('menu')">
        <!-- Confetti layer -->
        <div v-if="isWin" class="confetti-layer">
          <div
            v-for="c in confetti" :key="c.id"
            :class="['confetti-piece', c.shape === 'square' ? 'confetti-square' : 'confetti-circle']"
            :style="{
              left: c.x + '%',
              width: c.size + 'px',
              height: c.size + 'px',
              background: c.color,
              animationDuration: c.duration + 's',
              animationDelay: c.delay + 's',
              '--confetti-rotate': c.rotate + 'deg',
            }"
          ></div>
        </div>

        <div :class="['modal-card', isWin ? 'win' : 'lose']">
          <!-- Win -->
          <template v-if="isWin">
            <div class="icon-row">🎉</div>
            <h2 class="modal-title modal-title-win">恭喜过关！</h2>

            <!-- Stars with delayed reveal -->
            <div class="star-row">
              <span
                v-for="i in 3" :key="i"
                :class="['star-item', { 'star-filled': i <= props.stars, 'star-visible': i <= visibleStars }]"
                :style="{ animationDelay: (0.3 + i * 0.4) + 's' }"
              >
                {{ i <= props.stars ? '⭐' : '☆' }}
              </span>
            </div>

            <div class="score-row">
              <span class="score-num">{{ score.toLocaleString() }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="actions">
              <button v-if="nextLevelUnlocked" class="modal-btn modal-btn-primary" @click="$emit('nextLevel')">
                下一关
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button class="modal-btn modal-btn-secondary" @click="$emit('retry')">再玩一次</button>
              <button class="modal-btn modal-btn-ghost" @click="$emit('menu')">选关</button>
            </div>
          </template>

          <!-- Lose -->
          <template v-else>
            <div class="icon-row">😢</div>
            <h2 class="modal-title modal-title-lose">步数用完了</h2>
            <div class="score-row">
              <span class="score-num lose-score">{{ score.toLocaleString() }}</span>
              <span class="score-label lose-label">/ {{ targetScore.toLocaleString() }}</span>
            </div>
            <div class="actions">
              <button class="modal-btn modal-btn-primary" @click="$emit('retry')">再试一次</button>
              <button class="modal-btn modal-btn-ghost" @click="$emit('menu')">选关</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

/* ========== Confetti Layer ========== */
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 101;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
  opacity: 0.9;
}

.confetti-circle {
  border-radius: 50%;
}

.confetti-square {
  border-radius: 2px;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100dvh + 50px)) rotate(var(--confetti-rotate, 720deg)) scale(0.4);
    opacity: 0;
  }
}

/* ========== Modal Card ========== */
.modal-card {
  background: linear-gradient(160deg, #1e1b4b, #0f0c29);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 28px;
  padding: 36px 28px 28px;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  animation: cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 102;
}

.modal-card.win {
  border-color: rgba(255, 212, 59, 0.15);
  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255, 212, 59, 0.06);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.icon-row {
  font-size: 56px;
  line-height: 1;
  margin-bottom: 4px;
}

.modal-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-align: center;
}

.modal-title-win {
  background: linear-gradient(135deg, #ffd43b, #ff922b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 8px rgba(255, 212, 59, 0.3));
}

.modal-title-lose {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.2);
}

/* ========== Stars with delayed reveal ========== */
.star-row {
  display: flex;
  gap: 6px;
  font-size: 38px;
  line-height: 1.2;
  justify-content: center;
  min-height: 50px;
  align-items: center;
}

.star-item {
  display: inline-block;
  opacity: 0;
  transform: scale(0) rotate(-30deg);
  transition: none;
}

.star-item.star-filled.star-visible {
  animation: star-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes star-pop {
  0% {
    transform: scale(0) rotate(-30deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(5deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.9) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.star-item:not(.star-filled) {
  opacity: 0.4;
  font-size: 32px;
  color: rgba(255,255,255,0.3);
}

.score-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-num {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-size: 44px;
  font-weight: 800;
  color: #ffd43b;
  line-height: 1.1;
  text-shadow: 0 0 20px rgba(255, 212, 59, 0.3);
}

.lose-score {
  color: #ff6b6b;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.2);
}

.score-label {
  font-size: 18px;
  color: rgba(255,255,255,0.4);
}

.lose-label {
  font-size: 18px;
  color: rgba(255,255,255,0.3);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 12px;
}

.modal-btn {
  width: 100%;
  min-height: 50px;
  padding: 12px 20px;
  border-radius: 16px;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  -webkit-tap-highlight-color: transparent;
}

.modal-btn-primary {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  background-size: 200% 200%;
  color: #fff;
  box-shadow: 0 4px 20px rgba(245, 87, 108, 0.35);
  animation: btnGradiant 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.modal-btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15), transparent);
  background-size: 200% 100%;
  animation: btnShimmer 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes btnGradiant {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes btnShimmer {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(100%); }
}

.modal-btn-primary:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 30px rgba(245, 87, 108, 0.5);
}

.modal-btn-primary:active {
  transform: scale(0.97);
  box-shadow: 0 2px 12px rgba(245, 87, 108, 0.25);
}

.modal-btn-secondary {
  background: rgba(255,255,255,0.10);
  color: #fff;
}

.modal-btn-secondary:hover {
  background: rgba(255,255,255,0.16);
  transform: scale(1.02);
}

.modal-btn-secondary:active {
  background: rgba(255,255,255,0.22);
  transform: scale(0.97);
}

.modal-btn-ghost {
  background: transparent;
  color: rgba(255,255,255,0.45);
}

.modal-btn-ghost:hover {
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.05);
}

.modal-btn-ghost:active {
  color: rgba(255,255,255,0.8);
  transform: scale(0.97);
}

/* Transition */
.modal-enter-active {
  transition: opacity 0.3s ease;
}
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
