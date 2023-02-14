<template>
  <div>
    <div
      class="absolute h-screen pt-[4.5rem] px-2 flex flex-col space-y-2 bg-green-300/0 z-20"
    >
      <ViewerControlsButtonToggle
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        :active="activeControl === 'explorer'"
        @click="toggleActiveControl('explorer')"
      >
        <IconFileExplorer class="w-5 h-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        :active="activeControl === 'filters'"
        @click="toggleActiveControl('filters')"
      >
        <FunnelIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
      <ViewerControlsButtonToggle
        :active="activeControl === 'comments'"
        @click="toggleActiveControl('comments')"
      >
        <ChatBubbleLeftRightIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>

      <!-- Standard viewer controls -->
      <ViewerControlsButtonGroup>
        <!-- Zoom extents -->
        <ViewerControlsButtonToggle flat @click="instance.zoom()">
          <ArrowsPointingOutIcon class="w-5 h-5" />
        </ViewerControlsButtonToggle>
        <!-- Projection type -->
        <!-- TODO: How to persist state between page navigation? e.g., swap to iso mode, move out, move back, iso mode is still on in viewer but not in ui -->
        <ViewerControlsButtonToggle
          flat
          secondary
          :active="isPerspectiveProjection"
          @click="toggleProjection()"
        >
          <IconPerspective v-if="!isPerspectiveProjection" class="w-4 h-4" />
          <IconPerspectiveMore v-else class="w-4 h-4" />
        </ViewerControlsButtonToggle>
        <!-- Sun and lights -->

        <ViewerControlsButtonToggle flat @click="">
          <SunIcon class="w-5 h-5" />
        </ViewerControlsButtonToggle>
        <!-- Section Box -->
        <ViewerControlsButtonToggle
          flat
          secondary
          :active="isSectionBoxEnabled"
          @click="toggleSectionBox()"
        >
          <ScissorsIcon class="w-5 h-5" />
        </ViewerControlsButtonToggle>
        <!-- Views -->
        <!-- <ViewerControlsButtonToggle flat @click="">
          <VideoCameraIcon class="w-5 h-5" />
        </ViewerControlsButtonToggle> -->
        <ViewerViewsMenu />
      </ViewerControlsButtonGroup>
    </div>
    <div
      :class="`z-10 absolute max-h-[calc(100vh-5.5rem)] w-80 mt-[4.5rem] px-[2px] py-[2px] mx-14 mb-4 transition overflow-y-auto simple-scrollbar ${
        activeControl !== 'none'
          ? 'translate-x-0 opacity-100'
          : '-translate-x-[100%] opacity-0'
      }`"
    >
      <div v-show="activeControl === 'models'">
        <KeepAlive>
          <ViewerResourcesList class="pointer-events-auto" />
        </KeepAlive>
      </div>
      <div v-show="activeControl === 'explorer'">
        <KeepAlive>
          <ViewerExplorer class="pointer-events-auto" />
        </KeepAlive>
      </div>
      <ViewerComments v-if="activeControl === 'comments'" class="pointer-events-auto" />
      <ViewerFilters v-if="activeControl === 'filters'" class="pointer-events-auto" />
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  SunIcon,
  ScissorsIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const {
  viewer: { instance },
  ui: {
    camera: { toggleProjection, isPerspectiveProjection },
    sectionBox: { toggleSectionBox, isSectionBoxEnabled }
  }
} = useInjectedViewerState()

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'comments'

const activeControl = ref<ActiveControl>('models')
const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)
</script>
