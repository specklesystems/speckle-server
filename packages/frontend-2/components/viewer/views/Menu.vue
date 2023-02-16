<template>
  <Menu as="div" class="relative z-30">
    <MenuButton v-slot="{ open }" as="template">
      <ViewerControlsButtonToggle flat secondary :active="open">
        <VideoCameraIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
    </MenuButton>
    <MenuItems
      class="absolute translate-x-0 w-32 left-12 top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden flex flex-col"
    >
      <!-- Canonical views first -->
      <MenuItem
        v-for="view in canonicalViews"
        :key="view.name"
        v-slot="{ active }"
        as="template"
      >
        <button
          :class="{
            'bg-primary text-foreground-on-primary': active,
            'text-foreground': !active,
            'text-sm py-2': true
          }"
          @click="instance.setView(view.name.toLowerCase() as CanonicalView)"
        >
          {{ view.name }}
        </button>
      </MenuItem>
      <!-- <div class="w-full border-b"></div> -->

      <!-- Any model other views -->
      <MenuItem
        v-for="view in views"
        :key="view.name"
        v-slot="{ active }"
        as="template"
      >
        <button
          :class="{
            'bg-primary text-foreground-on-primary ': active,
            'text-foreground': !active,
            'text-sm py-2 h-36 truncate overflow-hidden': true
          }"
          @click="instance.setView(view)"
        >
          {{ view.name }}
        </button>
      </MenuItem>
    </MenuItems>
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { VideoCameraIcon } from '@heroicons/vue/24/outline'
import { CanonicalView, SpeckleView } from '~~/../viewer/dist'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'

const { instance } = useInjectedViewer()
const { viewerBusy } = useInjectedViewerInterfaceState()

const canonicalViews = [
  { name: 'Top' },
  { name: 'Front' },
  { name: 'Left' },
  { name: 'Back' },
  { name: 'Right' }
]

const views = ref<SpeckleView[]>([])

watch(
  viewerBusy,
  (newVal) => {
    views.value = instance.getViews()
  },
  { immediate: true }
)
</script>
