<template>
  <Popover as="div" class="relative z-30">
    <PopoverButton v-slot="{ open }" as="template">
      <ViewerControlsButtonToggle flat secondary :active="open">
        <CogIcon class="w-5 h-5" />
      </ViewerControlsButtonToggle>
    </PopoverButton>
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <PopoverPanel
        class="absolute translate-x-0 left-12 top-2 p-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col space-y-2"
      >
        <div class="text-sm text-foreground-2 text-left">Local Settings</div>
        <div class="flex items-center space-x-2 w-44">
          <span class="text-xs text-left">
            Prevent camera from going under the model
          </span>
          <FormButton
            size="xs"
            :outlined="!localViewerSettings.turntableMode"
            @click="toggleTurntableMode()"
          >
            {{ localViewerSettings.turntableMode ? 'ON' : 'OFF' }}
          </FormButton>
        </div>
      </PopoverPanel>
    </Transition>
  </Popover>
</template>
<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { CogIcon } from '@heroicons/vue/24/outline'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
type ViewerUserSettings = {
  turntableMode: boolean
}

const localViewerSettings = useSynchronizedCookie<ViewerUserSettings>(
  `localViewerSettings`,
  {
    default: () => {
      return { turntableMode: true }
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
