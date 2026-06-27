<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  level: number
  score: number
  targetScore: number
  movesLeft: number
  maxMoves: number
}>()

defineEmits<{
  back: []
}>()

// Score bounce animation
const scoreBounce = ref(false)
watch(() => props.score, () => {
  scoreBounce.value = true
  setTimeout(() => { scoreBounce.value = false }, 300)
})
</script>

<template>
  <div class="top-bar">
    <button class="tb-back" @click="$emit('back')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <div class="tb-level-badge">
      <span class="tb-level-num">{{ level }}</span>
    </div>

    <div class="tb-score-area">
      <div class="tb-score-bar">
        <div class="tb-score-fill" :style="{ width: Math.min(100, (score / targetScore) * 100) + '%' }"></div>
      </div>
      <span :class="['tb-score-num', { bounce: scoreBounce }]">{{ score.toLocaleString() }}</span>
    </div>

    <div class="tb-moves">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="tb-moves-icon">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
      <span :class="['tb-moves-num', { 'tb-moves-low': movesLeft <= 5 }]">{{ movesLeft }}</span>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  width: 100%;
  flex-shrink: 0;
}

.tb-back {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.10);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.tb-back:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.05);
}

.tb-back:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.92);
}

.tb-level-badge {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  padding: 3px 10px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.3px;
  line-height: 1.4;
  box-shadow: 0 0 12px rgba(245, 87, 108, 0.3);
}

.tb-level-num {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-weight: 800;
}

.tb-score-area {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tb-score-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 3px;
  overflow: hidden;
  min-width: 40px;
  position: relative;
}

.tb-score-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #ffd43b, #ff922b, #f5576c);
  background-size: 200% 100%;
  transition: width 0.4s ease;
  position: relative;
  animation: barShimmer 3s ease-in-out infinite;
}

@keyframes barShimmer {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
  100% { background-position: 0% 0%; }
}

.tb-score-num {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-size: 14px;
  font-weight: 800;
  color: #ffd43b;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 30px;
  text-align: right;
  transition: transform 0.2s ease;
}

.tb-score-num.bounce {
  animation: scoreBounce 0.3s ease-out;
}

@keyframes scoreBounce {
  0% { transform: scale(1); }
  35% { transform: scale(1.4); color: #fff; text-shadow: 0 0 20px #ffd43b; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.tb-moves {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.06);
  padding: 4px 10px;
  border-radius: 14px;
  flex-shrink: 0;
}

.tb-moves-icon {
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
}

.tb-moves-num {
  font-family: 'Orbitron', 'Nunito', monospace;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  min-width: 16px;
  text-align: center;
}

.tb-moves-low {
  color: #ff6b6b !important;
  animation: pulse 0.8s ease-in-out infinite;
  text-shadow: 0 0 12px rgba(255, 107, 107, 0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
</style>
