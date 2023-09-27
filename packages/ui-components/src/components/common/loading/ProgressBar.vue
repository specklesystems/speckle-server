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
  loading: boolean
  cancelled?: boolean
  progress?: number
}>()

const widthStyle = computed(() => {
  if (!props.progress) return ''
  return `width: ${props.progress * 100}%;`
})

const containerStyle = computed(() => {
  if (props.cancelled) {
    return 'relative w-full h-1 bg-red-500/30 text-xs text-foreground-on-danger overflow-hidden rounded-xl'
  } else {
    return 'relative w-full h-1 bg-blue-500/30 text-xs text-foreground-on-primary overflow-hidden rounded-xl'
  }
})

const barStyle = computed(() => {
  if (props.cancelled) {
    return 'h-full relative bg-red-500/50 transition-[width]'
  } else {
    return 'h-full relative bg-blue-500/50 transition-[width]'
  }
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
