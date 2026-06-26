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
      background: colors.bg,
      boxShadow: selected
        ? `0 0 20px ${colors.shadow}88, 0 4px 12px ${colors.shadow}44, inset 0 1px 2px ${colors.highlight}88`
        : `0 3px 8px ${colors.shadow}44, inset 0 1px 2px ${colors.highlight}88`
    }"
  >
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
}

.gem-tile::after {
  content: '';
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  filter: blur(2px);
  pointer-events: none;
}

.gem-tile.selected {
  transform: scale(1.1);
  z-index: 5;
  animation: tileSelected 0.8s ease-in-out infinite;
}

.gem-tile.selected::before {
  opacity: 0.7;
}

.gem-symbol {
  position: relative;
  z-index: 1;
  font-size: clamp(16px, 5vw, 32px);
  font-weight: 800;
  opacity: 0.55;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  user-select: none;
  line-height: 1;
}

.gem-tile:active {
  transform: scale(0.93);
}

.gem-tile.selected:active {
  transform: scale(1.05);
}

@keyframes tileSelected {
  0%, 100% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1.15);
  }
}
</style>
