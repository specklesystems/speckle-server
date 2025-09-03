<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerLayoutPanel>
    <div class="w-64 simple-scrollbar overflow-y-auto flex flex-col">
      <div class="p-1">
        <ViewerMenuItem
          v-for="shortcut in viewShortcuts"
          :key="shortcut.name"
          :label="shortcut.name"
          hide-active-tick
          :active="activeView === shortcut.name.toLowerCase()"
          :shortcut="getShortcutDisplayText(shortcut, { hideName: true }) as string"
          @click="handleViewChange(shortcut.name.toLowerCase() as CanonicalView)"
        />
      </div>

      <hr class="w-full border-outline-2" />
      <div class="p-1 flex flex-col gap-1">
        <ViewerMenuItem
          label="Orthographic projection"
          :active="isOrthoProjection"
          :shortcut="
            getShortcutDisplayText(shortcuts.ToggleProjection, { hideName: true }) as string
          "
          @click="trackAndtoggleProjection()"
        />
        <ViewerMenuItem
          label="Free orbit"
          :active="!localViewerSettings.turntableMode"
          @click="toggleTurntableMode()"
        />
      </div>

      <hr v-if="views.length !== 0" class="w-full border-outline-2" />
      <div v-if="views.length !== 0" class="p-1">
        <ViewerMenuItem
          v-for="view in views"
          :key="view.id"
          hide-active-tick
          :active="activeView === view.id"
          :label="view.name ? view.name : view.id"
          @click="handleViewChange(view)"
        />
      </div>
    </div>
  </ViewerLayoutPanel>
</template>

<script setup lang="ts">
import type { CanonicalView, SpeckleView } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useInjectedViewerState,
  useInjectedViewer
} from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { ViewShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import { useViewerCameraControlEndTracker } from '~~/lib/viewer/composables/viewer'
import { CameraController } from '@speckle/viewer'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

type ViewerUserSettings = {
  turntableMode: boolean
}

const localViewerSettings = useSynchronizedCookie<ViewerUserSettings>(
  `localViewerSettings`,
  {
    default: () => {
      return { turntableMode: false }
    }
  }
)

const {
  viewer: {
    metadata: { views }
  }
} = useInjectedViewerState()
const { instance } = useInjectedViewer()
const { getShortcutDisplayText, registerShortcuts, shortcuts } = useViewerShortcuts()
const mixpanel = useMixpanel()
const {
  setView: setViewRaw,
  toggleProjection,
  camera: { isOrthoProjection }
} = useCameraUtilities()

const open = defineModel<boolean>('open', { default: false })
const activeView = ref<string | null>(null)
const viewShortcuts = Object.values(ViewShortcuts)

// Clear active view when camera control ends
useViewerCameraControlEndTracker(() => {
  activeView.value = null
})

const handleViewChange = (v: CanonicalView | SpeckleView, isShortcut = false) => {
  setViewRaw(v)
  activeView.value = typeof v === 'string' ? v : v.id

  if (isShortcut) {
    open.value = true
  }

  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'set-view',
    view: (v as SpeckleView)?.name || v
  })
}

const trackAndtoggleProjection = () => {
  toggleProjection()
  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'camera',
    camera: isOrthoProjection ? 'ortho' : 'perspective'
  })
}

const setViewerCameraHandlerControlsMaxPolarAngle = (angle: number) => {
  const extension = instance.getExtension(CameraController)
  if (extension) extension.options = { maximumPolarAngle: angle }
}

const toggleTurntableMode = () => {
  localViewerSettings.value = {
    ...localViewerSettings.value,
    turntableMode: !localViewerSettings.value.turntableMode
  }
  if (localViewerSettings.value.turntableMode) {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI / 2)
  } else {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI)
  }
}

registerShortcuts({
  SetViewTop: () => handleViewChange('top', true),
  SetViewFront: () => handleViewChange('front', true),
  SetViewLeft: () => handleViewChange('left', true),
  SetViewBack: () => handleViewChange('back', true),
  SetViewRight: () => handleViewChange('right', true),
  ToggleProjection: () => trackAndtoggleProjection()
})

onMounted(() => {
  if (localViewerSettings.value.turntableMode) {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI / 2)
  } else {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI)
  }
})
</script>
