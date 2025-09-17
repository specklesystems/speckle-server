<template>
  <div class="p-4 pl-0 absolute">
    <ul class="flex flex-col space-y-2">
      <li v-for="slide in visibleSlides" :key="slide.id">
        <div
          class="w-2 h-[1px] bg-foreground-3 transition-all duration-200"
          :class="{ 'w-4 !bg-foreground': slide.id === currentView?.id }"
        />
      </li>
    </ul>

    <!-- <div
      class="hidden md:flex absolute top-[calc(50%+25px)] -translate-y-1/2 max-h-[75vh] overflow-y-auto w-56 simple-scrollbar bg-foundation border border-outline-3 rounded-xl p-3 shadow-md"
    >
      <PresentationSlideList class="w-full" hide-title />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

const {
  ui: { slide: currentView },
  response: { visibleSlides }
} = useInjectedPresentationState()
</script>
