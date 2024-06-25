<template>
  <div :class="[containerStyle, loading ? 'opacity-100' : 'opacity-0']">
    <div
      :class="[progress ? '' : 'swoosher top-0', barStyle]"
      :style="widthStyle"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  /**
   * Whether we're actively loading. If set, the progress bar will be indefinite unless a progress argument is passed in too (see below).
   */
  loading: boolean
  /**
   * A number between 0 and 1. If set, the progress bar will no longer be indefinite and have a fixed progress.
   */
  progress?: number
}>()

const widthStyle = computed(() => {
  if (!props.progress) return ''
  return `width: ${props.progress * 100}%;`
})

const containerStyle = computed(() => {
  return 'relative w-full h-1 bg-blue-500/30 text-xs text-foreground-on-primary overflow-hidden rounded-xl'
})

const barStyle = computed(() => {
  return 'h-full relative bg-blue-500/50 transition-[width]'
})
</script>
<style scoped>
.swoosher {
  width: 100%;
  height: 100%;
  animation: swoosh 1s infinite linear;
  transform-origin: 0% 30%;
}

@keyframes swoosh {
  0% {
    transform: translateX(0) scaleX(0);
  }

  40% {
    transform: translateX(0) scaleX(0.4);
  }

  100% {
    transform: translateX(100%) scaleX(0.5);
  }
}
</style>
