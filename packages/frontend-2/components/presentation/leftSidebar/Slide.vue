<template>
  <li class="pb-3">
    <button
      class="bg-foundation-page rounded-xl overflow-hidden border border-outline-3 transition-all duration-200"
      :class="[
        isCurrentSlide ? '!border-outline-5' : '',
        slide.visibility !== SavedViewVisibility.AuthorOnly
          ? 'hover:!border-outline-4'
          : 'cursor-not-allowed'
      ]"
      :disabled="slide.visibility === SavedViewVisibility.AuthorOnly"
      @click="emit('select-slide', slide.id)"
    >
      <img
        :src="slide.screenshot"
        :alt="slide.name"
        class="w-full h-28 object-cover"
        :class="{
          'opacity-40': slide.visibility === SavedViewVisibility.AuthorOnly
        }"
      />
    </button>
    <div class="flex items-center gap-1.5 text-foreground mt-1">
      <LucideEyeOff
        v-if="slide.visibility === SavedViewVisibility.AuthorOnly"
        class="size-4"
      />
      <p class="text-body-3xs leading-none">
        {{ slide.name }}
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { SavedViewVisibility } from '~~/lib/common/generated/gql/graphql'
import type { PresentationSlidesLeftSidebarSlide_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import { LucideEyeOff } from 'lucide-vue-next'

graphql(`
  fragment PresentationSlidesLeftSidebarSlide_SavedView on SavedView {
    id
    name
    screenshot
    visibility
  }
`)

defineProps<{
  slide: PresentationSlidesLeftSidebarSlide_SavedViewFragment
  isCurrentSlide: boolean
}>()

const emit = defineEmits<{
  (e: 'select-slide', id: string): void
}>()
</script>
