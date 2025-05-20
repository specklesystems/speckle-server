<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>Measure mode</template>
    <div
      class="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 border-b border-outline-2 text-foreground-2"
    >
      <span class="text-body-3xs">Reloading will delete all measurements</span>
    </div>
    <template #actions>
      <FormButton class="my-1" size="sm" color="outline" @click="clearMeasurements">
        Delete all measurements
      </FormButton>
    </template>
    <div class="p-2 px-3 flex flex-col gap-2 border-b border-outline-2">
      <div>
        <h6 class="text-body-2xs font-medium mb-2.5">Measurement type</h6>
        <FormRadio
          v-for="option in measurementTypeOptions"
          :key="option.value"
          :label="option.title"
          :description="option.description"
          :value="option.value.toString()"
          name="measurementType"
          :icon="option.icon"
          :checked="measurementParams.type === option.value"
          size="sm"
          @change="updateMeasurementsType(option)"
        />
      </div>
    </div>
    <div class="py-1.5 px-3 flex items-center border-b border-outline-2">
      <FormCheckbox
        name="Snap to vertices"
        hide-label
        :model-value="measurementParams.vertexSnap"
        @update:model-value="() => toggleMeasurementsSnap()"
      />
      <span class="text-body-2xs font-medium">Snap to vertices</span>
    </div>
    <div class="pb-3 flex flex-col">
      <div class="flex flex-col gap-1.5 p-3 pt-2 pb-3">
        <h6 class="text-body-2xs font-medium">Units</h6>
        <ViewerMeasurementsUnitSelect
          v-model="selectedUnit"
          mount-menu-on-body
          class="w-1/2"
          @update:model-value="onChangeMeasurementUnits"
        />
      </div>
      <div class="flex flex-col gap-1.5 px-3 pt-2 border-t border-outline-2">
        <label class="text-body-2xs font-medium" for="precision">Precision</label>
        <div class="flex gap-2 items-center">
          <input
            id="precision"
            v-model="measurementPrecision"
            class="h-2 mr-2 flex-1"
            type="range"
            min="1"
            max="5"
            step="1"
            :onchange="onChangeMeasurementPrecision"
          />
          <span class="text-xs w-4">{{ measurementPrecision }}</span>
        </div>
      </div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { FormRadio } from '@speckle/ui-components'
import { MeasurementType } from '@speckle/viewer'
import { useMeasurementUtilities } from '~~/lib/viewer/composables/ui'
import { resolveComponent } from 'vue'
import type { ConcreteComponent } from 'vue'

interface MeasurementTypeOption {
  title: string
  value: MeasurementType
}

defineEmits(['close'])

const measurementPrecision = ref(2)
const selectedUnit = ref('m')

const measurementParams = ref({
  visible: true,
  type: MeasurementType.POINTTOPOINT,
  vertexSnap: true,
  units: selectedUnit.value,
  precision: measurementPrecision.value
})

const { setMeasurementOptions, clearMeasurements } = useMeasurementUtilities()

const updateMeasurementsType = (selectedOption: MeasurementTypeOption) => {
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

const onChangeMeasurementPrecision = () => {
  measurementParams.value.precision = measurementPrecision.value
  setMeasurementOptions(measurementParams.value)
}

const IconPointToPoint = resolveComponent(
  'IconMeasurePointToPoint'
) as ConcreteComponent
const IconPerpendicular = resolveComponent(
  'IconMeasurePerpendicular'
) as ConcreteComponent

const measurementTypeOptions = [
  {
    title: 'Point to Point',
    icon: IconPointToPoint,
    value: MeasurementType.POINTTOPOINT,
    description: 'Measure between two points'
  },
  {
    title: 'Perpendicular',
    icon: IconPerpendicular,
    value: MeasurementType.PERPENDICULAR,
    description: 'Tip: Double-click to quick-measure'
  }
]
</script>
