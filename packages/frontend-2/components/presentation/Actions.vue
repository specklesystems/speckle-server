<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md flex items-center h-10"
  >
    <div class="flex items-center justify-between space-x-1 p-1">
      <FormButton v-if="isLoggedIn" @click="showShareDialog = true">Share</FormButton>

      <PresentationFloatingPanelButton
        v-if="isMdOrLarger"
        v-tippy="getTooltipProps(isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen')"
        class="touch:hidden"
        @click="toggleFullscreen"
      >
        <LucideMinimize
          v-if="isFullscreen"
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
        <LucideMaximize
          v-else
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
      </PresentationFloatingPanelButton>

      <PresentationFloatingPanelButton
        v-tippy="getTooltipProps(isSidebarOpen ? 'Hide slide info' : 'Show slide info')"
        :is-active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideInfo :size="16" :stroke-width="1.5" :absolute-stroke-width="true" />
      </PresentationFloatingPanelButton>
    </div>

    <PresentationShareDialog
      v-model:open="showShareDialog"
      :project-id="projectId"
      :presentation-id="presentationId"
    />
  </div>
</template>

<script setup lang="ts">
import { LucideInfo, LucideMaximize, LucideMinimize } from 'lucide-vue-next'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~/lib/common/helpers/tailwind'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')

const { projectId, presentationId } = useInjectedPresentationState()
const { isLoggedIn } = useActiveUser()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMdOrLarger = breakpoints.greaterOrEqual('md')
const { getTooltipProps } = useSmartTooltipDelay()

const isFullscreen = ref(false)
const showShareDialog = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>
