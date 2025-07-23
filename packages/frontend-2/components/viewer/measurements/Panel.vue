<template>
  <ViewerLayoutPanel @close="$emit('close')">
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
          :checked="measurementOptions.type === option.value"
          size="sm"
          @change="updateMeasurementsType(option)"
        />
      </div>
    </div>
    <div class="py-1.5 px-3 flex items-center border-b border-outline-2">
      <FormCheckbox
        name="Snap to vertices"
        hide-label
        :model-value="measurementOptions.vertexSnap"
        @update:model-value="toggleMeasurementsSnap"
      />
      <span class="text-body-2xs font-medium">Snap to vertices</span>
    </div>
    <div class="py-1.5 px-3 flex items-center border-b border-outline-2">
      <FormCheckbox
        name="Chain Measurements"
        hide-label
        :model-value="measurementOptions.chain"
        @update:model-value="toggleMeasurementsChaining"
      />
      <span class="text-body-2xs font-medium">Chain Measurements</span>
    </div>
    <div class="pb-3 flex flex-col">
      <div class="flex flex-col gap-1.5 p-3 pt-2 pb-3">
        <h6 class="text-body-2xs font-medium">Units</h6>
        <ViewerMeasurementsUnitSelect
          v-model="measurementOptions.units"
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
            v-model="measurementOptions.precision"
            class="h-2 mr-2 flex-1"
            type="range"
            min="1"
            max="5"
            step="1"
            @change="(e: Event) => onChangeMeasurementPrecision((e.target as HTMLInputElement).value)"
          />
          <span class="text-xs w-4">{{ measurementOptions.precision }}</span>
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

const { measurementOptions, setMeasurementOptions, clearMeasurements } =
  useMeasurementUtilities()

const updateMeasurementsType = (selectedOption: MeasurementTypeOption) => {
  setMeasurementOptions({
    ...measurementOptions.value,
    type: selectedOption.value
  })
}

const onChangeMeasurementUnits = (newUnit: string) => {
  setMeasurementOptions({
    ...measurementOptions.value,
    units: newUnit
  })
}

const toggleMeasurementsChaining = () => {
  setMeasurementOptions({
    ...measurementOptions.value,
    chain: !measurementOptions.value.chain
  })
}

const toggleMeasurementsSnap = () => {
  setMeasurementOptions({
    ...measurementOptions.value,
    vertexSnap: !measurementOptions.value.vertexSnap
  })
}

const onChangeMeasurementPrecision = (newPrecision?: string) => {
  if (!newPrecision) return
  setMeasurementOptions({
    ...measurementOptions.value,
    precision: Number(newPrecision)
  })
}

const IconMeasurePointToPoint = resolveComponent(
  'IconMeasurePointToPoint'
) as ConcreteComponent
const IconMeasurePerpendicular = resolveComponent(
  'IconMeasurePerpendicular'
) as ConcreteComponent
const IconMeasurePoint = resolveComponent('IconMeasurePoint') as ConcreteComponent
const IconMeasureArea = resolveComponent('IconMeasureArea') as ConcreteComponent

const measurementTypeOptions = [
  {
    title: 'Point to Point',
    icon: IconMeasurePointToPoint,
    value: MeasurementType.POINTTOPOINT,
    description: 'Measure between two points'
  },
  {
    title: 'Perpendicular',
    icon: IconMeasurePerpendicular,
    value: MeasurementType.PERPENDICULAR,
    description: 'Measure at a 90° angle'
  },
  {
    title: 'Area',
    icon: IconMeasureArea,
    value: MeasurementType.AREA,
    description: 'Measure area between points'
  },
  {
    title: 'Point coordinates',
    icon: IconMeasurePoint,
    value: MeasurementType.POINT,
    description: 'Measure XYZ coordinates'
  }
]
</script>
