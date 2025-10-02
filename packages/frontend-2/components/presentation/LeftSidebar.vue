<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="w-full sm:w-auto">
    <div
      class="fixed inset-0 z-10 lg:hidden"
      @click="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div class="absolute inset-0 bg-black/20" />
    </div>

    <aside
      class="relative z-20 bg-foundation h-dvh w-[212px] md:w-60 border-r border-outline-3"
    >
      <div class="flex flex-col h-full">
        <section
          class="flex-shrink-0 flex items-center gap-3 absolute bg-foundation/70 backdrop-blur-lg w-full p-3 pb-2.5 border-b border-white/80 dark:border-gray-900/30"
        >
          <NuxtLink
            class="flex items-center gap-2.5 min-w-0 flex-1"
            :to="workspaceRoute(workspace?.slug)"
          >
            <WorkspaceAvatar
              :name="workspace?.name"
              :logo="workspace?.logo"
              size="lg"
            />
            <div class="flex-1 min-w-0">
              <p class="text-body-xs font-medium text-foreground truncate">
                {{ workspace?.name }}
              </p>
            </div>
          </NuxtLink>
        </section>
        <section
          class="flex-1 flex justify-center simple-scrollbar overflow-y-auto pt-16 pb-3 px-3"
        >
          <PresentationSlideList />
        </section>

        <section
          v-if="!isLoggedIn"
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
import { loginRoute, registerRoute, workspaceRoute } from '~~/lib/common/helpers/route'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment PresentationLeftSidebar_LimitedWorkspace on LimitedWorkspace {
    id
    name
    logo
    slug
  }
`)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { isLoggedIn } = useActiveUser()
const {
  response: { workspace }
} = useInjectedPresentationState()
</script>
