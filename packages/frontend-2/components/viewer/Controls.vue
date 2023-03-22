<template>
  <div>
    <div
      class="absolute z-20 flex h-screen flex-col space-y-2 bg-green-300/0 px-2 pt-[4.2rem]"
    >
      <ViewerControlsButtonToggle
        v-tippy="'Models (m)'"
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        v-tippy="'Scene Explorer (e)'"
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
        v-tippy="'Comments (c)'"
        :active="activeControl === 'comments'"
        @click="toggleActiveControl('comments')"
      >
        <ChatBubbleLeftRightIcon class="h-5 w-5" />
      </ViewerControlsButtonToggle>

      <!-- TODO: direct add comment -->
      <!-- <ViewerCommentsDirectAddComment v-show="activeControl === 'comments'" /> -->

      <!-- Standard viewer controls -->
      <ViewerControlsButtonGroup>
        <!-- Zoom extents -->
        <ViewerControlsButtonToggle
          v-tippy="'Zoom Extents (spacebar)'"
          flat
          @click="zoomExtentsOrSelection()"
        >
          <ArrowsPointingOutIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Projection type -->
        <!-- TODO (Question for fabs): How to persist state between page navigation? e.g., swap to iso mode, move out, move back, iso mode is still on in viewer but not in ui -->
        <ViewerControlsButtonToggle
          v-tippy="'Projection (p)'"
          flat
          secondary
          :active="isPerspectiveProjection"
          @click="toggleProjection()"
        >
          <IconPerspective v-if="!isPerspectiveProjection" class="h-4 w-4" />
          <IconPerspectiveMore v-else class="h-4 w-4" />
        </ViewerControlsButtonToggle>

        <!-- Section Box -->
        <ViewerControlsButtonToggle
          v-tippy="'Section Box (s)'"
          flat
          secondary
          :active="isSectionBoxEnabled"
          @click="toggleSectionBox()"
        >
          <ScissorsIcon class="h-5 w-5" />
        </ViewerControlsButtonToggle>

        <!-- Sun and lights -->
        <ViewerSunMenu v-tippy="'Light Controls'" />

        <!-- Views -->
        <ViewerViewsMenu v-tippy="'Views'" />
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
      <div v-show="activeControl === 'models'">
        <KeepAlive>
          <ViewerResourcesList
            class="pointer-events-auto"
            @loaded-more="scrollControlsToBottom"
            @close="activeControl = 'none'"
          />
        </KeepAlive>
      </div>
      <div v-show="activeControl === 'explorer'">
        <KeepAlive>
          <ViewerExplorer class="pointer-events-auto" @close="activeControl = 'none'" />
        </KeepAlive>
      </div>
      <ViewerComments
        v-if="activeControl === 'comments'"
        class="pointer-events-auto"
        @close="activeControl = 'none'"
      />
      <ViewerFilters v-if="activeControl === 'filters'" class="pointer-events-auto" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon
} from '@heroicons/vue/24/outline'
import { onKeyStroke } from '@vueuse/core'
import { Nullable } from '@speckle/shared'
// import { scrollToBottom } from '~~/lib/common/helpers/dom'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useTextInputGlobalFocus } from '~~/composables/states'

const {
  ui: {
    camera: { toggleProjection, isPerspectiveProjection, zoomExtentsOrSelection },
    sectionBox: { toggleSectionBox, isSectionBoxEnabled }
  }
} = useInjectedViewerState()

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'comments'

const activeControl = ref<ActiveControl>('models')
const scrollableControlsContainer = ref(null as Nullable<HTMLDivElement>)

const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)

const globalTextInputFocus = useTextInputGlobalFocus()

// Main nav kbd shortcuts
// TODO: better with modifier keys, and abstract away OS control/command stuff
onKeyStroke('m', () => {
  if (!globalTextInputFocus.value) toggleActiveControl('models')
})
onKeyStroke('e', () => {
  if (!globalTextInputFocus.value) toggleActiveControl('explorer')
})
onKeyStroke('f', () => {
  if (!globalTextInputFocus.value) toggleActiveControl('filters')
})
onKeyStroke(['c', 'C'], () => {
  if (!globalTextInputFocus.value) toggleActiveControl('comments')
})

// Viewer actions kbd shortcuts
onKeyStroke(' ', () => {
  if (!globalTextInputFocus.value) zoomExtentsOrSelection()
})
onKeyStroke('p', () => {
  if (!globalTextInputFocus.value) toggleProjection()
})
onKeyStroke('s', () => {
  if (!globalTextInputFocus.value) toggleSectionBox()
})

const scrollControlsToBottom = () => {
  // TODO: Currently this will scroll to the very bottom, which doesn't make sense when there are multiple models loaded
  // if (scrollableControlsContainer.value)
  //   scrollToBottom(scrollableControlsContainer.value)
}
</script>
