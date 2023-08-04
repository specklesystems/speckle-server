<template>
  <FormSelectBase v-model="selectedValue" :items="roles" :label="'Role'" :name="'role'">
    <template #something-selected="{ value }">
      <span class="truncate">{{ value }}</span>
    </template>

    <template #option="{ item }">
      <span class="truncate">{{ item }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const emitUpdate = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const selectedValue = ref('')
const roles = ['User', 'Admin', 'Archived']

watch(selectedValue, (newVal, oldVal) => {
  // Trigger warnings or other side effects here
  console.warn(`Role changed from ${oldVal} to ${newVal}`)

  // Emit update event to parent component
  emitUpdate('update:modelValue', newVal)
})
</script>
