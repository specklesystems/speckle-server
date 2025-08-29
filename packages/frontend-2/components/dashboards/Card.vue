<template>
  <div>
    <CommonCard
      class="bg-foundation cursor-pointer"
      @click="navigateTo(dashboardRoute(activeWorkspaceSlug, dashboard.id))"
    >
      <div class="flex justify-between items-center gap-x-2">
        <div>
          <h1 class="break-words text-heading line-clamp-2">
            {{ dashboard.name }}
          </h1>
          <span class="text-body-3xs text-foreground-2 select-none">
            {{ updatedAt.full }}
          </span>
        </div>
        <div class="flex items-center gap-x-2">
          <UserAvatar
            v-if="dashboard.createdBy"
            :user="dashboard.createdBy"
            size="sm"
          />
          <Trash
            v-tippy="canDelete ? undefined : 'You can only delete your own dashboards'"
            class="size-3.5"
            :class="
              canDelete
                ? 'cursor-pointer text-foreground-2 hover:text-foreground'
                : 'cursor-not-allowed text-foreground-3'
            "
            @click.stop="toggleDeleteDialog"
          />
        </div>
      </div>
    </CommonCard>

    <CommonConfirmDialog
      v-model:open="isDeleteDialogOpen"
      title="Delete dashboard"
      text="Are you sure you want to delete this dashboard? This action cannot be undone."
      confirm-text="Delete"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { DashboardsCard_DashboardFragment } from '~~/lib/common/generated/gql/graphql'
import { dashboardRoute } from '~/lib/common/helpers/route'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { Trash } from 'lucide-vue-next'
import { useDeleteDashboard } from '~/lib/dashboards/composables/management'

graphql(`
  fragment DashboardsCard_Dashboard on Dashboard {
    id
    name
    createdAt
    workspace {
      id
    }
    createdBy {
      id
      name
      avatar
    }
    permissions {
      canDelete {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const props = defineProps<{
  dashboard: DashboardsCard_DashboardFragment
  activeWorkspaceSlug: MaybeNullOrUndefined<string>
}>()

const deleteDashboard = useDeleteDashboard()
const { formattedFullDate } = useDateFormatters()

const isDeleteDialogOpen = ref(false)

const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.dashboard.createdAt)
  }
})
const canDelete = computed(() => {
  return props.dashboard.permissions?.canDelete?.authorized
})

const toggleDeleteDialog = () => {
  isDeleteDialogOpen.value = !isDeleteDialogOpen.value
}

const handleDelete = async () => {
  if (!canDelete.value || !props.dashboard.id) return

  await deleteDashboard(props.dashboard.id, props.dashboard.workspace.id)
}
</script>
