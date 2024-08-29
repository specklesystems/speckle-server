<template>
  <div class="relative w-full bg-foundation-2 rounded" :class="[heightClass]">
    <div
      class="aboslute left-0 top-0 bg-success rounded"
      :class="[heightClass]"
      :style="{ width: `${percentage <= 100 ? percentage : 100}%` }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

type ProgressBarSize = 'base'

const props = withDefaults(
  defineProps<{
    currentValue: number
    maxValue: number
    size: ProgressBarSize
  }>(),
  {
    size: 'base'
  }
)

const heightClass = computed(() => (props.size === 'base' ? 'h-1.5' : 'h-1'))
const percentage = computed(() => (props.currentValue / props.maxValue) * 100)
</script>
