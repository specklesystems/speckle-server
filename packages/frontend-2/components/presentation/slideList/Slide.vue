<template>
  <li class="w-full" :class="{ 'pb-0': hideTitle }">
    <button
      class="bg-foundation-page rounded-md overflow-hidden border border-outline-3 transition-all duration-200 hover:!border-outline-4 w-full"
      :class="[isCurrentSlide ? '!border-outline-5' : '']"
      @click="onSelectSlide"
    >
      <img
        :src="slide.screenshot"
        :alt="slide.name"
        class="w-full aspect-[3/2] md:aspect-video object-cover"
      />
    </button>
    <div v-if="!hideTitle" class="flex flex-row gap-x-1 pt-0.5 pb-1">
      <p class="text-body-3xs font-semibold text-foreground my-1">{{ slideIndex }}.</p>
      <p class="text-body-3xs font-medium text-foreground my-1">
        {{ slide.name }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlideListSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

graphql(`
  fragment PresentationSlideListSlide_SavedView on SavedView {
    id
    name
    screenshot
  }
`)

const props = defineProps<{
  slide: PresentationSlideListSlide_SavedViewFragment
  slideIndex: number
  hideTitle?: boolean
}>()

const {
  ui: { slideIdx: currentSlideIdx, slide: currentSlide },
  viewer: { resetView }
} = useInjectedPresentationState()

const isCurrentSlide = computed(() => currentSlide.value?.id === props.slide.id)

const onSelectSlide = () => {
  const wasCurrentSlide = isCurrentSlide.value
  currentSlideIdx.value = props.slideIndex - 1

  if (wasCurrentSlide) {
    resetView()
  }
}
</script>
