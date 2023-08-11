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
import { Roles } from '@speckle/shared/src/core/constants'

const emitUpdate = defineEmits<{
  (e: 'update:modelValue', newV: string, oldV: string): void
}>()

const selectedValue = ref('')

const roles = Object.values(Roles.Server).concat(Object.values(Roles.Stream))

watch(selectedValue, (newVal, oldVal) => {
  // Emit update event to parent component
  emitUpdate('update:modelValue', newVal, oldVal)
})
</script>
