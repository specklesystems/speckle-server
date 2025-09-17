<template>
  <li :class="[hideTitle ? '' : 'pb-4']">
    <button
      class="bg-foundation-page rounded-xl overflow-hidden border border-outline-3 transition-all duration-200 hover:!border-outline-4"
      :class="[isCurrentSlide ? '!border-outline-5' : '']"
    >
      <img :src="slide.screenshot" :alt="slide.name" class="w-full h-28 object-cover" />
    </button>
    <p v-if="!hideTitle" class="text-body-3xs leading-none text-foreground mt-2">
      {{ slideIndex }}. {{ slide.name }}
    </p>
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
  ui: { slide: currentSlide }
} = useInjectedPresentationState()
// const { selectSlide } = usePresentationActions()

const isCurrentSlide = computed(() => currentSlide.value?.id === props.slide.id)
</script>
