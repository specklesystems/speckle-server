<template>
  <ViewerControlsButtonToggle
    v-tippy="'Free Orbit'"
    flat
    :active="localViewerSettings.turntableMode"
    secondary
    @click="toggleTurntableMode()"
  >
    <IconFreeOrbit class="h-5 w-5" />
  </ViewerControlsButtonToggle>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
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

const { instance } = useInjectedViewer()

const setViewerCameraHandlerControlsMaxPolarAngle = (angle: number) => {
  instance.cameraHandler.controls.maxPolarAngle = angle
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

onMounted(() => {
  if (localViewerSettings.value.turntableMode) {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI / 2)
  } else {
    setViewerCameraHandlerControlsMaxPolarAngle(Math.PI)
  }
})
</script>
