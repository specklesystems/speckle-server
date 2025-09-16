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
          <UserAvatar size="sm" class="ml-auto flex-shrink-0" :user="activeUser" />
        </section>
        <section
          class="flex-1 flex justify-center simple-scrollbar overflow-y-auto mt-3 pb-3 px-3"
        >
          <ul class="flex flex-col gap-1 w-full">
            <template v-for="(slide, index) in slides" :key="slide.id">
              <PresentationLeftSidebarSlide
                :slide="slide"
                :is-current-slide="currentSlide?.id === slide.id"
                :slide-index="index + 1"
                @select-slide="$emit('select-slide', slide.id)"
              />
            </template>
          </ul>
        </section>

        <section
          class="flex items-center gap-x-2 w-full h-14 border-t border-outline-3 p-3"
        >
          <FormButton color="outline" full-width :to="loginRoute">Log in</FormButton>
          <FormButton full-width :to="registerRoute">Sign up</FormButton>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationLeftSidebar_SavedViewFragment } from '~~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { loginRoute, registerRoute } from '~~/lib/common/helpers/route'

graphql(`
  fragment PresentationLeftSidebar_SavedView on SavedView {
    ...PresentationSlidesLeftSidebarSlide_SavedView
    id
  }
`)

defineEmits<{
  (e: 'select-slide', id: string): void
}>()

defineProps<{
  slides: MaybeNullOrUndefined<PresentationLeftSidebar_SavedViewFragment[]>
  workspaceLogo?: MaybeNullOrUndefined<string>
  workspaceName?: MaybeNullOrUndefined<string>
  currentSlide?: MaybeNullOrUndefined<PresentationLeftSidebar_SavedViewFragment>
}>()

const { activeUser } = useActiveUser()
</script>
