<template>
  <aside class="absolute top-[4.125rem] z-20" :style="dynamicStyles">
    <ViewerControlsButtonGroup direction="vertical">
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ZoomExtentsOrSelection)"
        icon="IconViewerZoom"
        @click="trackAndzoomExtentsOrSelection()"
      />
      <ViewerControlsButtonToggle
        v-tippy="'Camera controls'"
        icon="IconViewerCameraControls"
        :active="activePanel === 'cameraControls'"
        @click="toggleActivePanel('cameraControls')"
      />
    </ViewerControlsButtonGroup>

    <div class="absolute top-0 right-12">
      <ViewerCameraMenu v-show="activePanel === 'cameraControls'" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'

type ActivePanel = 'none' | 'cameraControls'

interface Props {
  sidebarOpen?: boolean
  sidebarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  sidebarOpen: false,
  sidebarWidth: 280
})

const { zoomExtentsOrSelection } = useCameraUtilities()
const { registerShortcuts, getShortcutDisplayText, shortcuts } = useViewerShortcuts()
const mixpanel = useMixpanel()

const activePanel = ref<ActivePanel>('none')

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

const dynamicStyles = computed(() => {
  if (props.sidebarOpen) {
    return {
      right: `${props.sidebarWidth / 16 + 0.75}rem`
    }
  } else {
    return {
      right: '0.75rem'
    }
  }
})

const trackAndzoomExtentsOrSelection = () => {
  zoomExtentsOrSelection()
  mixpanel.track('Viewer Action', { type: 'action', name: 'zoom', source: 'button' })
}

registerShortcuts({
  ZoomExtentsOrSelection: () => trackAndzoomExtentsOrSelection()
})
</script>
