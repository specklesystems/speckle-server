<template>
  <aside class="absolute top-[3.75rem] z-20" :style="dynamicStyles">
    <ViewerControlsButtonGroup direction="vertical">
      <ViewerControlsButtonToggle
        v-tippy="
          getTooltipProps(getShortcutDisplayText(shortcuts.ZoomExtentsOrSelection), {
            placement: 'left'
          })
        "
        icon="IconViewerZoom"
        @click="trackAndzoomExtentsOrSelection()"
      />
      <ViewerControlsButtonToggle
        v-tippy="getTooltipProps('Camera controls', { placement: 'left' })"
        icon="IconViewerCameraControls"
        :active="activePanel === 'cameraControls'"
        @click="toggleActivePanel('cameraControls')"
      />
    </ViewerControlsButtonGroup>

    <div ref="menuContainer" class="absolute top-0 right-[2.875rem]">
      <ViewerCameraMenu v-show="activePanel === 'cameraControls'" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { onClickOutside } from '@vueuse/core'
import type { Nullable } from '@speckle/shared'

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
const { getTooltipProps } = useSmartTooltipDelay()

const activePanel = ref<ActivePanel>('none')
const menuContainer = ref<Nullable<HTMLElement>>(null)

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

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

const trackAndzoomExtentsOrSelection = () => {
  zoomExtentsOrSelection()
  mixpanel.track('Viewer Action', { type: 'action', name: 'zoom', source: 'button' })
}

registerShortcuts({
  ZoomExtentsOrSelection: () => trackAndzoomExtentsOrSelection()
})

onClickOutside(menuContainer, () => {
  activePanel.value = 'none'
})
</script>
