<!-- NOTE: should be moved to the ui package, and worked out with the existing loading bar -->
<template>
  <div
    :class="[
      'relative w-full h-1 bg-blue-500/30 text-xs text-foreground-on-primary overflow-hidden rounded-xl',
      loading ? 'opacity-100' : 'opacity-0'
    ]"
  >
    <div
      :class="`${
        progress ? '' : 'swoosher top-0'
      }h-full relative bg-blue-500/50 transition-[width]`"
      :style="widthStyle"
    ></div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ loading: boolean; progress?: number }>()

const widthStyle = computed(() => {
  if (!props.progress) return ''
  return `width: ${props.progress * 100}%;`
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
