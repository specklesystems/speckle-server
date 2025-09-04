<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <aside
    class="absolute left-2 lg:left-0 z-50 flex rounded-lg border border-outline-2 bg-foundation px-1 overflow-visible lg:h-full"
    :class="[
      isEmbedEnabled
        ? 'top-[0.5rem]'
        : 'top-[3.5rem] lg:top-[3rem] lg:rounded-none lg:px-2 lg:max-h-[calc(100dvh-3rem)] lg:border-l-0 lg:border-t-0 lg:border-b-0',
      hasActivePanel && 'h-full max-h-[calc(100dvh-8rem)] rounded-r-none'
    ]"
  >
    <div class="flex flex-col gap-2 py-1" :class="isEmbedEnabled ? '' : 'lg:py-2'">
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(
            getShortcutDisplayText(shortcuts.ToggleModels, { format: 'separate' }),
            {
              placement: 'right'
            }
          )
        "
        :active="activePanel === 'models'"
        :icon="Box"
        @click="toggleActivePanel('models')"
      />
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(
            getShortcutDisplayText(shortcuts.ToggleFilters, { format: 'separate' }),
            {
              placement: 'right'
            }
          )
        "
        :active="activePanel === 'filters'"
        :icon="ListFilter"
        :dot="hasAnyFiltersApplied"
        @click="toggleActivePanel('filters')"
      />
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(
            getShortcutDisplayText(shortcuts.ToggleDiscussions, { format: 'separate' }),
            {
              placement: 'right'
            }
          )
        "
        :active="activePanel === 'discussions'"
        :icon="MessageSquareText"
        @click="toggleActivePanel('discussions')"
      />

      <!-- Saved views -->
      <ViewerControlsButtonToggle
        v-if="isSavedViewsEnabled"
        v-tippy="
          getTooltipProps(
            getShortcutDisplayText(shortcuts.ToggleSavedViews, { format: 'separate' }),
            {
              placement: 'right'
            }
          )
        "
        :active="activePanel === 'savedViews'"
        :icon="Camera"
        @click="toggleActivePanel('savedViews')"
      ></ViewerControlsButtonToggle>

      <ViewerControlsButtonToggle
        v-if="allAutomationRuns.length !== 0"
        v-tippy="{
          content: summary.longSummary,
          placement: 'right'
        }"
        :active="activePanel === 'automate'"
        @click="toggleActivePanel('automate')"
      >
        <AutomateRunsTriggerStatusIcon
          :summary="summary"
          class="h-5 w-5 md:h-6 md:w-6"
        />
      </ViewerControlsButtonToggle>
      <div
        v-if="!isEmbedEnabled && (!isTablet || activePanel !== 'none')"
        class="mt-auto flex flex-col gap-2"
      >
        <ViewerControlsButtonToggle
          v-tippy="
            getTooltipProps(
              getShortcutDisplayText(shortcuts.ToggleDevMode, { format: 'separate' }),
              {
                placement: 'right'
              }
            )
          "
          :active="activePanel === 'devMode'"
          :icon="CodeXml"
          secondary
          @click="toggleActivePanel('devMode')"
        />
        <ViewerControlsButtonToggle
          v-tippy="
            getTooltipProps('Documentation', {
              placement: 'right'
            })
          "
          :icon="BookOpen"
          secondary
          @click="openDocs"
        />
        <ViewerControlsButtonToggle
          v-if="isIntercomEnabled"
          v-tippy="getTooltipProps('Get help')"
          :icon="CircleQuestionMark"
          secondary
          @click="openIntercomChat"
        />
      </div>
    </div>

    <!-- Resize handle -->
    <div
      v-if="activePanel !== 'none'"
      ref="resizeHandle"
      class="absolute h-full max-h-[calc(100dvh-3rem)] w-4 transition border-l hover:border-l-[2px] border-outline-2 hover:border-primary hidden lg:flex items-center cursor-ew-resize z-30"
      :style="`left:${width + 52}px;`"
      @mousedown="startResizing"
    />

    <!-- Scrollable controls container -->
    <div
      v-show="activePanel !== 'none'"
      ref="scrollableControlsContainer"
      :class="[
        'bg-foundation absolute z-10 left-[calc(2.5rem+1px)] top-[-1px] bottom-[-1px] overflow-hidden border-outline-2 border border-l-0 rounded-lg rounded-tl-none rounded-bl-none ',
        hasActivePanel ? 'opacity-100' : 'opacity-0',
        isEmbedEnabled ? '' : 'lg:left-[calc(3rem+1px)] lg:border-none lg:rounded-none'
      ]"
      :style="`width: ${widthClass};`"
    >
      <ViewerModelsPanel
        v-show="activePanel === 'models'"
        v-model:sub-view="modelsSubView"
      />
      <ViewerFiltersPanel v-if="activePanel === 'filters'" />
      <ViewerCommentsPanel
        v-if="resourceItems.length !== 0 && activePanel === 'discussions'"
      />
      <AutomateViewerPanel
        v-if="activePanel === 'automate'"
        :automation-runs="allAutomationRuns"
        :summary="summary"
      />
      <ViewerDataviewerPanel v-if="activePanel === 'devMode'" />
      <KeepAlive>
        <ViewerSavedViewsPanel
          v-if="isSavedViewsEnabled && activePanel === 'savedViews'"
          @close="activePanel = 'none'"
        />
      </KeepAlive>
    </div>

    <!-- Panel Extension - Portal target for additional content -->
    <div
      id="panel-extension"
      class="absolute max-h-[calc(100dvh-4rem)] empty:hidden w-64 top-1.5 bg-foundation border border-outline-2 rounded-lg overflow-hidden"
      :style="`left: ${panelExtensionLeft}px`"
    >
      <PortalTarget name="panel-extension"></PortalTarget>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useEventListener, useResizeObserver, useBreakpoints } from '@vueuse/core'
import { type Nullable, isNonNullable } from '@speckle/shared'
import { useFunctionRunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { useIntercomEnabled } from '~~/lib/intercom/composables/enabled'
import { viewerDocsRoute } from '~~/lib/common/helpers/route'
import { useAreSavedViewsEnabled } from '~/lib/viewer/composables/savedViews/general'
import {
  Camera,
  CodeXml,
  BookOpen,
  Box,
  ListFilter,
  MessageSquareText,
  CircleQuestionMark
} from 'lucide-vue-next'
import { useViewerPanelsUtilities } from '~/lib/viewer/composables/setup/panels'
import type { ActivePanel } from '~/lib/viewer/helpers/sceneExplorer'

// TODO: Refactor all of this event business and just read/write panels state directly
const emit = defineEmits<{
  forceClosePanels: []
}>()

const width = ref(264)
const scrollableControlsContainer = ref(null as Nullable<HTMLDivElement>)
const height = ref(scrollableControlsContainer.value?.clientHeight)
const isResizing = ref(false)
const resizeHandle = ref(null)
let startWidth = 0
let startX = 0

const startResizing = (event: MouseEvent) => {
  if (isMobile.value) return
  event.preventDefault()
  isResizing.value = true
  startX = event.clientX
  startWidth = width.value
}

if (import.meta.client) {
  useResizeObserver(scrollableControlsContainer, (entries) => {
    const { height: newHeight } = entries[0].contentRect
    height.value = newHeight
  })
  useEventListener(resizeHandle, 'mousedown', startResizing)

  useEventListener(document, 'mousemove', (event) => {
    if (isResizing.value) {
      const diffX = event.clientX - startX
      const newWidth = Math.max(
        240,
        Math.min(startWidth + diffX, Math.min(440, window.innerWidth * 0.5 - 60))
      )
      width.value = newWidth
    }
  })

  useEventListener(document, 'mouseup', () => {
    if (isResizing.value) {
      isResizing.value = false
    }
  })
}

const { isIntercomEnabled } = useIntercomEnabled()
const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()
const { registerShortcuts, getShortcutDisplayText, shortcuts } = useViewerShortcuts()
const { isEnabled: isEmbedEnabled } = useEmbed()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('sm')
const isTablet = breakpoints.smaller('lg')
const { getTooltipProps } = useSmartTooltipDelay()
const isSavedViewsEnabled = useAreSavedViewsEnabled()
const { $intercom } = useNuxtApp()
const {
  filters: { hasAnyFiltersApplied }
} = useInjectedViewerInterfaceState()
const {
  ui: {
    panels: { active: activePanel, modelsSubView }
  }
} = useInjectedViewerState()

const { onPanelButtonClick } = useViewerPanelsUtilities()

const hasActivePanel = computed(() => activePanel.value !== 'none')

const allAutomationRuns = computed(() => {
  const allAutomationStatuses = modelsAndVersionIds.value
    .map(({ model }) => model.loadedVersion.items[0].automationsStatus)
    .flat()
    .filter(isNonNullable)

  return allAutomationStatuses.map((status) => status.automationRuns).flat()
})

const allFunctionRuns = computed(() => {
  return allAutomationRuns.value.map((run) => run.functionRuns).flat()
})

const widthClass = computed(() => {
  if (isMobile.value) {
    return 'calc(100vw - 3.6rem)'
  } else if (isTablet.value) {
    return '240px'
  } else {
    return `${width.value + 4}px`
  }
})

const panelExtensionLeft = computed(() => {
  const mainPanelWidth = isMobile.value
    ? window.innerWidth - 60
    : isTablet.value
    ? 240
    : width.value
  const mainPanelLeft = isEmbedEnabled.value ? 52 : 60
  return mainPanelLeft + mainPanelWidth
})

const { summary } = useFunctionRunsStatusSummary({
  runs: allFunctionRuns
})

registerShortcuts({
  ToggleModels: () => toggleActivePanel('models'),
  ToggleFilters: () => toggleActivePanel('filters'),
  ToggleDiscussions: () => toggleActivePanel('discussions'),
  ToggleDevMode: () => toggleActivePanel('devMode'),
  ToggleSavedViews: () => isSavedViewsEnabled && toggleActivePanel('savedViews')
})

const toggleActivePanel = (panel: ActivePanel) => {
  onPanelButtonClick(panel)
}

const forceClosePanel = () => {
  activePanel.value = 'none'
}

const openDocs = () => {
  window.open(viewerDocsRoute, '_blank')
}

const openIntercomChat = () => {
  if (isIntercomEnabled.value) {
    $intercom.show()
  }
}

watch(activePanel, (newVal, oldVal) => {
  const wasNone = oldVal === 'none'

  // If a panel is being opened (not closed) on mobile, emit event to parent
  if (wasNone && newVal !== 'none' && isMobile.value) {
    emit('forceClosePanels')
  }
})

defineExpose({
  forceClosePanel,
  forceClosePanels: forceClosePanel
})
</script>
