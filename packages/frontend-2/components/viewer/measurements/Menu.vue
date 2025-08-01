<template>
  <div>
    <ViewerLayoutPanel v-if="showSettings" class="p-3 pb-2">
      <span class="flex flex-col gap-1.5">
        <label class="text-body-2xs" for="units">Units</label>
        <ViewerMeasurementsUnitSelect
          v-model="measurementOptions.units"
          mount-menu-on-body
          @update:model-value="onChangeMeasurementUnits"
        />
      </span>

      <span class="flex flex-col gap-1.5 pt-3">
        <FormRange
          v-model="measurementOptions.precision"
          name="precision"
          label="Precision"
          :min="1"
          :max="5"
          :step="1"
        />
      </span>

      <span class="flex items-center pt-2">
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
    </ViewerLayoutPanel>
    <ViewerLayoutPanel class="mt-1 p-1 pr-2">
      <div class="flex gap-2 justify-between items-center">
        <ViewerButtonGroup>
          <ViewerButtonGroupButton
            v-for="option in measurementTypeOptions"
            :key="option.value"
            v-tippy="getTooltipProps(option.title)"
            class="size-8"
            :is-active="measurementOptions.type === option.value"
            @click="updateMeasurementsType(option)"
          >
            <component :is="option.icon" class="size-5 flex-shrink-0" />
          </ViewerButtonGroupButton>
        </ViewerButtonGroup>

        <div class="flex gap-1.5">
          <FormButton
            v-if="hasActiveMeasurement"
            size="sm"
            color="outline"
            @click="clearMeasurements"
          >
            Delete all
          </FormButton>
          <button
            class="size-6 flex items-center justify-center rounded-md"
            :class="[
              showSettings &&
                'text-primary-focus bg-info-lighter dark:text-foreground-on-primary',
              !showSettings && 'text-foreground hover:bg-foundation-2'
            ]"
            @click="showSettings = !showSettings"
          >
            <IconViewerSettings class="size-4" />
          </button>
        </div>
      </div>
    </ViewerLayoutPanel>
  </div>
</template>

<script setup lang="ts">
import { MeasurementType } from '@speckle/viewer'
import { useMeasurementUtilities } from '~~/lib/viewer/composables/ui'

interface MeasurementTypeOption {
  title: string
  value: MeasurementType
}

const {
  measurementOptions,
  setMeasurementOptions,
  clearMeasurements,
  getActiveMeasurement
} = useMeasurementUtilities()
const { getTooltipProps } = useSmartTooltipDelay()

const showSettings = ref(false)

const hasActiveMeasurement = computed(() => getActiveMeasurement() !== null)

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
