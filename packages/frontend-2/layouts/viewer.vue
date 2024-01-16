<template>
  <div
    class="relative min-h-full"
    :class="embedOptions.isTransparent && 'viewer-transparent'"
  >
    <div
      v-if="debug"
      class="pointer-events-none fixed bottom-0 z-40 flex w-full space-x-2 p-3 text-xs"
    >
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showNavbar = !tourState.showNavbar"
      >
        nav
      </FormButton>
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showViewerControls = !tourState.showViewerControls"
      >
        viewer ctrls
      </FormButton>
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showTour = !tourState.showTour"
      >
        tour ctrls
      </FormButton>
      <!-- <span>{{ tourState }}</span> -->
    </div>

    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-1000"
    >
      <HeaderNavBar
        v-show="tourState.showNavbar && !embedOptions.isEnabled"
        class="relative z-20 mb-6"
      />
    </Transition>
    <main class="absolute top-0 left-0 z-10 h-[100dvh] w-screen">
      <slot />
    </main>
  </div>
</template>
<script setup lang="ts">
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

const tourState = useTourStageState()
const { embedOptions } = useEmbedState()

const debug = ref(false)
</script>
