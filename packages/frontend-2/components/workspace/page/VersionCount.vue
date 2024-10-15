<template>
  <div class="w-36 flex flex-col items-center md:mx-4">
    <CommonProgressBar
      class="mb-1"
      :current-value="versionsCount.current"
      :max-value="versionsCount.max"
    />
    <div class="text-body-3xs text-foreground">
      <span class="font-medium">
        {{ versionsCount.current }}/{{ versionsCount.max }}
      </span>
      free model versions
    </div>
  </div>
</template>

<script lang="ts" setup>
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspacePageVersionCount_WorkspaceVersionsCountFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspacePageVersionCount_WorkspaceVersionsCount on WorkspaceVersionsCount {
    current
    max
  }
`)

defineProps<{
  versionsCount: WorkspacePageVersionCount_WorkspaceVersionsCountFragment
}>()
</script>
