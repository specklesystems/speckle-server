<template>
  <FormSelectBase
    v-model="selectedUnit"
    :items="units"
    label="Units"
    :show-label="false"
    :name="name || 'units'"
    :allow-unset="false"
    class="scale-75 -ml-7 -mr-6"
  >
    <template #something-selected="{ value }">
      <div class="font-bold">{{ value }}</div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col">
        <div class="label text-xs">{{ item }}</div>
      </div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps<{
  modelValue: string
  name?: string
}>()

const units = ref([
  'Millimeters',
  'Centimeters',
  'Meters',
  'Kilometers',
  'Inches',
  'Feet',
  'Yards',
  'Miles'
])

const selectedUnit = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})
</script>
