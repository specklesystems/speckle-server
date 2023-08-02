<template>
  <Menu as="div" class="relative z-30">
    <MenuButton v-slot="{ open }" as="template">
      <ViewerControlsButtonToggle flat secondary :active="open">
        <VideoCameraIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
    </MenuButton>
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <MenuItems
        class="absolute translate-x-0 w-32 left-12 top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col"
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
              'text-sm py-2 transition': true
            }"
            @click="setView(view.name.toLowerCase() as CanonicalView)"
          >
            {{ view.name }}
          </button>
        </MenuItem>
        <div v-if="views.length !== 0" class="w-full border-b"></div>
        <!-- <div v-else class="text-tiny text-foreground-2 p-2">No other model views</div> -->

        <!-- Any model other views -->
        <MenuItem
          v-for="view in views"
          :key="view.name"
          v-slot="{ active }"
          as="template"
        >
          <button
            :class="{
              'bg-primary text-foreground-on-primary': active,
              'text-foreground': !active,
              'text-sm py-2 transition xxx-truncate': true
            }"
            @click="setView(view)"
          >
            <!-- TODO: For some reason using the `truncate` class creates weird behaviour in the layout -->
            {{ view.name.length > 12 ? view.name.substring(0, 12) + '...' : view.name }}
          </button>
        </MenuItem>
      </MenuItems>
    </Transition>
  </Menu>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { VideoCameraIcon } from '@heroicons/vue/24/outline'
import { CanonicalView, SpeckleView } from '~~/../viewer/dist'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'

const {
  viewer: {
    metadata: { views }
  }
} = useInjectedViewerState()
const { setView: setViewRaw } = useCameraUtilities()
const mp = useMixpanel()

const setView = (v: CanonicalView | SpeckleView) => {
  setViewRaw(v)
  mp.track('Viewer Action', {
    type: 'action',
    name: 'set-view',
    view: (v as SpeckleView)?.name || v
  })
}

const canonicalViews = [
  { name: 'Top' },
  { name: 'Front' },
  { name: 'Left' },
  { name: 'Back' },
  { name: 'Right' }
]
</script>
