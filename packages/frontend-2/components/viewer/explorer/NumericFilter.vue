<template>
  <div class="px-3 flex flex-col space-y-2 pb-2">
    <div class="flex w-full space-x-1">
      <div class="text-xs">Range:</div>
      <div class="text-xs truncate">[{{ props.filter.min.toFixed(2) }},</div>
      <div class="text-xs truncate">{{ props.filter.max.toFixed(2) }}]</div>
    </div>
    <div class="flex flex-col space-y-2">
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col gap-2">
          <label class="text-xs text-foreground-2 mr-2" for="min">Min</label>
          <div class="flex gap-2 items-center">
            <input
              id="min"
              v-model="passMin"
              class="h-2 mr-2"
              type="range"
              name="min"
              :min="props.filter.min"
              :max="props.filter.max"
              step="0.0001"
              @change="setFilterPass()"
            />
            <div class="text-xs text-foreground-2 truncate min-w-0">
              {{ roundedValues.min }}
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between w-full">
        <div class="flex flex-col gap-2">
          <label class="text-xs text-foreground-2 mr-2" for="max">Max</label>
          <div class="flex gap-2 items-center">
            <input
              id="max"
              v-model="passMax"
              class="h-2 mr-2"
              type="range"
              name="max"
              :min="props.filter.min"
              :max="props.filter.max"
              step="0.0001"
              @change="setFilterPass()"
            />
            <div class="text-xs text-foreground-2 truncate min-w-0 max-w-12">
              {{ roundedValues.max }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { NumericPropertyInfo } from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'

const { setPropertyFilter } = useFilterUtilities()

const props = defineProps<{
  filter: NumericPropertyInfo
}>()

const passMin = ref(props.filter.passMin || props.filter.min)
const passMax = ref(props.filter.passMax || props.filter.max)

const roundedValues = computed(() => {
  return {
    min: Number(passMin.value).toFixed(2),
    max: Number(passMax.value).toFixed(2)
  }
})

const setFilterPass = () => {
  const propInfo = { ...props.filter }
  const min = Math.min(passMin.value, passMax.value)
  const max = Math.max(passMin.value, passMax.value)
  propInfo.passMin = min
  propInfo.passMax = max
  setPropertyFilter(propInfo)
}
</script>
