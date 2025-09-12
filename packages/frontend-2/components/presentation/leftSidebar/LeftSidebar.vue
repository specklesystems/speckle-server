<template>
  <div class="w-full md:w-auto">
    <div class="fixed inset-0 z-10 md:hidden">
      <div class="absolute inset-0 bg-black/50" />
    </div>

    <aside
      class="relative z-20 bg-foundation h-screen w-1/2 md:w-60 border-r border-outline-3 pt-3"
    >
      <div class="flex flex-col h-full">
        <section class="flex-shrink-0 flex items-center gap-2.5 px-3">
          <WorkspaceAvatar size="lg" :name="workspaceName" :logo="workspaceLogo" />
          <p class="text-body-xs text-foreground">
            {{ workspaceName }}
          </p>
        </section>
        <section
          class="flex-1 flex justify-center simple-scrollbar overflow-y-auto mt-3 pb-3 px-3"
        >
          <ul class="flex flex-col gap-1 w-full">
            <template v-for="slide in slides" :key="slide.id">
              <PresentationLeftSidebarSlide
                v-if="slide.visibility === SavedViewVisibility.Public || !isPresentMode"
                :slide="slide"
                :is-current-slide="currentSlideId === slide.id"
                @select-slide="emit('select-slide', slide.id)"
              />
            </template>
          </ul>
        </section>

        <PresentationLeftSidebarUserMenu />
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

graphql(`
  fragment PresentationSlidesSidebar_SavedViewGroup on SavedViewGroup {
    id
    views(input: $input) {
      items {
        ...PresentationSlidesLeftSidebarSlide_SavedView
        visibility
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
