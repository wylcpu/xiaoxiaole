<script setup lang="ts">
import { computed } from 'vue'
import { GEM_COLORS } from '../types/game'

const props = defineProps<{
  type: number
  selected?: boolean
}>()

const colors = computed(() => GEM_COLORS[props.type] ?? GEM_COLORS[0])
</script>

<template>
  <div
    class="gem-tile"
    :class="{ selected: selected }"
    :style="{
      '--gem-shadow': colors.shadow,
      '--gem-highlight': colors.highlight,
      '--gem-bg': colors.bg,
      background: colors.bg,
      boxShadow: selected
        ? `0 0 24px ${colors.shadow}aa, 0 0 48px ${colors.shadow}44, 0 4px 16px ${colors.shadow}66, inset 0 1px 3px ${colors.highlight}aa`
        : `0 4px 12px ${colors.shadow}55, 0 0 16px ${colors.shadow}22, inset 0 1px 2px ${colors.highlight}88`
    }"
  >
    <!-- Shimmer sweep overlay -->
    <div class="gem-shimmer"></div>
    <!-- Glossy highlight -->
    <div class="gem-gloss"></div>
    <!-- Inner glow -->
    <div class="gem-glow"></div>
    <!-- Symbol -->
    <span class="gem-symbol" :style="{ color: colors.highlight }">{{ colors.symbol }}</span>
  </div>
</template>

<style scoped>
.gem-tile {
  width: 100%;
  height: 100%;
  border-radius: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

/* Corner highlight (existing) */
.gem-tile::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: 50%;
  bottom: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.50), rgba(255,255,255,0.05));
  border-radius: 30% 0 30% 0;
  pointer-events: none;
  z-index: 2;
}

/* Shimmer sweep */
.gem-shimmer {
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(255, 255, 255, 0.25) 45%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.25) 55%,
    transparent 75%
  );
  animation: gemShimmer 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
  transform-origin: center;
}

/* Glossy highlight dot */
.gem-gloss {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.20);
  filter: blur(2px);
  pointer-events: none;
  z-index: 2;
}

/* Inner glow layer */
.gem-glow {
  position: absolute;
  inset: 10%;
  border-radius: 30%;
  background: radial-gradient(circle at 50% 50%, var(--gem-highlight), transparent);
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
  animation: gemPulse 3s ease-in-out infinite;
}

@keyframes gemPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.30; transform: scale(1.1); }
}

.gem-symbol {
  position: relative;
  z-index: 3;
  font-size: clamp(16px, 5vw, 32px);
  font-weight: 800;
  opacity: 0.65;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 12px var(--gem-highlight);
  user-select: none;
  line-height: 1;
}

/* ========== Selected State ========== */
.gem-tile.selected {
  transform: scale(1.12);
  z-index: 5;
  animation: tileSelected 0.6s ease-in-out infinite;
}

.gem-tile.selected::before {
  opacity: 0.8;
}

.gem-tile.selected .gem-shimmer {
  animation: gemShimmer 2s ease-in-out infinite;
  opacity: 0.7;
}

.gem-tile.selected .gem-symbol {
  opacity: 1;
  text-shadow: 0 0 20px var(--gem-highlight), 0 0 40px var(--gem-highlight), 0 0 60px var(--gem-shadow);
}

/* Rainbow glow ring for selected */
.gem-tile.selected::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 35%;
  background: conic-gradient(
    #ff6b6b, #ffd43b, #51cf66, #6bb5ff, #cc5de8, #ff6b6b
  );
  z-index: -1;
  animation: rainbowRotate 1.5s linear infinite;
  opacity: 0.7;
  pointer-events: none;
}

@keyframes rainbowRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.gem-tile:active {
  transform: scale(0.93);
}

.gem-tile.selected:active {
  transform: scale(1.05);
}

@keyframes tileSelected {
  0%, 100% {
    transform: scale(1.12);
  }
  50% {
    transform: scale(1.18);
  }
}

@keyframes gemShimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(25deg); }
  20% { transform: translateX(0%) translateY(0%) rotate(25deg); }
  40% { transform: translateX(100%) translateY(100%) rotate(25deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(25deg); }
}
</style>
