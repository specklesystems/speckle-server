<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>Measure</template>
    <template #actions>
      <FormButton size="xs" text :icon-left="MinusIcon">Delete</FormButton>
    </template>
    <div class="p-4 flex flex-col gap-3">
      <div>
        <h6 class="font-semibold text-xs mb-2">Measurement Type</h6>
        <FormRadioGroup
          label="Select an Option"
          :options="typeOptions"
          @update:selected="updateType"
        />
      </div>
      <div class="flex gap-4">
        <div class="w-9/12">
          <h6 class="font-semibold text-xs">Units</h6>
          <ViewerMeasurementsUnitSelect
            v-model="selectedUnit"
            mount-menu-on-body
            @update:model-value="onChangeUnits"
          />
        </div>
        <div class="w-3/12">
          <h6 class="font-semibold text-xs mb-1.5">Snap</h6>
          <div class="scale-95 -ml-1">
            <FormSwitch
              :model-value="snapEnabled"
              @update:model-value="(newValue) => onSnapEnabledChange(newValue)"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <label class="font-semibold text-xs" for="precision">Precision</label>
        <div class="flex gap-2 items-center">
          <input
            id="precision"
            v-model="precision"
            class="h-2 mr-2 flex-1"
            type="range"
            name="intensity"
            min="1"
            max="5"
            step="1"
          />
          <span class="text-xs w-4">{{ precision }}</span>
        </div>
      </div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { MinusIcon } from '@heroicons/vue/24/solid'
import { FormSwitch, FormRadioGroup } from '@speckle/ui-components'

interface Option {
  title: string
  description: string
}

defineEmits(['close'])

const snapEnabled = ref(false)
const precision = ref()
const selectedUnit = ref('Meters')

const typeOptions = [
  {
    title: 'Point to Point',
    description: 'Select two points to measure the direct distance between them'
  },
  {
    title: 'Perpendicular',
    description: 'Distance between a point and a surface, perpendicular to the target'
  }
]

const updateType = (selectedOption: Option) => {
  console.log('Selected option:', selectedOption)
}

const onChangeUnits = (newUnit: string) => {
  console.log('Selected Unit:', newUnit)
}

const onSnapEnabledChange = (newValue: boolean) => {
  snapEnabled.value = newValue
  console.log(newValue)
}
</script>
