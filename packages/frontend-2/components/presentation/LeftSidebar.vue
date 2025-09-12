<template>
  <div class="w-full md:w-auto">
    <div class="fixed inset-0 z-10 md:hidden">
      <div class="absolute inset-0 bg-black/50" />
    </div>

    <aside
      class="relative z-20 bg-foundation h-screen w-1/2 md:w-60 border-r border-outline-3 pt-3 pl-3"
    >
      <div class="flex flex-col h-full">
        <section class="flex-shrink-0 flex items-center gap-2.5">
          <WorkspaceAvatar size="lg" :name="workspaceName" :logo="workspaceLogo" />
          <p class="text-body-xs text-foreground">
            {{ workspaceName }}
          </p>
        </section>
        <section
          class="flex-1 flex justify-center simple-scrollbar overflow-y-auto mt-3 pb-3 pr-3"
        >
          <ul class="flex flex-col gap-1 w-full">
            <template v-for="slide in slides" :key="slide.id">
              <li
                v-if="slide.visibility === SavedViewVisibility.Public || !isPresentMode"
                class="pb-3"
              >
                <button
                  class="bg-foundation-page rounded-xl overflow-hidden border border-outline-3 transition-all duration-200"
                  :class="[
                    currentSlideId === slide.id ? '!border-outline-5' : '',
                    slide.visibility !== SavedViewVisibility.AuthorOnly
                      ? 'hover:!border-outline-4'
                      : ''
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
          </ul>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import {
  type PresentationSlidesSidebar_SavedViewGroupFragment,
  SavedViewVisibility
} from '~~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { LucideEyeOff } from 'lucide-vue-next'

graphql(`
  fragment PresentationSlidesSidebar_SavedView on SavedView {
    id
    name
    screenshot
    visibility
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
  (e: 'select-slide', id: string): void
}>()

const props = defineProps<{
  slides: MaybeNullOrUndefined<PresentationSlidesSidebar_SavedViewGroupFragment>
  workspaceLogo?: MaybeNullOrUndefined<string>
  workspaceName?: MaybeNullOrUndefined<string>
  currentSlideId?: string
  isPresentMode?: boolean
}>()

const slides = computed(() => props.slides?.views.items)
</script>
