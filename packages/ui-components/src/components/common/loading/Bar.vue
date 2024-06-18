<template>
  <div
    :class="[
      'relative w-full h-1 bg-blue-500/30 text-xs text-foreground-on-primary overflow-hidden rounded-xl',
      showBar ? 'opacity-100' : 'opacity-0'
    ]"
  >
    <div class="swoosher relative top-0 bg-blue-500/50"></div>
  </div>
</template>
<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{ loading: boolean; clientOnly?: boolean }>()

const mounted = useMounted()
const showBar = computed(() => (mounted.value || !props.clientOnly) && props.loading)
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
