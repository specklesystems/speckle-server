<template>
  <div class="relative">
    <div class="h-dvh w-screen flex flex-col md:flex-row relative">
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
        class="absolute bottom-4 lg:top-4 right-4 z-20"
        :class="{
          'bottom-52 lg:bottom-auto lg:right-[17rem] xl:right-[21rem]':
            isInfoSidebarOpen
        }"
        @toggle-sidebar="isInfoSidebarOpen = !isInfoSidebarOpen"
      />

      <PresentationSlideIndicator
        v-if="!isViewerLoading"
        :show-slide-list="!isLeftSidebarOpen"
        class="absolute top-1/2 z-20"
        :class="[
          isInfoSidebarOpen
            ? 'translate-y-[calc(-50%+25px-6rem)] lg:translate-y-[-50%]'
            : 'translate-y-[-50%]',
          isLeftSidebarOpen ? 'lg:left-[14.75rem] hidden md:block' : 'left-0'
        ]"
      />

      <PresentationSpeckleLogo
        class="absolute right-4 z-30 top-4 lg:top-auto lg:bottom-4"
        :class="[isInfoSidebarOpen ? '' : '']"
      />

      <PresentationLeftSidebar
        v-if="isLeftSidebarOpen"
        class="absolute left-0 top-0 md:relative flex-shrink-0 z-30"
      />

      <div class="flex-1 z-0 flex flex-col lg:flex-row">
        <Component
          :is="presentation ? ViewerWrapper : 'div'"
          :group="presentation"
          class="h-full w-full object-cover"
          @loading-change="onLoadingChange"
          @progress-change="onProgressChange"
        />

        <PresentationInfoSidebar
          v-if="isInfoSidebarOpen"
          class="flex-shrink-0 z-20"
          @close="isInfoSidebarOpen = false"
        />
      </div>

      <PresentationControls
        :hide-ui="hideUi"
        class="absolute left-4 lg:left-1/2 lg:-translate-x-1/2"
        :class="[
          isInfoSidebarOpen ? 'bottom-52 lg:bottom-4' : 'bottom-4',
          isLeftSidebarOpen ? 'hidden md:flex md:left-64' : ''
        ]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { useEventListener, useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useMixpanel } from '~~/lib/core/composables/mp'

const {
  response: { presentation, workspace }
} = useInjectedPresentationState()
const mixpanel = useMixpanel()
const isMobile = useBreakpoints(TailwindBreakpoints).smaller('sm')
const { $intercom } = useNuxtApp()

const isInfoSidebarOpen = ref(false)
const isLeftSidebarOpen = ref(false)
const hideUi = ref(true)
const isViewerLoading = ref(true)
const viewerProgress = ref(0)

const ViewerWrapper = resolveComponent('PresentationViewerWrapper')

const title = computed(() => presentation.value?.title)
const canEditPresentation = computed(() => {
  return presentation.value?.permissions.canUpdate.authorized
})

const onLoadingChange = (loading: boolean) => {
  isViewerLoading.value = loading

  if (!loading) {
    hideUi.value = false

    isLeftSidebarOpen.value = !isMobile.value
    isInfoSidebarOpen.value = !isMobile.value
  }
}

const onProgressChange = (progress: number) => {
  viewerProgress.value = progress
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'i' || event.key === 'I') {
    hideUi.value = !hideUi.value
    isLeftSidebarOpen.value = !hideUi.value
    isInfoSidebarOpen.value = !hideUi.value
  }
}

useEventListener('keydown', handleKeydown)
useHead({ title })

onMounted(() => {
  mixpanel.track('Presentation Viewed', {
    // eslint-disable-next-line camelcase
    presentation_id: presentation.value?.id,
    // eslint-disable-next-line camelcase
    workspace_id: workspace.value?.id
  })

  $intercom.track('Presentation Viewed', {
    canEditPresentation: canEditPresentation.value
  })
})
</script>
