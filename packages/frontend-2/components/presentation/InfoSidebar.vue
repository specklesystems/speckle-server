<template>
  <aside
    class="bg-foundation h-48 md:h-screen w-full md:w-80 border-t md:border-t-0 md:border-l border-outline-3 py-5 px-4"
  >
    <section class="pt-2 flex flex-col gap-4">
      <h1 v-if="currentSlide?.name" class="text-xl font-medium text-foreground px-2">
        {{ currentSlide?.name }}
      </h1>

      <p
        v-if="currentSlide?.description"
        class="text-body-sm text-foreground whitespace-pre-wrap px-2"
      >
        {{ currentSlide?.description }}
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment PresentationInfoSidebar_SavedView on SavedView {
    id
    name
    description
  }
`)

const {
  ui: { slide: currentSlide }
} = useInjectedPresentationState()
</script>
