<template>
  <div
    class="absolute h-screen pt-[4.5rem] px-2 flex flex-col space-y-2 bg-green-300/0"
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
    :class="`pointer-events-none absolute h-screen pt-[4.5rem] px-[2px] mx-14 mb-4 transition-[width,opacity] ease-in-out duration-75 overflow-hidden bg-lime-300/0 overflow-y-auto ${
      activeControl !== 'none' ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <KeepAlive>
      <ViewerResourcesList
        v-show="activeControl === 'models'"
        class="pointer-events-auto"
      />
    </KeepAlive>
    <ViewerExplorer v-if="activeControl === 'explorer'" class="pointer-events-auto" />
    <ViewerComments v-if="activeControl === 'comments'" class="pointer-events-auto" />
    <ViewerFilters v-if="activeControl === 'filters'" class="pointer-events-auto" />
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
