<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden h-10 p-[3px]"
    :class="{ hidden: hideUi }"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="disablePrevious"
      @click="onPrevious"
    />
    <PresentationControlsButton
      :icon="LucideRotateCcw"
      :disabled="!hasViewChanged"
      tooltip="Reset view"
      @click="resetView"
    />
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
import { useResetViewUtils } from '~/lib/presentations/composables/utils'

defineProps<{
  hideUi?: boolean
}>()

const {
  ui: { slideIdx: currentVisibleIndex, slideCount },
  viewer: { hasViewChanged }
} = useInjectedPresentationState()
const { resetView } = useResetViewUtils()

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
    // Don't handle arrow keys if an input element is focused
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return

    const targetKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

    if (targetKeys.includes(event.key)) {
      if (disablePrevious.value) return
      onPrevious()
    }
    if (event.key === 'ArrowLeft') {
      if (disablePrevious.value) return
      onPrevious()
    }

    if (event.key === 'ArrowRight') {
      if (disableNext.value) return
      onNext()
    }
  },
  { capture: true }
)
</script>
