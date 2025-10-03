<template>
  <li class="w-full" :class="{ 'pb-0': hideTitle }">
    <button
      class="bg-foundation-page rounded-md overflow-hidden border transition-all duration-200 w-full"
      :class="[isCurrentSlide ? 'border-outline-1' : 'border-outline-3 hover:border-outline-5']"
      @click="onSelectSlide"
    >
      <img
        :src="thumbnailUrlWithToken"
        :alt="slide.name"
        class="w-full aspect-[3/2] md:aspect-video object-cover"
      />
    </button>

    <p v-if="!hideTitle" class="text-body-3xs font-medium text-foreground mb-2">
      <span class="font-semibold mr-1">{{ slideIndex }}.</span>
      {{ slide.name }}
    </p>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlideListSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { useAuthManager } from '~~/lib/auth/composables/auth'

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
  ui: { slideIdx: currentSlideIdx, slide: currentSlide },
  viewer: { resetView }
} = useInjectedPresentationState()
const { presentationToken } = useAuthManager()

const isCurrentSlide = computed(() => currentSlide.value?.id === props.slide.id)

const thumbnailUrlWithToken = computed(() => {
  if (!props.slide.thumbnailUrl) return props.slide.thumbnailUrl

  const url = new URL(props.slide.thumbnailUrl)
  if (presentationToken.value) {
    url.searchParams.set('embedToken', presentationToken.value)
  }
  return url.toString()
})

const onSelectSlide = () => {
  const wasCurrentSlide = isCurrentSlide.value
  currentSlideIdx.value = props.slideIndex - 1

  if (wasCurrentSlide) {
    resetView()
  }
}
</script>
