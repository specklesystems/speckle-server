<template>
  <ViewerMenu
    v-model:open="open"
    tooltip="Light controls"
    :disabled="!isLightingSupported"
    :disabled-tooltip="'Light controls are only available in Default and Default with Edges view modes'"
  >
    <template #trigger-icon>
      <SunIcon class="w-5 h-5" :class="{ 'text-foreground-3': !isLightingSupported }" />
    </template>
    <div class="flex flex-col gap-1.5">
      <div v-if="!isLightingSupported" class="-mb-1 p-2 pb-0">
        <CommonAlert size="xs" color="info">
          <template #title>
            <span class="block text-body-2xs">Not available in current view mode.</span>
          </template>
        </CommonAlert>
      </div>
      <div class="px-2 py-1 border-b border-outline flex gap-2 items-center">
        <FormSwitch
          v-model="sunlightShadows"
          name="sunShadows"
          :show-label="false"
          :disabled="!isLightingSupported"
        />
        <span class="text-foreground text-body-xs">Sun shadows</span>
      </div>
      <div class="flex items-center gap-1 px-2">
        <input
          id="intensity"
          v-model="intensity"
          class="w-24 sm:w-32 h-2 mr-2"
          type="range"
          name="intensity"
          min="1"
          max="10"
          step="0.05"
          :disabled="!isLightingSupported"
        />
        <label class="text-body-xs text-foreground-2" for="intensity">Intensity</label>
      </div>
      <div class="flex items-center gap-1 px-2">
        <input
          id="elevation"
          v-model="elevation"
          class="w-24 sm:w-32 h-2 mr-2"
          type="range"
          name="elevation"
          min="0"
          :max="Math.PI"
          step="0.05"
          :disabled="!isLightingSupported"
        />
        <label class="text-body-xs text-foreground-2" for="elevation">Elevation</label>
      </div>
      <div class="flex items-center gap-1 px-2">
        <input
          id="azimuth"
          v-model="azimuth"
          class="w-24 sm:w-32 h-2 mr-2"
          type="range"
          name="azimuth"
          :min="-Math.PI * 0.5"
          :max="Math.PI * 0.5"
          step="0.05"
          :disabled="!isLightingSupported"
        />
        <label class="text-body-xs text-foreground-2" for="azimuth">Azimuth</label>
      </div>
      <div class="flex items-center gap-1 px-2 pb-2">
        <input
          id="indirect"
          v-model="indirectLightIntensity"
          class="w-24 sm:w-32 h-2 mr-2"
          type="range"
          name="indirect"
          min="0"
          max="5"
          step="0.05"
          :disabled="!isLightingSupported"
        />
        <label class="text-body-xs text-foreground-2" for="indirect">Indirect</label>
      </div>
    </div>
  </ViewerMenu>
</template>

<script setup lang="ts">
import { type SunLightConfiguration } from '@speckle/viewer'
import { SunIcon } from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { debounce } from 'lodash-es'
import { FormSwitch } from '@speckle/ui-components'

defineProps<{
  isLightingSupported?: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const mp = useMixpanel()
const debounceTrackLightConfigChange = debounce(() => {
  mp.track('Viewer Action', {
    type: 'action',
    name: 'light-config-change'
  })
}, 1000)

const createLightConfigComputed = <K extends keyof SunLightConfiguration>(key: K) =>
  computed({
    get: () => lightConfig.value[key],
    set: (newVal) => {
      lightConfig.value = {
        ...lightConfig.value,
        [key]: newVal
      }
      debounceTrackLightConfigChange()
    }
  })

const {
  ui: { lightConfig }
} = useInjectedViewerState()

const intensity = createLightConfigComputed('intensity')
const elevation = createLightConfigComputed('elevation')
const azimuth = createLightConfigComputed('azimuth')
const indirectLightIntensity = createLightConfigComputed('indirectLightIntensity')
const sunlightShadows = createLightConfigComputed('castShadow')
</script>
