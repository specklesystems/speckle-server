<template>
  <div class="relative w-full bg-outline-3 rounded h-1.5">
    <div
      class="aboslute left-0 top-0 bg-success rounded h-1.5"
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
</script>
