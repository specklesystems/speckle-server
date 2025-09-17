<template>
  <li class="pb-4">
    <button
      class="bg-foundation-page rounded-xl overflow-hidden border border-outline-3 transition-all duration-200 hover:!border-outline-4"
      :class="[isCurrentSlide ? '!border-outline-5' : '']"
      @click="selectSlide(slide.id)"
    >
      <img :src="slide.screenshot" :alt="slide.name" class="w-full h-28 object-cover" />
    </button>
    <p class="text-body-3xs leading-none text-foreground mt-2">
      {{ slideIndex }}. {{ slide.name }}
    </p>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlideListSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import {
  usePresentationState,
  usePresentationActions
} from '~/lib/presentations/composables/setup'

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
}>()

const { currentSlide } = usePresentationState()
const { selectSlide } = usePresentationActions()

const isCurrentSlide = computed(() => currentSlide.value?.id === props.slide.id)
</script>
