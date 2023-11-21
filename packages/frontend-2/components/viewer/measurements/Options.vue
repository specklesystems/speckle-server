<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>Measure</template>
    <template #actions>
      <FormButton size="xs" text :icon-left="MinusIcon" disabled>Delete</FormButton>
    </template>
    <div class="p-4 flex flex-col gap-3">
      <div>
        <h6 class="font-semibold text-xs mb-2">Measurement Type</h6>
        <FormRadioGroup
          label="Select an Option"
          :options="measurementTypeOptions"
          @update:selected="updateMeasurementsType"
        />
      </div>
      <div class="flex gap-4">
        <div class="w-9/12">
          <h6 class="font-semibold text-xs">Units</h6>
          <ViewerMeasurementsUnitSelect
            v-model="selectedUnit"
            mount-menu-on-body
            @update:model-value="onChangeMeasurementUnits"
          />
        </div>
        <div class="w-3/12">
          <h6 class="font-semibold text-xs mb-1.5">Snap</h6>
          <div class="scale-95 -ml-1">
            <FormSwitch
              :model-value="measurementParams.vertexSnap"
              @update:model-value="() => toggleMeasurementsSnap()"
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
import { MeasurementType } from '@speckle/viewer'
import { useMeasurementUtilities } from '~~/lib/viewer/composables/ui'

interface Option {
  title: string
  description: string
  value: MeasurementType
}

defineEmits(['close'])

const precision = ref()
const selectedUnit = ref('Meters')

const measurementParams = ref({
  type: MeasurementType.POINTTOPOINT,
  vertexSnap: true,
  units: selectedUnit.value,
  precision: 2
})

const { setMeasurementOptions } = useMeasurementUtilities()

const updateMeasurementsType = (selectedOption: Option) => {
  measurementParams.value.type = selectedOption.value
  setMeasurementOptions(measurementParams.value)
}

const onChangeMeasurementUnits = (newUnit: string) => {
  selectedUnit.value = newUnit
  measurementParams.value.units = newUnit
  setMeasurementOptions(measurementParams.value)
}

const toggleMeasurementsSnap = () => {
  measurementParams.value.vertexSnap = !measurementParams.value.vertexSnap
  setMeasurementOptions(measurementParams.value)
}

const measurementTypeOptions = [
  {
    title: 'Point to Point',
    description: 'Select two points to measure the direct distance between them',
    value: MeasurementType.POINTTOPOINT
  },
  {
    title: 'Perpendicular',
    description: 'Distance between a point and a surface, perpendicular to the target',
    value: MeasurementType.PERPENDICULAR
  }
]
</script>
