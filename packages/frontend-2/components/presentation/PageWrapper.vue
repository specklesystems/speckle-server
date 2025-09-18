<template>
  <div class="relative">
    <div class="h-screen w-screen flex flex-col md:flex-row relative">
      <PresentationHeader
        v-if="!hideUi"
        v-model:is-sidebar-open="isLeftSidebarOpen"
        class="absolute top-4 z-40"
        :class="[isLeftSidebarOpen ? 'left-56 md:left-[15.75rem]' : 'left-4']"
        @toggle-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
      />

      <PresentationActions
        v-if="!hideUi"
        v-model:is-sidebar-open="isInfoSidebarOpen"
        class="absolute bottom-4 md:top-4 right-4 z-20"
        :class="{
          'bottom-52 lg:bottom-auto md:right-[17rem] xl:right-[21rem]':
            isInfoSidebarOpen
        }"
        @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
      />

      <PresentationSlideIndicator
        class="absolute top-1/2 translate-y-[calc(-50%+25px)] z-20"
        :class="[isLeftSidebarOpen ? 'lg:left-[15.75rem] hidden md:block' : 'left-4']"
      />

      <PresentationSpeckleLogo
        class="absolute right-4 z-30 top-5 md:top-auto md:bottom-4"
        :class="[isInfoSidebarOpen ? '' : '']"
      />

      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
      />

      <div class="flex-1 z-0">
        <Component
          :is="presentation ? ViewerWrapper : 'div'"
          :group="presentation"
          class="h-full w-full object-cover"
        />
      </div>

      <PresentationInfoSidebar v-if="isInfoSidebarOpen" class="flex-shrink-0 z-20" />

      <PresentationControls
        v-if="!hideUi"
        class="absolute left-4 md:left-1/2 md:-translate-x-1/2"
        :class="[
          isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4',
          isLeftSidebarOpen ? 'hidden md:flex' : ''
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { useEventListener } from '@vueuse/core'

const {
  response: { presentation }
} = useInjectedPresentationState()

const isInfoSidebarOpen = ref(true)
const isLeftSidebarOpen = ref(true)
const hideUi = ref(false)

const ViewerWrapper = resolveComponent('PresentationViewerWrapper')

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
  }
}

useEventListener('keydown', handleKeydown)
</script>
