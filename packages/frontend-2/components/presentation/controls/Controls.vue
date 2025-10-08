<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden h-10 p-[3px]"
    :class="{ hidden: hideUi }"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="disablePrevious"
      tooltip="Previous slide"
      @click="onPrevious"
    />
    <PresentationControlsButton
      :icon="LucideRotateCcw"
      :disabled="!hasViewChanged"
      tooltip="Reset slide"
      @click="resetView"
    />
    <PresentationControlsButton
      :icon="LucideChevronRight"
      :disabled="disableNext"
      tooltip="Next slide"
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

const route = useRoute()
const {
  ui: { slideIdx: currentVisibleIndex, slideCount },
  viewer: { hasViewChanged }
} = useInjectedPresentationState()
const { resetView } = useResetViewUtils()

const isLoopEnabled = computed(() => route.query.loop === 'true')

const disablePrevious = computed(() => {
  if (isLoopEnabled.value) return false
  return currentVisibleIndex.value === 0
})

const disableNext = computed(() => {
  if (isLoopEnabled.value) return false
  return slideCount.value ? currentVisibleIndex.value === slideCount.value - 1 : false
})

const onPrevious = () => {
  if (isLoopEnabled.value && currentVisibleIndex.value === 0) {
    currentVisibleIndex.value = slideCount.value - 1
  } else {
    currentVisibleIndex.value = clamp(
      currentVisibleIndex.value - 1,
      0,
      slideCount.value
    )
  }
}

const onNext = () => {
  if (isLoopEnabled.value && currentVisibleIndex.value === slideCount.value - 1) {
    currentVisibleIndex.value = 0
  } else {
    currentVisibleIndex.value = clamp(
      currentVisibleIndex.value + 1,
      0,
      slideCount.value
    )
  }
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

    // Don't handle arrow keys if a dialog is open
    if (document.querySelector('[role="dialog"]')) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return
    }

    const targetKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

    if (targetKeys.includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      // Remove focus from any currently focused element to prevent blue outline
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
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
