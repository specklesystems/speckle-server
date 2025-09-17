<template>
  <div
    class="flex items-center rounded-xl bg-foundation border border-outline-3 shadow-md overflow-hidden divide-x divide-outline-3"
  >
    <PresentationControlsButton
      :icon="LucideChevronLeft"
      :disabled="disablePrevious"
      @click="onPrevious"
    />
    <PresentationControlsButton
      :icon="LucideChevronRight"
      :disabled="disableNext"
      @click="onNext"
    />
  </div>
</template>

<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from 'lucide-vue-next'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { clamp } from 'lodash-es'

const {
  ui: { slideIdx: currentVisibleIndex, slideCount }
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

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft' && !disablePrevious.value) {
    event.stopPropagation()
    onPrevious()
  }
  if (event.key === 'ArrowRight' && !disableNext.value) {
    event.stopPropagation()
    onNext()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
