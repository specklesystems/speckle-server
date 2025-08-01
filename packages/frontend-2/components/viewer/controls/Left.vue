<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <aside
    class="absolute left-2 lg:left-0 z-40 flex rounded-lg border border-outline-2 bg-foundation px-1 overflow-visible lg:h-full"
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
        :icon="'IconViewerModels'"
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
        :icon="'IconViewerExplorer'"
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
        :icon="'IconViewerDiscussions'"
        @click="toggleActivePanel('discussions')"
      />
      <ViewerControlsButtonToggle
        v-if="allAutomationRuns.length !== 0"
        v-tippy="{
          content: summary.longSummary,
          placement: 'top'
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
          :icon="'IconViewerDev'"
          secondary
          @click="toggleActivePanel('devMode')"
        />
        <ViewerControlsButtonToggle
          v-tippy="getTooltipProps('Documentation')"
          :icon="'IconDocs'"
          secondary
          @click="openDocs"
        />
        <!-- TODO: Add intercom click event -->
        <ViewerControlsButtonToggle
          v-if="isIntercomEnabled"
          v-tippy="getTooltipProps('Get help')"
          :icon="'IconIntercom'"
          secondary
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
        'simple-scrollbar overflow-x-hidden bg-foundation absolute z-10 left-[calc(2.5rem+1px)] top-[-1px] bottom-[-1px] overflow-y-auto border-outline-2 border border-l-0 rounded-lg rounded-tl-none rounded-bl-none ',
        hasActivePanel ? 'opacity-100' : 'opacity-0',
        isEmbedEnabled ? '' : 'lg:left-[calc(3rem+1px)] lg:border-none lg:rounded-none'
      ]"
      :style="`width: ${widthClass};`"
    >
      <ViewerModelsPanel v-if="activePanel === 'models'" />
      <KeepAlive v-show="resourceItems.length !== 0 && activePanel === 'filters'">
        <ViewerFiltersPanel />
      </KeepAlive>
      <ViewerCommentsPanel
        v-if="resourceItems.length !== 0 && activePanel === 'discussions'"
      />
      <AutomateViewerPanel
        v-if="activePanel === 'automate'"
        :automation-runs="allAutomationRuns"
        :summary="summary"
      />
      <ViewerDataviewerPanel v-if="activePanel === 'devMode'" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useEventListener, useResizeObserver, useBreakpoints } from '@vueuse/core'
import { type Nullable, isNonNullable } from '@speckle/shared'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'
import { useFunctionRunsStatusSummary } from '~/lib/automate/composables/runStatus'
import { useIntercomEnabled } from '~~/lib/intercom/composables/enabled'
import { viewerDocsRoute } from '~~/lib/common/helpers/route'

type ActivePanel =
  | 'none'
  | 'models'
  | 'discussions'
  | 'explorer'
  | 'automate'
  | 'filters'
  | 'devMode'

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
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
const isMobile = breakpoints.smaller('sm')
const isTablet = breakpoints.smaller('lg')
const { getTooltipProps } = useSmartTooltipDelay()

const activePanel = ref<ActivePanel>('none')

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

const { summary } = useFunctionRunsStatusSummary({
  runs: allFunctionRuns
})

registerShortcuts({
  ToggleModels: () => toggleActivePanel('models'),
  ToggleFilters: () => toggleActivePanel('filters'),
  ToggleDiscussions: () => toggleActivePanel('discussions'),
  ToggleDevMode: () => toggleActivePanel('devMode')
})

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

const openDocs = () => {
  window.open(viewerDocsRoute, '_blank')
}

onMounted(() => {
  activePanel.value =
    isSmallerOrEqualSm.value || isEmbedEnabled.value ? 'none' : 'models'
})

watch(isSmallerOrEqualSm, (newVal) => {
  activePanel.value = newVal ? 'none' : 'models'
})
</script>
