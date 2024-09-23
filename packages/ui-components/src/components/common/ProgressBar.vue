<template>
  <div class="relative w-full bg-outline-3 rounded h-1.5 overflow-hidden">
    <div
      class="aboslute left-0 top-0 rounded h-1.5"
      :class="colorClass"
      :style="{ width: `${percentage <= 100 ? percentage : 100}%` }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  currentValue: number
  maxValue: number
}>()

const percentage = computed(() => (props.currentValue / props.maxValue) * 100)
const colorClass = computed(() => {
  if (percentage.value >= 100) {
    return 'bg-danger'
  }
  if (percentage.value >= 80) {
    return 'bg-warning'
  }

  return 'bg-success'
})
</script>
