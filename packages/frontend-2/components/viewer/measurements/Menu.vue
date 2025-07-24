<template>
  <div>
    <ViewerLayoutPanel v-if="showSettings" class="p-3 pt-2">
      <div class="flex justify-between items-center">
        <h6 class="text-body-2xs font-medium">Settings</h6>
        <FormButton
          size="sm"
          color="subtle"
          :icon-left="XMarkIcon"
          hide-text
          @click="showSettings = false"
        />
      </div>

      <span class="flex flex-col gap-1.5 pt-2">
        <label class="text-body-2xs" for="units">Units</label>
        <ViewerMeasurementsUnitSelect
          v-model="measurementOptions.units"
          mount-menu-on-body
          class="w-1/2"
          @update:model-value="onChangeMeasurementUnits"
        />
      </span>

      <span class="flex items-center pt-3">
        <FormCheckbox
          name="Chain Measurements"
          hide-label
          :model-value="measurementOptions.chain"
          @update:model-value="toggleMeasurementsChaining"
        />
        <label class="text-body-2xs" for="chain">Chain Measurements</label>
      </span>

      <span class="flex items-center pt-1">
        <FormCheckbox
          name="Snap to vertices"
          hide-label
          :model-value="measurementOptions.vertexSnap"
          @update:model-value="toggleMeasurementsSnap"
        />
        <label class="text-body-2xs" for="snap">Snap to vertices</label>
      </span>

      <span class="flex flex-col gap-1.5 pt-3">
        <label class="text-body-2xs" for="precision">Precision</label>
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
      </span>
    </ViewerLayoutPanel>
    <ViewerLayoutPanel class="mt-2 p-1 pr-2">
      <div class="flex gap-2 justify-between items-center">
        <div
          class="flex gap-1 rounded-lg p-0.5 bg-highlight-1 border border-outline-2 self-start"
        >
          <button
            v-for="option in measurementTypeOptions"
            :key="option.value"
            v-tippy="option.title"
            class="size-8 flex items-center justify-center rounded-lg border"
            :class="[
              measurementOptions.type === option.value &&
                'border-outline-2 bg-foundation text-foreground',
              measurementOptions.type !== option.value &&
                'border-transparent hover:bg-foundation-2 text-foreground-2'
            ]"
            @click="updateMeasurementsType(option)"
          >
            <component :is="option.icon" class="size-5 flex-shrink-0" />
          </button>
        </div>

        <div class="flex gap-1.5">
          <FormButton size="sm" color="outline" @click="clearMeasurements">
            Delete all
          </FormButton>
          <FormButton
            size="sm"
            color="subtle"
            :icon-left="Cog8ToothIcon"
            hide-text
            @click="showSettings = !showSettings"
          />
        </div>
      </div>
    </ViewerLayoutPanel>
  </div>
</template>

<script setup lang="ts">
import { MeasurementType } from '@speckle/viewer'
import { useMeasurementUtilities } from '~~/lib/viewer/composables/ui'
import { Cog8ToothIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface MeasurementTypeOption {
  title: string
  value: MeasurementType
}

const { measurementOptions, setMeasurementOptions, clearMeasurements } =
  useMeasurementUtilities()

const showSettings = ref(false)

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

const measurementTypeOptions = [
  {
    title: 'Point to Point',
    icon: 'IconMeasurePointToPoint',
    value: MeasurementType.POINTTOPOINT,
    description: 'Measure between two points'
  },
  {
    title: 'Perpendicular',
    icon: 'IconMeasurePerpendicular',
    value: MeasurementType.PERPENDICULAR,
    description: 'Measure at a 90° angle'
  },
  {
    title: 'Area',
    icon: 'IconMeasureArea',
    value: MeasurementType.AREA,
    description: 'Measure area between points'
  },
  {
    title: 'Point coordinates',
    icon: 'IconMeasurePoint',
    value: MeasurementType.POINT,
    description: 'Measure XYZ coordinates'
  }
]
</script>
