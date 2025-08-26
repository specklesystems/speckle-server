<template>
  <NuxtLink :to="dashboardRoute(activeWorkspaceSlug, dashboard.id)">
    <CommonCard class="bg-foundation cursor-pointer">
      <div class="flex justify-between items-center gap-x-2">
        <div>
          <h1 class="break-words text-heading line-clamp-2">
            {{ dashboard.name }}
          </h1>
          <span class="text-body-3xs text-foreground-2 select-none">
            {{ updatedAt.full }}
          </span>
        </div>
        <UserAvatar v-if="dashboard.createdBy" :user="dashboard.createdBy" size="sm" />
      </div>
    </CommonCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { DashboardsCard_DashboardFragment } from '~~/lib/common/generated/gql/graphql'
import { dashboardRoute } from '~/lib/common/helpers/route'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment DashboardsCard_Dashboard on Dashboard {
    id
    name
    createdAt
    createdBy {
      id
      name
      avatar
    }
  }
`)

const props = defineProps<{
  dashboard: DashboardsCard_DashboardFragment
  activeWorkspaceSlug: MaybeNullOrUndefined<string>
}>()

const { formattedFullDate } = useDateFormatters()

const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.dashboard.createdAt)
  }
})
</script>
