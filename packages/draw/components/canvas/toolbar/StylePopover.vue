<template>
  <div
    v-if="showThickness || showLineType"
    ref="popoverRef"
    class="bg-foundation border border-outline-2 rounded-lg px-3 py-2"
  >
    <!-- Thickness slider -->
    <div v-if="showThickness" class="flex flex-col gap-1">
      <div class="text-body-2xs text-foreground-2 font-medium">Thickness</div>
      <input
        v-model.number="brushSize"
        type="range"
        min="1"
        max="20"
        step="1"
        class="w-full"
      />
    </div>

    <!-- Line type selector -->
    <div v-if="showLineType" class="flex flex-col gap-1">
      <div class="text-body-2xs text-foreground-2 font-medium">Line type</div>
      <div class="flex flex-col gap-1">
        <button
          class="w-full text-left text-body-xs px-2 py-1.5 rounded hover:bg-highlight-1"
          :class="selectedLineType === 'straight' ? 'bg-highlight-1' : ''"
          @click="selectLineType('straight')"
        >
          Straight
        </button>
        <button
          class="w-full text-left text-body-xs px-2 py-1.5 rounded hover:bg-highlight-1"
          :class="selectedLineType === 'dashed' ? 'bg-highlight-1' : ''"
          @click="selectLineType('dashed')"
        >
          Dashed
        </button>
        <button
          class="w-full text-left text-body-xs px-2 py-1.5 rounded hover:bg-highlight-1"
          :class="selectedLineType === 'dashedAndDotted' ? 'bg-highlight-1' : ''"
          @click="selectLineType('dashedAndDotted')"
        >
          Dashed and dotted
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  showThickness: boolean
  showLineType: boolean
  brushSize: number
  selectedLineType: 'straight' | 'dashed' | 'dashedAndDotted'
}>()

const emit = defineEmits<{
  'update:brushSize': [value: number]
  'update:showThickness': [value: boolean]
  'update:showLineType': [value: boolean]
  'update:selectedLineType': [value: 'straight' | 'dashed' | 'dashedAndDotted']
}>()

const popoverRef = ref<HTMLElement | null>(null)

const brushSize = computed({
  get: () => props.brushSize,
  set: (value) => emit('update:brushSize', value)
})

const selectedLineType = computed({
  get: () => props.selectedLineType,
  set: (value) => emit('update:selectedLineType', value)
})

const selectLineType = (lineType: 'straight' | 'dashed' | 'dashedAndDotted') => {
  selectedLineType.value = lineType
  // Close the popover after selection
  emit('update:showLineType', false)
}

// Close popover when clicking outside
onClickOutside(popoverRef, () => {
  emit('update:showThickness', false)
  emit('update:showLineType', false)
})
</script>
