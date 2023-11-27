<template>
  <FormSelectBase
    v-model="selectedUnit"
    :items="units"
    label="Unit"
    :show-label="false"
    :name="name || 'units'"
    :allow-unset="false"
  >
    <template #something-selected>
      <div>{{ fullUnitName }}</div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col">
        <div class="label text-xs">{{ UnitDisplayNames[item] || item }}</div>
      </div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps<{
  modelValue: string
  name?: string
}>()

const UnitDisplayNames: Record<string, string> = {
  mm: 'Millimeters',
  cm: 'Centimeters',
  m: 'Meters',
  km: 'Kilometers',
  in: 'Inches',
  ft: 'Feet',
  yd: 'Yards',
  mi: 'Miles'
}

function getFullUnitName(unit: string): string {
  return UnitDisplayNames[unit] || unit
}

const fullUnitName = computed(() => getFullUnitName(props.modelValue))

const units = ref(['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'])

const selectedUnit = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})
</script>
