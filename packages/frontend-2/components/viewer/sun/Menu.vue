<template>
  <div class="relative z-30">
    <Popover as="div" class="relative z-30">
      <PopoverButton v-slot="{ open }" as="template">
        <ViewerControlsButtonToggle flat secondary :active="open">
          <SunIcon class="w-5 h-5" />
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
          class="absolute translate-x-0 left-10 sm:left-12 top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col space-y-2"
        >
          <div class="p-2 border-b border-outline flex gap-2 items-center">
            <div class="scale-90">
              <FormSwitch
                v-model="sunlightShadows"
                name="sunShadows"
                :show-label="false"
              />
            </div>
            <span class="text-foreground text-body-sm">Sun shadows</span>
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
            />
            <label class="text-body-xs text-foreground-2" for="intensity">
              Intensity
            </label>
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
            />
            <label class="text-body-xs text-foreground-2" for="elevation">
              Elevation
            </label>
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
            />
            <label class="text-body-xs text-foreground-2" for="indirect">
              Indirect
            </label>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  </div>
</template>
<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import type { SunLightConfiguration } from '@speckle/viewer'
import { SunIcon } from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { debounce } from 'lodash-es'
import { FormSwitch } from '@speckle/ui-components'

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
