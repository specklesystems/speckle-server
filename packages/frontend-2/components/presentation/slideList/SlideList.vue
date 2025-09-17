<template>
  <ul class="flex flex-col gap-1 w-full">
    <PresentationSlideListSlide
      v-for="(slide, index) in slides"
      :key="slide.id"
      :slide="slide"
      :slide-index="index + 1"
    />
  </ul>
</template>

<script setup lang="ts">
import { usePresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment PresentationSlideListSlide_SavedViewGroup on SavedViewGroup {
    id
    views(input: $savedViewGroupViewsInput) {
      items {
        id
        ...PresentationSlideListSlide_SavedView
      }
    }
  }
`)

const { slides } = usePresentationState()
</script>
