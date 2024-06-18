<template>
  <div>
    <div
      v-show="viewerBusy"
      :class="`absolute w-full max-w-screen h-1 bg-blue-500/20 overflow-hidden ${
        showNavbar && !isEmbedEnabled ? 'mt-14' : 'mt-0'
      } text-xs text-foreground-on-primary z-50`"
    >
      <div class="swoosher absolute top-0 bg-blue-500/50 rounded-md"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
const { isEnabled: isEmbedEnabled } = useEmbed()

const { viewerBusy } = useInjectedViewerInterfaceState()
const { showNavbar } = useViewerTour()
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
