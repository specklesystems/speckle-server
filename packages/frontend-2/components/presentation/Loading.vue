<template>
  <div class="w-full h-full flex bg-foundation">
    <div class="w-full h-full flex items-center justify-center">
      <div
        class="text-foreground flex flex-col mx-4 items-center justify-center bg-foundation rounded-2xl border border-outline-2 shadow-lg p-10 pb-8 w-full max-w-md"
      >
        <div class="min-w-0 mb-14 w-full">
          <h1 class="text-heading-xl truncate text-center">
            {{ presentation?.title }}
          </h1>
        </div>

        <div class="w-30 h-30 inline-block mb-4">
          <svg width="120" height="120" viewBox="0 0 120 120" class="medium-spin">
            <circle
              cx="60"
              cy="60"
              r="59.5"
              class="fill-foundation-2 stroke-outline-3"
            />
            <circle cx="60" cy="60" r="50" class="fill-foundation" />
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              class="stroke-primary"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="60 290"
            />
          </svg>
        </div>

        <div class="text-heading-sm mb-10">Fetching the 3D data…</div>

        <div class="max-w-[220px] flex items-center gap-x-2">
          <WorkspaceAvatar :name="workspace?.name" :logo="workspace?.logo" size="lg" />
          <div class="flex-1 min-w-0">
            <p class="text-body-xs font-medium text-foreground truncate">
              {{ workspace?.name }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

graphql(`
  fragment PresentationLoading_SavedViewGroup on SavedViewGroup {
    id
    title
    views(input: $input) {
      items {
        id
        screenshot
      }
    }
  }

  fragment PresentationLoading_LimitedWorkspace on LimitedWorkspace {
    id
    name
    logo
  }
`)

const {
  response: { presentation, workspace }
} = useInjectedPresentationState()
</script>

<style scoped>
.medium-spin {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
