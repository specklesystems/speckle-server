<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <aside
    class="absolute left-0 top-0 z-20 flex h-full max-h-[calc(100dvh-3rem)] border-r border-outline-2 bg-foundation px-2"
    :class="!isEmbedEnabled ? 'top-[3rem]' : 'pt-2 pb-16'"
  >
    <div class="flex flex-col gap-2 py-2">
      <!-- Models -->
      <ViewerControlsButtonToggle
        v-tippy="{
          content: getShortcutDisplayText(shortcuts.ToggleModels),
          placement: 'right'
        }"
        :active="activePanel === 'models'"
        @click="toggleActivePanel('models')"
      >
        <IconViewerModels class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Explorer -->
      <ViewerControlsButtonToggle
        v-tippy="{
          content: getShortcutDisplayText(shortcuts.ToggleExplorer),
          placement: 'right'
        }"
        :active="activePanel === 'explorer'"
        @click="toggleActivePanel('explorer')"
      >
        <IconViewerExplorer class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Filters -->
      <ViewerControlsButtonToggle
        v-tippy="{
          content: 'Filters',
          placement: 'right'
        }"
        :active="activePanel === 'filters'"
        @click="toggleActivePanel('filters')"
      >
        <IconViewerExplorer class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Comment threads -->
      <ViewerControlsButtonToggle
        v-tippy="{
          content: getShortcutDisplayText(shortcuts.ToggleDiscussions),
          placement: 'right'
        }"
        :active="activePanel === 'discussions'"
        @click="toggleActivePanel('discussions')"
      >
        <IconViewerDiscussions class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Automation runs -->
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
      class="absolute h-full max-h-[calc(100dvh-3rem)] w-4 transition border-l hover:border-l-[2px] border-outline-2 hover:border-primary hidden sm:flex items-center cursor-ew-resize z-30"
      :style="`left:${width + 52}px;`"
      @mousedown="startResizing"
    />

    <!-- Scrollable controls container -->
    <div
      ref="scrollableControlsContainer"
      :class="`simple-scrollbar absolute z-10 left-[calc(3rem+1px)] right-2  h-[calc(100dvh-3rem)] overflow-y-auto  ${
        activePanel !== 'none' ? 'opacity-100' : 'opacity-0'
      }`"
      :style="`width: ${isMobile ? '100%' : `${width + 4}px`};`"
    >
      <!-- Models panel -->
      <KeepAlive v-show="activePanel === 'models'">
        <ViewerResourcesList
          v-if="!enabled"
          class="pointer-events-auto"
          @close="activePanel = 'none'"
        />
        <ViewerCompareChangesPanel v-else @close="activePanel = 'none'" />
      </KeepAlive>

      <!-- Explorer panel -->
      <KeepAlive v-show="resourceItems.length !== 0 && activePanel === 'explorer'">
        <ViewerExplorer class="pointer-events-auto" @close="activePanel = 'none'" />
      </KeepAlive>

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
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'
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
      width.value = Math.max(
        300,
        Math.min(startWidth + diffX, (parseInt('75vw') * window.innerWidth) / 100)
      )
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
const {
  diff: { enabled }
} = useInjectedViewerInterfaceState()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
const isMobile = breakpoints.smaller('sm')

const activePanel = ref<ActivePanel>('none')

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
  ToggleExplorer: () => toggleActivePanel('explorer'),
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
