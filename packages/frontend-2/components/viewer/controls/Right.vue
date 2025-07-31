<template>
  <aside
    ref="buttonContainer"
    class="absolute z-20"
    :class="
      isEmbedEnabled ? 'top-[0.5rem]' : 'top-[3.75rem] sm:top-[3.5rem] lg:top-[3.75rem]'
    "
    :style="dynamicStyles"
  >
    <ViewerControlsButtonGroup ref="buttonContainer" direction="vertical">
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

    <div
      ref="menuContainer"
      class="absolute right-[2.875rem]"
      :class="isEmbedEnabled ? 'top-0' : 'top-[2.5rem]'"
    >
      <ViewerCameraMenu v-show="activePanel === 'cameraControls'" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { onClickOutside, useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import type { Nullable } from '@speckle/shared'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

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
const { isEnabled: isEmbedEnabled } = useEmbed()

const breakpoints = useBreakpoints(TailwindBreakpoints)
const isSmOrLarger = breakpoints.greaterOrEqual('sm')
const isLgOrLarger = breakpoints.greaterOrEqual('lg')

const activePanel = ref<ActivePanel>('none')
const menuContainer = ref<Nullable<HTMLElement>>(null)
const buttonContainer = ref<Nullable<HTMLElement>>(null)

const dynamicStyles = computed(() => {
  if (props.sidebarOpen) {
    const offset = isSmOrLarger.value && !isLgOrLarger.value ? 1 : 0.75
    return {
      right: `${props.sidebarWidth / 16 + offset}rem`
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

onClickOutside(
  menuContainer,
  () => {
    activePanel.value = 'none'
  },
  {
    ignore: [buttonContainer]
  }
)
</script>
