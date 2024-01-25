<template>
  <div v-if="showViewerControls && !embedOptions.hideControls">
    <div
      class="absolute z-20 flex max-h-screen simple-scrollbar flex-col space-y-1 lg:space-y-2 bg-green-300/0 px-2"
      :class="
        showNavbar && !embedOptions.isEnabled
          ? 'pt-[4.2rem]'
          : embedOptions.isTransparent
          ? 'pt-2'
          : 'pt-2 pb-16'
      "
    >
      <!-- Models -->
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : modelsShortcut"
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="h-4 w-4 lg:h-5 lg:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Explorer -->
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : explorerShortcut"
        :active="activeControl === 'explorer'"
        @click="toggleActiveControl('explorer')"
      >
        <IconFileExplorer class="h-4 w-4 lg:h-5 lg:w-5" />
      </ViewerControlsButtonToggle>

      <!-- TODO -->
      <!-- <ViewerControlsButtonToggle
        :active="activeControl === 'filters'"
        @click="toggleActiveControl('filters')"
      >
        <FunnelIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle> -->

      <!-- Comment threads -->
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : discussionsShortcut"
        :active="activeControl === 'discussions'"
        @click="toggleActiveControl('discussions')"
      >
        <ChatBubbleLeftRightIcon class="h-4 w-4 lg:h-5 lg:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Automateeeeeeee FTW -->
      <ViewerControlsButtonToggle
        v-if="allAutomationRuns.length !== 0"
        v-tippy="isSmallerOrEqualSm ? undefined : summary.longSummary"
        :active="activeControl === 'automate'"
        class="p-2"
        @click="toggleActiveControl('automate')"
      >
        <!-- <PlayCircleIcon class="h-5 w-5" /> -->
        <!-- {{allAutomationRuns.length}} -->
        <AutomationDoughnutSummary :summary="summary" />
      </ViewerControlsButtonToggle>

      <!-- TODO: direct add comment -->
      <!-- <ViewerCommentsDirectAddComment v-show="activeControl === 'comments'" /> -->

      <!-- Measurements -->
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : measureShortcut"
        :active="activeControl === 'measurements'"
        @click="toggleMeasurements"
      >
        <IconMeasurements class="h-4 w-4 lg:h-5 lg:w-5" />
      </ViewerControlsButtonToggle>
      <div class="w-8 flex gap-2">
        <div class="lg:hidden">
          <ViewerControlsButtonToggle
            :active="activeControl === 'mobileOverflow'"
            @click="toggleActiveControl('mobileOverflow')"
          >
            <ChevronDoubleRightIcon
              class="h-4 w-4 lg:h-5 lg:w-5 transition"
              :class="activeControl === 'mobileOverflow' ? 'rotate-180' : ''"
            />
          </ViewerControlsButtonToggle>
        </div>
        <div
          class="-mt-28 lg:mt-0 bg-foundation lg:bg-transparent lg:gap-2 shadow-md lg:shadow-none flex flex-col rounded-lg transition-all *:shadow-none *:py-0 *:lg:shadow-md *:lg:py-2"
          :class="[
            activeControl === 'mobileOverflow' ? '' : '-translate-x-24 lg:translate-x-0'
          ]"
        >
          <ViewerControlsButtonGroup>
            <!-- Views -->
            <ViewerViewsMenu v-tippy="isSmallerOrEqualSm ? undefined : 'Views'" />
            <!-- Zoom extents -->
            <ViewerControlsButtonToggle
              v-tippy="isSmallerOrEqualSm ? undefined : zoomExtentsShortcut"
              flat
              @click="trackAndzoomExtentsOrSelection()"
            >
              <ArrowsPointingOutIcon class="h-4 w-4 lg:h-5 lg:w-5" />
            </ViewerControlsButtonToggle>

            <!-- Sun and lights -->
            <ViewerSunMenu
              v-tippy="isSmallerOrEqualSm ? undefined : 'Light Controls'"
            />
          </ViewerControlsButtonGroup>
          <ViewerControlsButtonGroup>
            <!-- Projection type -->
            <!-- TODO (Question for fabs): How to persist state between page navigation? e.g., swap to iso mode, move out, move back, iso mode is still on in viewer but not in ui -->
            <ViewerControlsButtonToggle
              v-tippy="isSmallerOrEqualSm ? undefined : projectionShortcut"
              flat
              secondary
              :active="isOrthoProjection"
              @click="trackAndtoggleProjection()"
            >
              <IconPerspective v-if="isOrthoProjection" class="h-3.5 lg:h-4 w-4" />
              <IconPerspectiveMore v-else class="h-3.5 lg:h-4 w-4" />
            </ViewerControlsButtonToggle>

            <!-- Section Box -->
            <ViewerControlsButtonToggle
              v-tippy="isSmallerOrEqualSm ? undefined : sectionBoxShortcut"
              flat
              secondary
              :active="isSectionBoxEnabled"
              @click="toggleSectionBox()"
            >
              <ScissorsIcon class="h-4 w-4 lg:h-5 lg:w-5" />
            </ViewerControlsButtonToggle>

            <!-- Explosion -->
            <ViewerExplodeMenu v-tippy="isSmallerOrEqualSm ? undefined : 'Explode'" />

            <!-- Settings -->
            <ViewerSettingsMenu />
          </ViewerControlsButtonGroup>
        </div>
        <!-- Standard viewer controls -->
      </div>
    </div>
    <div
      ref="scrollableControlsContainer"
      :class="`simple-scrollbar absolute z-10 ml-12 lg:ml-14 mb-4 max-h-[calc(100dvh-4.5rem)] w-56 lg:w-72 overflow-y-auto px-[2px] py-[2px] transition ${
        activeControl !== 'none'
          ? 'translate-x-0 opacity-100'
          : '-translate-x-[100%] opacity-0'
      } ${embedOptions.isEnabled ? 'mt-1.5' : 'mt-[4rem]'}`"
    >
      <div v-show="activeControl.length !== 0 && activeControl === 'measurements'">
        <KeepAlive>
          <div><ViewerMeasurementsOptions @close="toggleMeasurements" /></div>
        </KeepAlive>
      </div>
      <div v-show="resourceItems.length !== 0 && activeControl === 'models'">
        <KeepAlive>
          <div>
            <ViewerResourcesList
              v-if="!enabled"
              class="pointer-events-auto"
              @loaded-more="scrollControlsToBottom"
              @close="activeControl = 'none'"
            />
            <ViewerCompareChangesPanel v-else @close="activeControl = 'none'" />
          </div>
        </KeepAlive>
      </div>
      <div v-show="resourceItems.length !== 0 && activeControl === 'explorer'">
        <KeepAlive>
          <ViewerExplorer class="pointer-events-auto" @close="activeControl = 'none'" />
        </KeepAlive>
      </div>
      <ViewerComments
        v-if="resourceItems.length !== 0 && activeControl === 'discussions'"
        class="pointer-events-auto"
        @close="activeControl = 'none'"
      />
      <ViewerFilters
        v-if="resourceItems.length !== 0 && activeControl === 'filters'"
        class="pointer-events-auto"
      />
      <div v-show="resourceItems.length !== 0 && activeControl === 'automate'">
        <ViewerAutomatePanel
          :automation-runs="allAutomationRuns"
          :summary="summary"
          @close="activeControl = 'none'"
        />
      </div>

      <!-- Empty state -->
      <div v-if="resourceItems.length === 0">
        <div class="flex items-center py-3 px-2">
          <div class="text-sm text-foreground-2">No models loaded.</div>
          <div>
            <FormButton
              size="xs"
              text
              :icon-left="PlusIcon"
              @click="openAddModel = true"
            >
              Add
            </FormButton>
            <ViewerResourcesAddModelDialog v-model:open="openAddModel" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon,
  PlusIcon,
  ChevronDoubleRightIcon
} from '@heroicons/vue/24/outline'
import type { Nullable } from '@speckle/shared'
import {
  useCameraUtilities,
  useSectionBoxUtilities,
  useMeasurementUtilities
} from '~~/lib/viewer/composables/ui'
import {
  onKeyboardShortcut,
  ModifierKeys,
  getKeyboardShortcutTitle
} from '@speckle/ui-components'
import {
  useInjectedViewerLoadedResources,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'

const {
  zoomExtentsOrSelection,
  toggleProjection,
  camera: { isOrthoProjection }
} = useCameraUtilities()

import { AutomationRunStatus } from '~~/lib/common/generated/gql/graphql'
import type { AutomationRun } from '~~/lib/common/generated/gql/graphql'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

const { resourceItems, modelsAndVersionIds } = useInjectedViewerLoadedResources()

const { toggleSectionBox, isSectionBoxEnabled } = useSectionBoxUtilities()

const { enableMeasurements } = useMeasurementUtilities()

const { showNavbar, showViewerControls } = useTourStageState().value
const { embedOptions } = useEmbedState()

const allAutomationRuns = computed(() => {
  const allAutomationStatuses = modelsAndVersionIds.value
    .map((model) => model.model.loadedVersion.items[0].automationStatus)
    .flat()
    .filter((run) => !!run)
  return allAutomationStatuses
    .map((status) => status?.automationRuns)
    .flat() as AutomationRun[]
})

const allFunctionRuns = computed(() => {
  return allAutomationRuns.value.map((run) => run.functionRuns).flat()
})

const summary = computed(() => {
  const result = {
    failed: 0,
    passed: 0,
    inProgress: 0,
    total: allFunctionRuns.value.length,
    title: 'All runs passed.',
    titleColor: 'text-success',
    longSummary: ''
  }

  for (const run of allFunctionRuns.value) {
    switch (run?.status) {
      case AutomationRunStatus.Succeeded:
        result.passed++
        break
      case AutomationRunStatus.Failed:
        result.title = 'Some runs failed.'
        result.titleColor = 'text-danger'
        result.failed++
        break
      default:
        if (result.failed === 0) {
          result.title = 'Some runs are still in progress.'
          result.titleColor = 'text-warning'
        }
        result.inProgress++
        break
    }
  }

  // format:
  // 2 failed, 1 passed runs
  // 1 passed, 2 in progress, 1 failed runs
  // 1 passed run
  const longSummarySegments = []
  if (result.passed > 0) longSummarySegments.push(`${result.passed} passed`)
  if (result.inProgress > 0)
    longSummarySegments.push(`${result.inProgress} in progress`)
  if (result.failed > 0) longSummarySegments.push(`${result.failed} failed`)

  result.longSummary = (
    longSummarySegments.join(', ') + ` run${result.total > 1 ? 's' : ''}.`
  ).replace(/,(?=[^,]+$)/, ', and')

  return result
})

type ActiveControl =
  | 'none'
  | 'models'
  | 'explorer'
  | 'filters'
  | 'discussions'
  | 'automate'
  | 'measurements'
  | 'mobileOverflow'

const openAddModel = ref(false)

const activeControl = ref<ActiveControl>('models')

const scrollableControlsContainer = ref(null as Nullable<HTMLDivElement>)
const {
  diff: { enabled }
} = useInjectedViewerInterfaceState()

const modelsShortcut = ref(
  `Models (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'm'])})`
)
const explorerShortcut = ref(
  `Scene Explorer (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'e'])})`
)
const discussionsShortcut = ref(
  `Discussions (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 't'])})`
)
const zoomExtentsShortcut = ref(
  `Fit to screen (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'Space'])})`
)
const projectionShortcut = ref(
  `Projection (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'p'])})`
)
const sectionBoxShortcut = ref(
  `Section Box (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'b'])})`
)
const measureShortcut = ref(
  `Measure Mode (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'd'])})`
)

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const toggleActiveControl = (control: ActiveControl) => {
  const isMeasurementsActive = activeControl.value === 'measurements'
  if (isMeasurementsActive && control !== 'measurements') {
    enableMeasurements(false)
  }
  activeControl.value = activeControl.value === control ? 'none' : control
}

onKeyboardShortcut([ModifierKeys.AltOrOpt], 'm', () => {
  toggleActiveControl('models')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'e', () => {
  toggleActiveControl('explorer')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'f', () => {
  toggleActiveControl('filters')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], ['t'], () => {
  toggleActiveControl('discussions')
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'd', () => {
  toggleActiveControl('measurements')
})

// Viewer actions kbd shortcuts
onKeyboardShortcut([ModifierKeys.AltOrOpt], ' ', () => {
  trackAndzoomExtentsOrSelection()
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'p', () => {
  toggleProjection()
})
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'b', () => {
  toggleSectionBox()
})

const mp = useMixpanel()
watch(activeControl, (newVal) => {
  mp.track('Viewer Action', { type: 'action', name: 'controls-toggle', action: newVal })
})

const trackAndzoomExtentsOrSelection = () => {
  zoomExtentsOrSelection()
  mp.track('Viewer Action', { type: 'action', name: 'zoom', source: 'button' })
}

const trackAndtoggleProjection = () => {
  toggleProjection()
  mp.track('Viewer Action', {
    type: 'action',
    name: 'camera',
    camera: isOrthoProjection ? 'ortho' : 'perspective'
  })
}

watch(isSectionBoxEnabled, (val) => {
  mp.track('Viewer Action', {
    type: 'action',
    name: 'section-box',
    status: val
  })
})

const scrollControlsToBottom = () => {
  // TODO: Currently this will scroll to the very bottom, which doesn't make sense when there are multiple models loaded
  // if (scrollableControlsContainer.value)
  //   scrollToBottom(scrollableControlsContainer.value)
}

const toggleMeasurements = () => {
  const isMeasurementsActive = activeControl.value === 'measurements'
  enableMeasurements(!isMeasurementsActive)
  activeControl.value = isMeasurementsActive ? 'none' : 'measurements'
}

onMounted(() => {
  activeControl.value = isSmallerOrEqualSm.value ? 'none' : 'models'
})

watch(isSmallerOrEqualSm, (newVal) => {
  activeControl.value = newVal ? 'none' : 'models'
})
</script>
