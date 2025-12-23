<template>
  <div class="flex gap-x-0.5">
    <!-- Color picker -->
    <button
      v-tippy="'Pick color'"
      class="w-8 h-8 flex items-center justify-center cursor-pointer rounded hover:bg-foundation-2"
      @click="handleColorClick"
    >
      <div
        class="w-6 h-6 rounded-full border border-outline-5 hover:border-primary"
        :style="{ backgroundColor: currentColor }"
      />
    </button>

    <!-- Hidden color input -->
    <input
      ref="colorInputRef"
      v-model="colorValue"
      type="color"
      class="hidden"
      @change="emit('colorChange', colorValue)"
    />

    <!-- Thickness -->
    <FormButton
      v-tippy="'Thickness'"
      color="subtle"
      :active="showThickness"
      class="w-8 h-6 !p-1"
      @click="emit('update:showThickness', !showThickness)"
    >
      <div
        class="bg-foreground w-6"
        :style="{
          height: brushSize + 'px'
        }"
      />
    </FormButton>

    <!-- Line types -->
    <FormButton
      v-tippy="'Line type'"
      color="subtle"
      :active="showLineType"
      @click="emit('update:showLineType', !showLineType)"
      :icon-left="lineTypeIcon"
      hide-text
    />
  </div>
</template>

<script setup lang="ts">
import { Minus, Ellipsis, GripHorizontal } from 'lucide-vue-next'

const props = defineProps<{
  currentColor: string
  brushSize: number
  showThickness: boolean
  showLineType: boolean
  selectedLineType: 'straight' | 'dashed' | 'dashedAndDotted'
}>()

const emit = defineEmits<{
  'update:showThickness': [value: boolean]
  'update:showLineType': [value: boolean]
  colorChange: [value: string]
}>()

const colorInputRef = ref<HTMLInputElement | null>(null)
const colorValue = ref(props.currentColor)

const lineTypeIcon = computed(() => {
  switch (props.selectedLineType) {
    case 'dashed':
      return GripHorizontal
    case 'dashedAndDotted':
      return Ellipsis
    default:
      return Minus
  }
})

const handleColorClick = () => {
  emit('update:showThickness', false)
  emit('update:showLineType', false)
  // Programmatically click the hidden color input to open the native color picker
  nextTick(() => {
    colorInputRef.value?.click()
  })
}

watch(
  () => props.currentColor,
  (newColor) => {
    colorValue.value = newColor
  }
)
</script>
