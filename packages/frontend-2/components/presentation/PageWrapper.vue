<template>
  <div class="relative">
    <div class="h-screen w-screen flex flex-col md:flex-row relative">
      <PresentationCloseMessage
        class="absolute z-50 top-4 left-1/2 -translate-x-1/2"
        :show-close-message="showCloseMessage"
        @hide-close-message="hideCloseMessage"
      />

      <PresentationHeader
        v-if="!hideUi"
        v-model:is-sidebar-open="isLeftSidebarOpen"
        class="absolute top-4 z-40"
        :class="[
          isLeftSidebarOpen ? 'left-[calc(50%+0.75rem)] md:left-[15.75rem]' : 'left-4'
        ]"
        :title="presentation?.title"
        @toggle-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
      />

      <PresentationActions
        v-if="!hideUi"
        v-model:is-sidebar-open="isInfoSidebarOpen"
        v-model:is-present-mode="isPresentMode"
        :presentation-id="presentation?.id"
        class="absolute top-4 right-4 z-20"
        :class="{ 'lg:right-[21rem]': isInfoSidebarOpen }"
        @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
        @toggle-present-mode="isPresentMode = !isPresentMode"
      />

      <PresentationSlideIndicator
        class="absolute top-1/2 -translate-y-1/2 z-20"
        :current-slide-index="currentVisibleIndex"
        :slide-count="slideCount || 0"
        :class="[isLeftSidebarOpen ? 'lg:left-[15.75rem] hidden md:block' : 'left-4']"
      />

      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
        :slides="presentation"
        :workspace-logo="workspace?.logo"
        :workspace-name="workspace?.name"
        :current-slide-id="currentView?.id"
        :is-present-mode="isPresentMode"
        @select-slide="onSelectSlide"
      />

      <div class="flex-1 z-0">
        <Component
          :is="presentation ? ViewerWrapper : 'div'"
          :group="presentation"
          class="h-full w-full object-cover"
        />
      </div>

      <PresentationInfoSidebar
        v-if="isInfoSidebarOpen"
        class="flex-shrink-0"
        :title="currentView?.name"
        :description="currentView?.description"
        :view-id="currentView?.id"
        :project-id="projectId"
        :is-present-mode="isPresentMode"
      />

      <PresentationControls
        v-if="!hideUi"
        class="z-10 absolute left-1/2 -translate-x-1/2"
        :disable-previous="disablePrevious"
        :disable-next="disableNext"
        :class="[
          isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4',
          isLeftSidebarOpen ? 'hidden md:flex' : ''
        ]"
        @on-previous="onPrevious"
        @on-next="onNext"
      />

      <PresentationSpeckleLogo
        class="absolute right-4 z-20"
        :class="[isInfoSidebarOpen ? 'bottom-52 md:bottom-4' : 'bottom-4']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { clamp } from 'lodash-es'

const {
  projectId,
  response: { presentation, workspace, visibleSlides },
  ui: { slideIdx: currentVisibleIndex, slide: currentView }
} = useInjectedPresentationState()

const isInfoSidebarOpen = ref(true)
const isLeftSidebarOpen = ref(true)
const hideUi = ref(false)
const isPresentMode = ref(false)
const showCloseMessage = ref(false)
const closeMessageTimeout = ref<NodeJS.Timeout | undefined>()

const ViewerWrapper = resolveComponent('PresentationViewerWrapper')

const slideCount = computed(() => visibleSlides.value?.length || 0)
const disablePrevious = computed(() => currentVisibleIndex.value === 0)
const disableNext = computed(() =>
  slideCount.value ? currentVisibleIndex.value === slideCount.value - 1 : false
)

const onSelectSlide = (slideId: string) => {
  currentVisibleIndex.value = visibleSlides.value.findIndex((s) => s.id === slideId)
}

const onPrevious = () => {
  currentVisibleIndex.value = clamp(currentVisibleIndex.value - 1, 0, slideCount.value)
}

const onNext = () => {
  currentVisibleIndex.value = clamp(currentVisibleIndex.value + 1, 0, slideCount.value)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
  } else if (event.key === 'Escape' && isPresentMode.value) {
    isPresentMode.value = false
  } else if (event.key === 'ArrowLeft' && !disablePrevious.value) {
    onPrevious()
  } else if (event.key === 'ArrowRight' && !disableNext.value) {
    onNext()
  }
}

const hideCloseMessage = () => {
  showCloseMessage.value = false
  if (closeMessageTimeout.value) {
    clearTimeout(closeMessageTimeout.value)
    closeMessageTimeout.value = undefined
  }
}

watch(isPresentMode, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    isLeftSidebarOpen.value = false
    isInfoSidebarOpen.value = false
    showCloseMessage.value = true
    closeMessageTimeout.value = setTimeout(() => {
      showCloseMessage.value = false
    }, 3000)
  } else if (!newVal && oldVal) {
    isLeftSidebarOpen.value = true
    isInfoSidebarOpen.value = true
    hideCloseMessage()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  hideCloseMessage()
})
</script>
