<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <aside
    class="absolute left-2 lg:left-0 top-[3.5rem] z-20 flex rounded-lg border border-outline-2 bg-foundation px-1"
    :class="[
      isEmbedEnabled
        ? ''
        : 'lg:top-[3rem] lg:rounded-none lg:px-2 lg:max-h-[calc(100dvh-3rem)] lg:border-l-0 lg:border-t-0 lg:border-b-0',
      hasActivePanel && 'h-full max-h-[calc(100dvh-7.875rem)] rounded-r-none'
    ]"
  >
    <div class="flex flex-col gap-2 py-1" :class="isEmbedEnabled ? '' : 'lg:py-2'">
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(getShortcutDisplayText(shortcuts.ToggleModels), {
            placement: 'right'
          })
        "
        :active="activePanel === 'models'"
        :icon="'IconViewerModels'"
        @click="toggleActivePanel('models')"
      />
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(getShortcutDisplayText(shortcuts.ToggleFilters), {
            placement: 'right'
          })
        "
        :active="activePanel === 'filters'"
        :icon="'IconViewerExplorer'"
        @click="toggleActivePanel('filters')"
      />
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(getShortcutDisplayText(shortcuts.ToggleDiscussions), {
            placement: 'right'
          })
        "
        :active="activePanel === 'discussions'"
        :icon="'IconViewerDiscussions'"
        @click="toggleActivePanel('discussions')"
      />
      <ViewerControlsButtonToggle
        v-if="allAutomationRuns.length !== 0"
        v-tippy="
          isMobile
            ? undefined
            : {
                content: summary.longSummary,
                placement: 'right'
              }
        "
        :active="activePanel === 'automate'"
        @click="toggleActivePanel('automate')"
      >
        <AutomateRunsTriggerStatusIcon
          :summary="summary"
          class="h-5 w-5 md:h-6 md:w-6"
        />
      </ViewerControlsButtonToggle>
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
      ref="scrollableControlsContainer"
      :class="[
        'simple-scrollbar bg-foundation absolute z-10 left-[calc(2.5rem+1px)] top-[-1px] bottom-[-1px] overflow-y-auto border-outline-2 border border-l-0 rounded-lg rounded-tl-none rounded-bl-none',
        hasActivePanel ? 'opacity-100' : 'opacity-0',
        isEmbedEnabled ? '' : 'lg:left-[calc(3rem+1px)] lg:border-none lg:rounded-none'
      ]"
      :style="`width: ${isMobile ? 'calc(100vw - 3.75rem)' : `${width + 4}px`};`"
    >
      <!-- Models panel -->
      <ViewerModels
        v-if="resourceItems.length !== 0 && activePanel === 'models'"
        @close="activePanel = 'none'"
      />

      <!-- Filter panel -->
      <KeepAlive v-show="resourceItems.length !== 0 && activePanel === 'filters'">
        <ViewerFilters class="pointer-events-auto" @close="activePanel = 'none'" />
      </KeepAlive>

      <!-- Comment threads panel -->
      <ViewerComments
        v-if="resourceItems.length !== 0 && activePanel === 'discussions'"
        class="pointer-events-auto"
        @close="activePanel = 'none'"
      />
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

type ActivePanel =
  | 'none'
  | 'models'
  | 'discussions'
  | 'explorer'
  | 'automate'
  | 'filters'

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

const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()
const { registerShortcuts, getShortcutDisplayText, shortcuts } = useViewerShortcuts()
const { isEnabled: isEmbedEnabled } = useEmbed()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
const isMobile = breakpoints.smaller('sm')
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

const { summary } = useFunctionRunsStatusSummary({
  runs: allFunctionRuns
})

registerShortcuts({
  ToggleModels: () => toggleActivePanel('models'),
  ToggleFilters: () => toggleActivePanel('filters'),
  ToggleDiscussions: () => toggleActivePanel('discussions')
})

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

onMounted(() => {
  activePanel.value =
    isSmallerOrEqualSm.value || isEmbedEnabled.value ? 'none' : 'models'
})

watch(isSmallerOrEqualSm, (newVal) => {
  activePanel.value = newVal ? 'none' : 'models'
})
</script>
