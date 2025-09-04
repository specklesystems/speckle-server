<template>
  <aside class="bg-foundation h-screen w-60 border-r border-outline-3 p-3">
    <div class="flex flex-col h-full">
      <div class="flex-shrink-0 flex items-center gap-2">
        <WorkspaceAvatar :name="workspaceName" :logo="workspaceLogo" />
        <p class="text-body-xs text-foreground">
          {{ workspaceName }}
        </p>
      </div>
      <div class="flex-1 flex justify-center pt-4">
        <section class="flex flex-col gap-4 w-full">
          <button
            v-for="(slide, index) in slides"
            :key="slide.id"
            class="bg-foundation-2 rounded-xl overflow-hidden border border-outline-3 hover:!border-outline-4 transition-all duration-200"
            :class="{ '!border-outline-5': currentSlideIndex === index }"
            @click="emit('select-slide', index)"
          >
            <img
              :src="slide.screenshot"
              :alt="slide.name"
              class="w-full h-28 object-cover"
            />
          </button>
        </section>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlidesSidebar_SavedViewGroupFragment } from '~~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment PresentationSlidesSidebar_SavedView on SavedView {
    id
    name
    screenshot
  }
`)

graphql(`
  fragment PresentationSlidesSidebar_SavedViewGroup on SavedViewGroup {
    id
    views(input: $input) {
      items {
        ...PresentationSlidesSidebar_SavedView
        id
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'select-slide', index: number): void
}>()

const props = defineProps<{
  slides: MaybeNullOrUndefined<PresentationSlidesSidebar_SavedViewGroupFragment>
  workspaceLogo?: MaybeNullOrUndefined<string>
  workspaceName?: MaybeNullOrUndefined<string>
  currentSlideIndex?: number
}>()

const slides = computed(() => props.slides?.views.items)
</script>
