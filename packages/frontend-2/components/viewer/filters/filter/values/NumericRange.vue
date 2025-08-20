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
    <div class="flex gap-2 text-body-3xs items-center">
      <span class="text-foreground-2">Range:</span>
      <span>{{ currentMin }} - {{ currentMax }}</span>
      <div v-if="hasColors" class="flex items-center gap-1 ml-2">
        <div
          class="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-red-500 border border-outline-3"
        />
        <span class="text-foreground-3 text-body-3xs">Colored by value</span>
      </div>
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
  hasColors: boolean
}>()

defineEmits<{
  rangeChange: [event: Event]
}>()
</script>
