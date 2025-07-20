<template>
  <aside class="absolute top-[4.125rem] z-20" :style="dynamicStyles">
    <ViewerControlsButtonGroup direction="vertical">
      <!-- Zoom extents -->
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ZoomExtentsOrSelection)"
        flat
        @click="trackAndzoomExtentsOrSelection()"
      >
        <IconViewerZoom class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Views -->
      <ViewerViewsMenu
        :open="activePanel === 'views'"
        @force-close-others="activePanel = 'none'"
        @update:open="(value) => toggleActivePanel(value ? 'views' : 'none')"
      />

      <!-- Projection type -->
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ToggleProjection)"
        flat
        secondary
        :active="isOrthoProjection"
        @click="trackAndtoggleProjection()"
      >
        <IconPerspective v-if="isOrthoProjection" class="h-3.5 md:h-4 w-4" />
        <IconPerspectiveMore v-else class="h-3.5 md:h-4 w-4" />
      </ViewerControlsButtonToggle>

      <!-- Free orbit -->
      <ViewerSettingsMenu />
    </ViewerControlsButtonGroup>
  </aside>
</template>

<script setup lang="ts">
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'

type ActivePanel = 'none' | 'views'

interface Props {
  sidebarOpen?: boolean
  sidebarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  sidebarOpen: false,
  sidebarWidth: 280
})

const {
  zoomExtentsOrSelection,
  toggleProjection,
  camera: { isOrthoProjection }
} = useCameraUtilities()
const { registerShortcuts, getShortcutDisplayText, shortcuts } = useViewerShortcuts()
const mixpanel = useMixpanel()

const activePanel = ref<ActivePanel>('none')

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

const dynamicStyles = computed(() => {
  if (props.sidebarOpen) {
    return {
      right: `${props.sidebarWidth / 16 + 1.125}rem`
    }
  } else {
    return {
      right: '1.125rem'
    }
  }
})

const trackAndzoomExtentsOrSelection = () => {
  zoomExtentsOrSelection()
  mixpanel.track('Viewer Action', { type: 'action', name: 'zoom', source: 'button' })
}

const trackAndtoggleProjection = () => {
  toggleProjection()
  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'camera',
    camera: isOrthoProjection ? 'ortho' : 'perspective'
  })
}

registerShortcuts({
  ZoomExtentsOrSelection: () => trackAndzoomExtentsOrSelection(),
  ToggleProjection: () => trackAndtoggleProjection()
})
</script>
