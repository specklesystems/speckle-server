<template>
  <div class="p-3 lg:p-5 absolute group">
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
      class="hidden touch:hidden sm:block absolute top-1/2 lg:top-[calc(50%+25px)] -translate-y-1/2 w-56 overflow-hidden bg-foundation border border-outline-3 rounded-2xl p-2 pr-0 shadow-md transition-all duration-300 ease-out opacity-0 invisible group-hover:opacity-100 group-hover:visible -translate-x-5 group-hover:translate-x-0"
    >
      <div
        class="simple-scrollbar overflow-y-auto lg:max-h-[75vh] pr-2"
        :class="[isInfoSidebarOpen ? 'max-h-[calc(100vh-20.625rem)]' : 'max-h-[75vh]']"
      >
        <PresentationSlideList class="w-full" hide-title />
      </div>
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
  isInfoSidebarOpen?: boolean
}>()
</script>
