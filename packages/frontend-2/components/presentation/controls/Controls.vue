<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden divide-x divide-outline-3"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="isFirstSlide"
      @click="goToPrevious"
    />
    <PresentationControlsButton
      :icon="LucideChevronRight"
      :disabled="isLastSlide"
      @click="goToNext"
    />
  </div>
</template>

<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from 'lucide-vue-next'
import {
  usePresentationState,
  usePresentationActions
} from '~/lib/presentations/composables/setup'

const { isFirstSlide, isLastSlide } = usePresentationState()
const { goToPrevious, goToNext } = usePresentationActions()
</script>
