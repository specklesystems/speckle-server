<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle flat secondary :active="open" @click="open = !open">
      <IconViews class="w-5 h-5" />
    </ViewerControlsButtonToggle>
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute translate-x-0 w-32 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col"
      >
        <!-- Canonical views first -->
        <div v-for="view in canonicalViews" :key="view.name">
          <button
            class="hover:bg-primary-muted text-foreground w-full h-full text-body-xs py-1"
            @click="setView(view.name.toLowerCase() as CanonicalView)"
          >
            {{ view.name }}
          </button>
        </div>
        <div v-if="views.length !== 0" class="w-full border-b"></div>
        <!-- Any model other views -->
        <div v-for="view in views" :key="view.id">
          <button
            class="hover:bg-primary-muted text-foreground w-full h-full text-body-xs py-1 transition"
            :title="view.name"
            @click="setView(view)"
          >
            <span class="block truncate max-w-28 mx-auto">
              {{ view.name ? view.name : view.id }}
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import type { CanonicalView, SpeckleView } from '~~/../viewer/dist'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'
import { onClickOutside } from '@vueuse/core'

const {
  viewer: {
    metadata: { views }
  }
} = useInjectedViewerState()
const { setView: setViewRaw } = useCameraUtilities()
const mp = useMixpanel()

const open = ref(false)

const menuWrapper = ref(null)

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

onClickOutside(menuWrapper, () => {
  open.value = false
})
</script>
