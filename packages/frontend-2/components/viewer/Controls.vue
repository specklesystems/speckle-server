<template>
  <div>
    <div
      class="absolute z-20 flex h-screen flex-col space-y-2 bg-green-300/0 px-2 pt-[4.2rem]"
    >
      <ViewerControlsButtonToggle
        v-tippy="modelsShortcut"
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        v-tippy="explorerShortcut"
        :active="activeControl === 'explorer'"
        @click="toggleActiveControl('explorer')"
      >
        <IconFileExplorer class="h-5 w-5" />
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
        v-tippy="discussionsShortcut"
        :active="activeControl === 'discussions'"
        @click="toggleActiveControl('discussions')"
      >
        <ChatBubbleLeftRightIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>

      <!-- TODO: direct add comment -->
      <!-- <ViewerCommentsDirectAddComment v-show="activeControl === 'comments'" /> -->

      <!-- Standard viewer controls -->
      <ViewerControlsButtonGroup>
        <!-- Zoom extents -->
        <ViewerControlsButtonToggle
          v-tippy="zoomExtentsShortcut"
          flat
          @click="trackAndzoomExtentsOrSelection()"
        >
          <ArrowsPointingOutIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Projection type -->
        <!-- TODO (Question for fabs): How to persist state between page navigation? e.g., swap to iso mode, move out, move back, iso mode is still on in viewer but not in ui -->
        <ViewerControlsButtonToggle
          v-tippy="projectionShortcut"
          flat
          secondary
          :active="isOrthoProjection"
          @click="trackAndtoggleProjection()"
        >
          <IconPerspective v-if="isOrthoProjection" class="h-4 w-4" />
          <IconPerspectiveMore v-else class="h-4 w-4" />
        </ViewerControlsButtonToggle>

        <!-- Section Box -->
        <ViewerControlsButtonToggle
          v-tippy="sectionBoxShortcut"
          flat
          secondary
          :active="isSectionBoxEnabled"
          @click="toggleSectionBox()"
        >
          <ScissorsIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Sun and lights -->
        <ViewerSunMenu v-tippy="'Light Controls'" />

        <!-- Explosion -->
        <ViewerExplodeMenu v-tippy="'Explode'" />

        <!-- Views -->
        <ViewerViewsMenu v-tippy="'Views'" />

        <!-- Settings -->
        <ViewerSettingsMenu />
      </ViewerControlsButtonGroup>
    </div>
    <div
      ref="scrollableControlsContainer"
      :class="`simple-scrollbar absolute z-10 mx-14 mt-[4rem] mb-4 max-h-[calc(100vh-5.5rem)] w-72 overflow-y-auto px-[2px] py-[2px] transition ${
        activeControl !== 'none'
          ? 'translate-x-0 opacity-100'
          : '-translate-x-[100%] opacity-0'
      }`"
    >
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
  PlusIcon
} from '@heroicons/vue/24/outline'
import { Nullable } from '@speckle/shared'
import {
  useCameraUtilities,
  useSectionBoxUtilities
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
const { resourceItems } = useInjectedViewerLoadedResources()

const { toggleSectionBox, isSectionBoxEnabled } = useSectionBoxUtilities()

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'discussions'
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
  `Zoom Extents (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'Space'])})`
)
const projectionShortcut = ref(
  `Projection (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'p'])})`
)
const sectionBoxShortcut = ref(
  `Section Box (${getKeyboardShortcutTitle([ModifierKeys.AltOrOpt, 'b'])})`
)

const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)

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
</script>
