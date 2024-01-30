<template>
  <div class="relative min-h-full" :class="isTransparent && 'viewer-transparent'">
    <div
      v-if="debug"
      class="pointer-events-none fixed bottom-0 z-40 flex w-full space-x-2 p-3 text-xs"
    >
      <FormButton class="pointer-events-auto" size="xs" @click="toggleNavbar">
        nav
      </FormButton>
      <FormButton class="pointer-events-auto" size="xs" @click="toggleViewerControls">
        viewer ctrls
      </FormButton>
      <FormButton class="pointer-events-auto" size="xs" @click="toggleTour">
        tour ctrls
      </FormButton>
      <!-- <span>{{ tourState }}</span> -->
    </div>

    <ClientOnly>
      <Transition
        enter-from-class="opacity-0"
        enter-active-class="transition duration-1000"
      >
        <HeaderNavBar v-show="showNavbar" class="relative z-20 mb-6" />
      </Transition>
    </ClientOnly>
    <main class="absolute top-0 left-0 z-10 h-[100dvh] w-screen">
      <slot />
    </main>
  </div>
</template>
<script setup lang="ts">
import { useViewerTour } from '~/lib/viewer/composables/tour'
import { useEmbed } from '~~/lib/viewer/composables/setup/embed'

const { showNavbar, showTour, showControls } = useViewerTour()
const { isTransparent } = useEmbed()

const debug = ref(false)

const toggleNavbar = () => {
  showNavbar.value = !showNavbar.value
}
const toggleTour = () => {
  showTour.value = !showTour.value
}
const toggleViewerControls = () => {
  showControls.value = !showControls.value
}
</script>
