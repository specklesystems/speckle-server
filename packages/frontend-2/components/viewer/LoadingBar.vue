<template>
  <div>
    <div
      v-show="busyStack !== 0"
      class="absolute w-full max-h-screen h-1 bg-blue-500/20 mt-14 text-xs text-foreground-on-primary"
    >
      <div class="swoosher absolute top-0 bg-blue-500/50 rounded-md"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ViewerEvent } from '@speckle/viewer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'
const { viewer } = useInjectedViewer()

const busyStack = ref(0)

onMounted(() => {
  viewer.on(ViewerEvent.Busy, (value) => {
    if (value) busyStack.value++
    else busyStack.value--
  })
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
