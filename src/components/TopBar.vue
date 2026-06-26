<script setup lang="ts">
defineProps<{
  level: number
  score: number
  targetScore: number
  movesLeft: number
  maxMoves: number
}>()

defineEmits<{
  back: []
}>()
</script>

<template>
  <div class="top-bar">
    <button class="tb-back" @click="$emit('back')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <div class="tb-level-badge">
      {{ level }}
    </div>

    <div class="tb-score-area">
      <div class="tb-score-bar">
        <div class="tb-score-fill" :style="{ width: Math.min(100, (score / targetScore) * 100) + '%' }"></div>
      </div>
      <span class="tb-score-num">{{ score.toLocaleString() }}</span>
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
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.tb-back:active {
  background: rgba(255, 255, 255, 0.20);
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
  height: 5px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 3px;
  overflow: hidden;
  min-width: 40px;
}

.tb-score-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #ffd43b, #ff922b);
  transition: width 0.4s ease;
}

.tb-score-num {
  font-size: 13px;
  font-weight: 800;
  color: #ffd43b;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 30px;
  text-align: right;
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
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  min-width: 16px;
  text-align: center;
}

.tb-moves-low {
  color: #ff6b6b !important;
  animation: pulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
