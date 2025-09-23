<template>
  <div class="p-4 absolute group">
    <ul class="flex flex-col space-y-2">
      <li v-for="slide in visibleSlides" :key="slide.id">
        <div
          class="w-2 h-[1px] bg-foreground-3 transition-all duration-200"
          :class="{ 'w-4 !bg-foreground': slide.id === currentView?.id }"
        />
      </li>
    </ul>

    <div
      v-if="showSlideList"
      class="absolute top-[calc(50%+25px)] -translate-y-1/2 max-h-[75vh] overflow-y-auto w-56 simple-scrollbar bg-foundation border border-outline-3 rounded-xl p-3 shadow-md transition-all duration-300 ease-out opacity-0 invisible group-hover:opacity-100 group-hover:visible -translate-x-5 group-hover:translate-x-0"
    >
      <PresentationSlideList class="w-full" hide-title />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

const {
  ui: { slide: currentView },
  response: { visibleSlides }
} = useInjectedPresentationState()

defineProps<{
  showSlideList?: boolean
}>()
</script>
