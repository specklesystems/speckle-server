<template>
  <li class="w-full" :class="{ 'pb-0': hideTitle }">
    <button
      class="bg-foundation-page rounded-md overflow-hidden border border-outline-3 transition-all duration-200 hover:!border-outline-4 w-full"
      :class="[isCurrentSlide ? '!border-outline-5' : '']"
      @click="onSelectSlide"
    >
      <img
        :src="slide.thumbnailUrl"
        :alt="slide.name"
        class="w-full aspect-[3/2] md:aspect-video object-cover"
      />
    </button>

    <p v-if="!hideTitle" class="text-body-3xs font-medium text-foreground mt-1.5 mb-2">
      <span class="font-semibold mr-1">{{ slideIndex }}.</span>
      {{ slide.name }}
    </p>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlideListSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { useResetViewUtils } from '~/lib/presentations/composables/utils'

graphql(`
  fragment PresentationSlideListSlide_SavedView on SavedView {
    id
    name
    thumbnailUrl
  }
`)

const props = defineProps<{
  slide: PresentationSlideListSlide_SavedViewFragment
  slideIndex: number
  hideTitle?: boolean
}>()

const {
  ui: { slideIdx: currentSlideIdx, slide: currentSlide }
} = useInjectedPresentationState()
const { resetView } = useResetViewUtils()

const isCurrentSlide = computed(() => currentSlide.value?.id === props.slide.id)

const onSelectSlide = () => {
  const wasCurrentSlide = isCurrentSlide.value
  currentSlideIdx.value = props.slideIndex - 1

  if (wasCurrentSlide) {
    resetView()
  }
}
</script>
