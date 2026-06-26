<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LevelProgress } from '../types/game'

const props = defineProps<{
  progress: LevelProgress
}>()

const emit = defineEmits<{
  selectLevel: [level: number]
  reset: []
}>()

const TOTAL_LEVELS = 1000

const AREAS = [
  { name: '简单', range: '1-200', start: 1, end: 200, gradient: 'linear-gradient(135deg, #51CF66, #2B8A3E)', shadow: 'rgba(81, 207, 102, 0.3)' },
  { name: '中等', range: '201-500', start: 201, end: 500, gradient: 'linear-gradient(135deg, #FFD43B, #F0A500)', shadow: 'rgba(255, 212, 59, 0.3)' },
  { name: '困难', range: '501-800', start: 501, end: 800, gradient: 'linear-gradient(135deg, #FF922B, #E8590C)', shadow: 'rgba(255, 146, 43, 0.3)' },
  { name: '专家', range: '801-1000', start: 801, end: 1000, gradient: 'linear-gradient(135deg, #FF6B6B, #EE4444)', shadow: 'rgba(255, 107, 107, 0.3)' },
]

const selectedAreaIndex = ref<number | null>(null)
const gridPage = ref(0)

const selectedArea = computed(() => {
  if (selectedAreaIndex.value === null) return null
  return AREAS[selectedAreaIndex.value]
})

// Calculate progress for each area
function areaProgress(areaIndex: number): { done: number; total: number } {
  const area = AREAS[areaIndex]
  let done = 0
  for (let i = area.start; i <= Math.min(props.progress.unlocked, area.end); i++) {
    const stars = props.progress.stars[i]
    if (stars && stars > 0) done++
  }
  return { done, total: area.end - area.start + 1 }
}

// Check if an area contains the current level
function isCurrentArea(areaIndex: number): boolean {
  const area = AREAS[areaIndex]
  return props.progress.unlocked >= area.start && props.progress.unlocked <= area.end
}

// For level grid within area
const levelsInArea = computed(() => {
  if (!selectedArea.value) return []
  const levels: number[] = []
  for (let i = selectedArea.value.start; i <= selectedArea.value.end; i++) {
    levels.push(i)
  }
  return levels
})

const PER_PAGE = 40

const totalPages = computed(() => Math.ceil(levelsInArea.value.length / PER_PAGE))

const visibleLevels = computed(() => {
  const start = gridPage.value * PER_PAGE
  return levelsInArea.value.slice(start, start + PER_PAGE)
})

function getStars(level: number): number {
  return props.progress.stars[level] || 0
}

function isUnlocked(level: number): boolean {
  return level <= props.progress.unlocked
}

function selectArea(index: number) {
  selectedAreaIndex.value = index
  gridPage.value = 0
  // Find page containing current level
  const level = props.progress.unlocked
  if (level >= AREAS[index].start && level <= AREAS[index].end) {
    const relativeLevel = level - AREAS[index].start
    gridPage.value = Math.floor(relativeLevel / PER_PAGE)
  }
}

function goBack() {
  selectedAreaIndex.value = null
  gridPage.value = 0
}

function prevPage() {
  if (gridPage.value > 0) gridPage.value--
}

function nextPage() {
  if (gridPage.value < totalPages.value - 1) gridPage.value++
}

const progressPercent = computed(() => {
  let done = 0
  for (let i = 1; i <= Math.min(props.progress.unlocked, TOTAL_LEVELS); i++) {
    if (props.progress.stars[i] && props.progress.stars[i] > 0) done++
  }
  return Math.round((done / TOTAL_LEVELS) * 100)
})
</script>

<template>
  <!-- Area Selection View -->
  <div v-if="selectedArea === null" class="level-select">
    <div class="ls-header">
      <h1 class="ls-title">消消乐</h1>
      <p class="ls-subtitle">选择区域开始游戏</p>
    </div>

    <div class="ls-progress-row">
      <div class="ls-progress-bar">
        <div class="ls-progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="ls-progress-text">{{ progressPercent }}%</span>
    </div>

    <div class="area-grid">
      <button
        v-for="(area, index) in AREAS"
        :key="index"
        class="area-card"
        :class="{ 'area-current': isCurrentArea(index) }"
        :style="{
          '--area-grad': area.gradient,
          '--area-shadow': area.shadow,
        }"
        @click="selectArea(index)"
      >
        <div class="area-bg"></div>
        <div class="area-content">
          <div class="area-left">
            <span class="area-name">{{ area.name }}</span>
            <span class="area-range">{{ area.range }}</span>
          </div>
          <div class="area-right">
            <span class="area-progress-num">{{ areaProgress(index).done }}</span>
            <span class="area-progress-sep">/</span>
            <span class="area-progress-total">{{ areaProgress(index).total }}</span>
          </div>
        </div>
        <div v-if="isCurrentArea(index)" class="area-current-badge">进行中</div>
      </button>
    </div>

    <button class="ls-reset-btn" @click="$emit('reset')">
      重置进度
    </button>
  </div>

  <!-- Level Grid View -->
  <div v-else class="level-grid-view">
    <div class="lgv-header">
      <button class="lgv-back" @click="goBack">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="lgv-title-area">
        <span class="lgv-area-name">{{ selectedArea.name }}</span>
        <span class="lgv-area-range">{{ selectedArea.range }}</span>
      </div>
      <div class="lgv-progress-mini">
        {{ areaProgress(selectedAreaIndex!).done }}/{{ areaProgress(selectedAreaIndex!).total }}
      </div>
    </div>

    <div class="lgv-grid">
      <button
        v-for="level in visibleLevels"
        :key="level"
        :class="['lgv-btn', {
          locked: !isUnlocked(level),
          current: level === progress.unlocked && getStars(level) === 0,
          completed: getStars(level) > 0,
          starred1: getStars(level) === 1,
          starred2: getStars(level) === 2,
          starred3: getStars(level) === 3,
        }]"
        :disabled="!isUnlocked(level)"
        @click="isUnlocked(level) && emit('selectLevel', level)"
      >
        <span class="lgv-btn-num">{{ level }}</span>
        <span v-if="getStars(level) > 0" class="lgv-btn-stars">
          <span v-for="s in getStars(level)" :key="s">★</span>
        </span>
        <span v-if="level === progress.unlocked && getStars(level) === 0" class="lgv-btn-new">NEW</span>
      </button>
    </div>

    <div class="lgv-pages">
      <button class="lgv-page-btn" :disabled="gridPage === 0" @click="prevPage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="lgv-page-info">{{ gridPage + 1 }} / {{ totalPages }}</span>
      <button class="lgv-page-btn" :disabled="gridPage >= totalPages - 1" @click="nextPage">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ========== AREA SELECTION VIEW ========== */
.level-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  padding: 16px 16px 12px;
  gap: 14px;
}

.ls-header {
  text-align: center;
}

.ls-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 12px rgba(240, 147, 251, 0.3);
  letter-spacing: 2px;
}

.ls-subtitle {
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  margin-top: 2px;
  letter-spacing: 1px;
}

.ls-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 340px;
}

.ls-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}

.ls-progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #f093fb, #f5576c);
  transition: width 0.5s ease;
}

.ls-progress-text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
  min-width: 36px;
  text-align: right;
}

.area-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 380px;
}

.area-card {
  position: relative;
  border: none;
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  aspect-ratio: 1.4;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  min-height: 90px;
  -webkit-tap-highlight-color: transparent;
}

.area-card:active {
  transform: scale(0.96);
}

.area-card.area-current {
  box-shadow: 0 0 0 2px rgba(255,255,255,0.3), 0 4px 24px var(--area-shadow);
}

.area-bg {
  position: absolute;
  inset: 0;
  background: var(--area-grad);
  opacity: 0.85;
}

.area-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 14px 16px;
}

.area-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.area-name {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.area-range {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.area-right {
  display: flex;
  align-items: baseline;
  gap: 2px;
  background: rgba(0,0,0,0.2);
  padding: 4px 10px;
  border-radius: 12px;
}

.area-progress-num {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.area-progress-sep {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.area-progress-total {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
}

.area-current-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  z-index: 2;
}

.ls-reset-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
  padding: 6px 18px;
  border-radius: 16px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.ls-reset-btn:active {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border-color: #ff6b6b;
}

/* ========== LEVEL GRID VIEW ========== */
.level-grid-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  padding: 12px;
  gap: 10px;
}

.lgv-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.lgv-back {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.10);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.lgv-back:active {
  background: rgba(255,255,255,0.20);
}

.lgv-title-area {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.lgv-area-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.lgv-area-range {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
}

.lgv-progress-mini {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.06);
  padding: 4px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

.lgv-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  flex: 1;
  align-content: start;
  padding: 2px;
}

.lgv-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px solid transparent;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  transition: all 0.15s ease;
  min-height: 44px;
  min-width: 44px;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}

.lgv-btn:not(.locked) {
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05));
  color: #fff;
  border-color: rgba(255,255,255,0.08);
}

.lgv-btn:not(.locked):active {
  transform: scale(0.92);
  background: linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.10));
}

.lgv-btn.locked {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.12);
  cursor: not-allowed;
  border-color: transparent;
}

.lgv-btn.current {
  border-color: #f5576c;
  box-shadow: 0 0 20px rgba(245, 87, 108, 0.5);
  animation: currentPulse 2s ease-in-out infinite;
  background: linear-gradient(135deg, rgba(245, 87, 108, 0.20), rgba(245, 87, 108, 0.08));
}

@keyframes currentPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(245, 87, 108, 0.3); }
  50% { box-shadow: 0 0 28px rgba(245, 87, 108, 0.6); }
}

.lgv-btn.completed {
  background: linear-gradient(135deg, rgba(255,212,59,0.10), rgba(255,212,59,0.04));
}

.lgv-btn.starred3 {
  border-color: rgba(255,212,59,0.25);
}

.lgv-btn-num {
  font-size: clamp(12px, 3.2vw, 16px);
  font-weight: 700;
  line-height: 1.1;
}

.lgv-btn-stars {
  font-size: clamp(7px, 1.8vw, 10px);
  line-height: 1;
  color: #ffd43b;
  pointer-events: none;
}

.lgv-btn-new {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 7px;
  font-weight: 800;
  color: #fff;
  background: #f5576c;
  padding: 1px 5px;
  border-radius: 6px;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.lgv-pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 4px 0;
}

.lgv-page-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.10);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.lgv-page-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.lgv-page-btn:not(:disabled):active {
  background: rgba(255,255,255,0.20);
  transform: scale(0.92);
}

.lgv-page-info {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  min-width: 48px;
  text-align: center;
}
</style>
