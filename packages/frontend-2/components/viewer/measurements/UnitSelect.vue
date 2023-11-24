<template>
  <FormSelectBase
    v-model="selectedUnit"
    :items="units"
    label="Unit"
    :show-label="false"
    :name="name || 'units'"
    :allow-unset="false"
  >
    <template #something-selected="{ value }">
      <div>{{ value }}</div>
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

const units = ref(['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'])

const selectedUnit = computed({
  get: () => props.modelValue,
  set: (newVal) => emit('update:modelValue', newVal)
})
</script>
