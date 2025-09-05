<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden divide-x divide-outline-3"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="disablePrevious"
      @click="emit('onPrevious')"
    />
    <PresentationControlsButton
      :icon="LucideChevronRight"
      :disabled="disableNext"
      @click="emit('onNext')"
    />
  </div>
</template>

<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'onPrevious'): void
  (e: 'onNext'): void
}>()

defineProps<{
  disablePrevious: boolean
  disableNext: boolean
}>()
</script>
