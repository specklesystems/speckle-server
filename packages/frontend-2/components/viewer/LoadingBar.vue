<template>
  <div :class="`${viewerBusy ? 'mt-0' : '-mt-5'} transition-all`">
    <div
      :class="`absolute w-full max-w-screen flex justify-center ${
        showNavbar && !isEmbedEnabled ? 'mt-14' : 'mt-0'
      }  z-50`"
    >
      <div
        class="relative bg-blue-500/20 mt-0 h-4 rounded-b-lg select-none px-2 py-1 w-2/3 lg:w-1/3 overflow-hidden"
      >
        <div
          class="absolute h-full inset-0 bg-primary transition-[width]"
          :style="`width: ${Math.floor(loadProgress * 100)}%`"
        ></div>
        <div
          class="absolute h-full inset-0 text-center text-xs text-foreground-on-primary"
        >
          {{ Math.floor(loadProgress * 100) }}%
        </div>
      </div>
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
