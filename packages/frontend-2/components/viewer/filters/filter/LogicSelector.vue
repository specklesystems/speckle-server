<template>
  <div class="px-3 pt-3">
    <div class="space-y-1">
      <div class="text-body-2xs font-medium text-foreground-2">Filter Logic</div>
      <div class="flex gap-1 p-1 bg-foundation-2 rounded-md w-fit">
        <button
          v-for="option in filterLogicOptions"
          :key="option.value"
          class="px-2 py-1 text-body-2xs rounded transition-colors"
          :class="[
            modelValue === option.value
              ? 'bg-foundation text-foreground font-medium shadow-sm'
              : 'text-foreground-2 hover:text-foreground hover:bg-foundation/50'
          ]"
          @click="$emit('update:modelValue', option)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FilterLogic } from '~/lib/viewer/helpers/filters/types'

defineProps<{
  modelValue: FilterLogic
}>()

defineEmits(['update:modelValue'])

const filterLogicOptions = ref([
  { value: FilterLogic.All, label: 'Match all rules' },
  { value: FilterLogic.Any, label: 'Match any rule' }
])
</script>
