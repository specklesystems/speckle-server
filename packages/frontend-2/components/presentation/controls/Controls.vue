<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden divide-x divide-outline-3"
    :class="{ hidden: hideUi }"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="disablePrevious"
      @click="onPrevious"
    />
    <PresentationControlsButton :icon="LucideRotateCcw" @click="resetView" />
    <PresentationControlsButton
      :icon="LucideChevronRight"
      :disabled="disableNext"
      @click="onNext"
    />
  </div>
</template>

<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight, LucideRotateCcw } from 'lucide-vue-next'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { clamp } from 'lodash-es'
import { useEventListener } from '@vueuse/core'

defineProps<{
  hideUi?: boolean
}>()

const {
  ui: { slideIdx: currentVisibleIndex, slideCount },
  viewer: { resetView }
} = useInjectedPresentationState()

const disablePrevious = computed(() => currentVisibleIndex.value === 0)
const disableNext = computed(() =>
  slideCount.value ? currentVisibleIndex.value === slideCount.value - 1 : false
)
const onPrevious = () => {
  currentVisibleIndex.value = clamp(currentVisibleIndex.value - 1, 0, slideCount.value)
}
const onNext = () => {
  currentVisibleIndex.value = clamp(currentVisibleIndex.value + 1, 0, slideCount.value)
}

// Prevent viewer from moving when using arrow keys
useEventListener(
  'keydown',
  (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (disablePrevious.value) return
      onPrevious()
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      if (disableNext.value) return
      onNext()
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
  },
  { capture: true }
)
</script>
