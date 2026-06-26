<script setup lang="ts">
import { computed } from 'vue'
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

const starDisplay = computed(() => {
  const s = props.stars
  const filled = '⭐'
  const empty = '☆'
  return filled.repeat(s) + empty.repeat(3 - s)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isWin || isGameOver" class="modal-overlay" @click.self="$emit('menu')">
        <div :class="['modal-card', isWin ? 'win' : 'lose']">
          <!-- Win -->
          <template v-if="isWin">
            <div class="icon-row">🎉</div>
            <h2 class="modal-title">恭喜过关！</h2>
            <div class="star-row">{{ starDisplay }}</div>
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
            <h2 class="modal-title">步数用完了</h2>
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

.star-row {
  font-size: 36px;
  letter-spacing: 6px;
  line-height: 1.2;
}

.score-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-num {
  font-size: 44px;
  font-weight: 800;
  color: #ffd43b;
  line-height: 1.1;
}

.lose-score {
  color: #ff6b6b;
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
  color: #fff;
  box-shadow: 0 4px 20px rgba(245, 87, 108, 0.35);
}

.modal-btn-primary:active {
  transform: scale(0.97);
  box-shadow: 0 2px 12px rgba(245, 87, 108, 0.25);
}

.modal-btn-secondary {
  background: rgba(255,255,255,0.10);
  color: #fff;
}

.modal-btn-secondary:active {
  background: rgba(255,255,255,0.18);
  transform: scale(0.97);
}

.modal-btn-ghost {
  background: transparent;
  color: rgba(255,255,255,0.45);
}

.modal-btn-ghost:active {
  color: rgba(255,255,255,0.7);
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
