<template>
  <div class="flex gap-0.5">
    <FormButton
      v-tippy="'Text'"
      :color="currentTool === 'text' ? 'primary' : 'subtle'"
      :icon-left="Type"
      hide-text
      @click="emit('toolChange', 'text')"
    />
    <FormButton
      v-tippy="'Arrow'"
      :color="currentTool === 'arrow' ? 'primary' : 'subtle'"
      :icon-left="ArrowUpFromDot"
      hide-text
      @click="emit('toolChange', 'arrow')"
    />
    <FormButton
      v-tippy="'Polyline'"
      :color="currentTool === 'polyline' ? 'primary' : 'subtle'"
      hide-text
      :icon-left="TriangleDashed"
      @click="emit('toolChange', 'polyline')"
    />
    <FormButton
      v-tippy="'Freehand'"
      :color="currentTool === 'freehand' ? 'primary' : 'subtle'"
      :icon-left="LineSquiggle"
      hide-text
      @click="emit('toolChange', 'freehand')"
    />
    <FormButton
      v-tippy="'Select'"
      :color="currentTool === 'select' ? 'primary' : 'subtle'"
      :icon-left="MousePointerClick"
      hide-text
      @click="emit('toolChange', 'select')"
    />
    <FormButton
      v-tippy="'Clear all'"
      color="subtle"
      :icon-left="Trash"
      hide-text
      @click="emit('clearAll')"
    />
  </div>
</template>

<script setup lang="ts">
import {
  TriangleDashed,
  Trash,
  MousePointerClick,
  LineSquiggle,
  ArrowUpFromDot,
  Type
} from 'lucide-vue-next'

defineProps<{
  currentTool: string
}>()

const emit = defineEmits<{
  toolChange: [tool: string]
  clearAll: []
}>()
</script>
