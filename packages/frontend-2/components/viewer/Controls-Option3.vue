<template>
  <div>
    <div
      class="absolute h-screen pt-[4.5rem] px-2 flex flex-col space-y-2 bg-green-300/0 z-20"
    >
      <ViewerControlsButton
        :active="activeControl === 'models'"
        @click="toggleActiveControl('models')"
      >
        <CubeIcon class="w-5 h-5" />
      </ViewerControlsButton>
      <ViewerControlsButton
        :active="activeControl === 'explorer'"
        @click="toggleActiveControl('explorer')"
      >
        <IconFileExplorer class="w-5 h-5" />
      </ViewerControlsButton>
      <ViewerControlsButton
        :active="activeControl === 'filters'"
        @click="toggleActiveControl('filters')"
      >
        <FunnelIcon class="w-5 h-5" />
      </ViewerControlsButton>
      <ViewerControlsButton
        :active="activeControl === 'comments'"
        @click="toggleActiveControl('comments')"
      >
        <ChatBubbleLeftRightIcon class="w-5 h-5" />
      </ViewerControlsButton>
    </div>
    <div
      :class="`z-20 absolute max-h-[calc(100vh-5.5rem)] w-80 mt-[4.5rem] px-[2px] py-[2px] mx-14 mb-4 transition overflow-y-auto simple-scrollbar ${
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
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline'

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'comments'

const activeControl = ref<ActiveControl>('models')
const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)
</script>
