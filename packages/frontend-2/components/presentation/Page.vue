<template>
  <div class="h-screen w-screen flex flex-col md:flex-row relative">
    <PresentationHeader
      v-if="!hideUi"
      v-model:is-sidebar-open="isLeftSidebarOpen"
      class="absolute top-4 z-40"
      :class="[
        isLeftSidebarOpen ? 'left-[calc(50%+0.75rem)] md:left-[15.75rem]' : 'left-4'
      ]"
      @toggle-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
    />

    <PresentationActions
      v-if="!hideUi"
      v-model:is-sidebar-open="isInfoSidebarOpen"
      class="absolute top-4 right-4 z-20"
      :class="{ 'lg:right-[21rem]': isInfoSidebarOpen }"
      @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
    />

    <PresentationSlideIndicator
      class="absolute top-1/2 translate-y-[calc(-50%+25px)] z-20"
      :class="[isLeftSidebarOpen ? 'lg:left-[15.75rem] hidden md:block' : 'left-4']"
    />

    <PresentationLeftSidebar
      v-if="isLeftSidebarOpen"
      class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
    />

    <div class="flex-1">
      <ClientOnly>
        <img
          v-if="currentSlide && 'screenshot' in currentSlide"
          :src="(currentSlide as any).screenshot"
          alt="Current view"
          class="h-full w-full object-cover"
        />
      </ClientOnly>
    </div>

    <PresentationInfoSidebar v-if="isInfoSidebarOpen" class="flex-shrink-0" />

    <PresentationControls
      v-if="!hideUi"
      class="absolute left-1/2 -translate-x-1/2"
      :class="[
        isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4',
        isLeftSidebarOpen ? 'hidden md:flex' : ''
      ]"
    />

    <PresentationSpeckleLogo
      class="absolute right-4 z-20"
      :class="[isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4']"
    />
  </div>
</template>

<script setup lang="ts">
import {
  usePresentationState,
  usePresentationActions
} from '~/lib/presentations/composables/setup'

const isInfoSidebarOpen = ref(true)
const isLeftSidebarOpen = ref(true)

const { hideUi, currentSlide } = usePresentationState()
const { goToPrevious, goToNext, toggleUi } = usePresentationActions()

const handleKeydown = (event: KeyboardEvent) => {
  // TBD, we might remove this
  if (event.key === 'i' || event.key === 'I') {
    toggleUi()
  }
  if (event.key === 'ArrowLeft') {
    goToPrevious()
  }
  if (event.key === 'ArrowRight') {
    goToNext()
  }
}

watch(hideUi, (newVal) => {
  if (newVal) {
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
