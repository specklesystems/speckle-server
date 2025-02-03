<template>
  <div>
    <div
      v-show="loadProgress < 1 && viewerBusy"
      :class="`absolute w-full max-w-screen h-1 bg-foundation-page overflow-hidden ${
        showNavbar && !isEmbedEnabled ? 'mt-14' : 'mt-0'
      } text-xs text-foreground-on-primary z-50 text-center`"
    >
      <div
        class="absolute top-0 bg-blue-500 h-full transition-[width] duration-300 ease-out"
        :style="{ width: `${Math.floor(loadProgress * 100)}%` }"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
const { isEnabled: isEmbedEnabled } = useEmbed()

const { viewerBusy, loadProgress } = useInjectedViewerInterfaceState()
const { showNavbar } = useViewerTour()
</script>
