<template>
  <li class="pb-3">
    <button
      class="bg-foundation-page rounded-xl overflow-hidden border border-outline-3 transition-all duration-200 hover:!border-outline-4"
      :class="[isCurrentSlide ? '!border-outline-5' : '']"
      @click="$emit('select-slide', slide.id)"
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
import type { PresentationSlidesLeftSidebarSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment PresentationSlidesLeftSidebarSlide_SavedView on SavedView {
    id
    name
    screenshot
  }
`)

defineEmits<{
  (e: 'select-slide', id: string): void
}>()

defineProps<{
  slide: PresentationSlidesLeftSidebarSlide_SavedViewFragment
  isCurrentSlide: boolean
  slideIndex: number
}>()
</script>
