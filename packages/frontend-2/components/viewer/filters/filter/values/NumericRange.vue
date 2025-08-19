<template>
  <div class="space-y-2">
    <div class="flex justify-between text-body-3xs text-foreground-2">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
    <label :for="`range-${filterId}`" class="sr-only">
      Range slider for {{ propertyName }}
    </label>
    <input
      :id="`range-${filterId}`"
      type="range"
      :min="min"
      :max="max"
      :value="currentMin"
      class="w-full"
      @input="$emit('rangeChange', $event)"
    />
    <div class="flex gap-2 text-body-3xs">
      <span class="text-foreground-2">Range:</span>
      <span>{{ currentMin }} - {{ currentMax }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  filterId: string
  propertyName: string
  min: number
  max: number
  currentMin: number
  currentMax: number
}>()

defineEmits<{
  rangeChange: [event: Event]
}>()
</script>
