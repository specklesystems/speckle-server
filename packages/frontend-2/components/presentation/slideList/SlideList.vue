<template>
  <ul ref="slideListRef" class="flex flex-col gap-1 w-full">
    <PresentationSlideListSlide
      v-for="(slide, index) in visibleSlides"
      :key="slide.id"
      :slide="slide"
      :slide-index="index + 1"
      :hide-title="hideTitle"
    />
  </ul>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { useThrottleFn } from '@vueuse/core'

graphql(`
  fragment PresentationSlideList_SavedViewGroup on SavedViewGroup {
    id
    views(input: $input) {
      items {
        id
        ...PresentationSlideListSlide_SavedView
      }
    }
  }
`)

defineProps<{
  hideTitle?: boolean
}>()

const {
  response: { visibleSlides },
  ui: { slideIdx }
} = useInjectedPresentationState()

const slideListRef = ref<HTMLUListElement>()

const containerRef = computed(() => slideListRef.value?.parentElement)

const scrollToActiveSlide = () => {
  if (!slideListRef.value || !containerRef.value) return

  const activeSlideElement = slideListRef.value.children[slideIdx.value] as HTMLElement
  if (!activeSlideElement) return

  const containerHeight = containerRef.value.clientHeight
  const slideElementHeight = activeSlideElement.offsetHeight
  const slideElementTop = activeSlideElement.offsetTop

  const scrollTop = slideElementTop - containerHeight / 2 + slideElementHeight / 2

  containerRef.value.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  })
}

const throttledScrollToActiveSlide = useThrottleFn(scrollToActiveSlide, 100)

watch(
  slideIdx,
  () => {
    throttledScrollToActiveSlide()
  },
  { immediate: true }
)
</script>
