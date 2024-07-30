<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>Measure mode</template>
    <div
      class="flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 border-b border-outline-3 text-foreground-2"
    >
      <InformationCircleIcon class="h-5 w-5 sm:h-6 sm:h-6 shrink-0" />
      <span class="text-body-2xs">Reloading will delete all measurements</span>
    </div>
    <template #actions>
      <FormButton
        text
        color="danger"
        :icon-left="TrashIcon"
        class="py-1"
        @click="() => clearMeasurements()"
      >
        Delete all measurements
      </FormButton>
    </template>
    <div class="px-3 py-2 sm:p-3 flex flex-col gap-3 border-b border-outline-3">
      <div>
        <h6 class="text-heading-sm mb-2">Measurement type</h6>
        <FormRadio
          v-for="option in measurementTypeOptions"
          :key="option.value"
          :label="option.title"
          :description="option.description"
          :value="option.value.toString()"
          name="measurementType"
          :icon="option.icon"
          :checked="measurementParams.type === option.value"
          @change="updateMeasurementsType(option)"
        />
      </div>
    </div>
    <div class="py-2 px-3 sm:p-3 flex items-center border-b border-outline-3">
      <FormCheckbox
        name="Snap to Objects"
        hide-label
        :model-value="measurementParams.vertexSnap"
        @update:model-value="() => toggleMeasurementsSnap()"
      />
      <span class="text-heading-sm">Snap to vertices</span>
    </div>
    <div class="p-3 flex flex-col gap-3">
      <div class="flex flex-col gap-2">
        <h6 class="font-medium text-xs sm:text-sm">Units</h6>
        <ViewerMeasurementsUnitSelect
          v-model="selectedUnit"
          mount-menu-on-body
          @update:model-value="onChangeMeasurementUnits"
        />
      </div>
      <div class="flex flex-col gap-2 sm:gap-3">
        <label class="text-heading-sm" for="precision">Precision</label>
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
import { InformationCircleIcon, TrashIcon } from '@heroicons/vue/24/outline'
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
    description: 'Choose two points for precise measurements'
  },
  {
    title: 'Perpendicular',
    icon: IconPerpendicular,
    value: MeasurementType.PERPENDICULAR,
    description: 'Tip: Double-click to quick-measure'
  }
]
</script>
