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
          <WorkspaceAvatar size="lg" :name="workspace?.name" :logo="workspace?.logo" />
          <p class="text-body-xs text-foreground">
            {{ workspace?.name }}
          </p>
          <UserAvatar size="sm" class="ml-auto flex-shrink-0" :user="activeUser" />
        </section>
        <section
          class="flex-1 flex justify-center simple-scrollbar overflow-y-auto mt-3 pb-3 px-3"
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
import { loginRoute, registerRoute } from '~~/lib/common/helpers/route'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment PresentationLeftSidebar_Workspace on Workspace {
    id
    name
    logo
  }
`)

const { isLoggedIn, activeUser } = useActiveUser()
const {
  response: { workspace }
} = useInjectedPresentationState()
</script>
