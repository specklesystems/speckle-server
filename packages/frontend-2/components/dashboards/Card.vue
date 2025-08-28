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
            v-tippy="
              dashboard.permissions?.canDelete?.authorized
                ? undefined
                : 'You can only delete your own dashboards'
            "
            class="size-3.5"
            :class="
              dashboard.permissions?.canDelete?.authorized
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
import { useMutation } from '@vue/apollo-composable'
import { getCacheId } from '~/lib/common/helpers/graphql'

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

const dashboardsCardDeleteMutation = graphql(`
  mutation DashboardsCardDelete($id: String!) {
    dashboardMutations {
      delete(id: $id)
    }
  }
`)

const props = defineProps<{
  dashboard: DashboardsCard_DashboardFragment
  activeWorkspaceSlug: MaybeNullOrUndefined<string>
}>()

const { mutate: deleteDashboard } = useMutation(dashboardsCardDeleteMutation, {
  update: (cache, { data }) => {
    if (!data?.dashboardMutations?.delete) return

    cache.evict({ id: getCacheId('Dashboard', props.dashboard.id) })
  }
})
const { formattedFullDate } = useDateFormatters()
const { triggerNotification } = useGlobalToast()

const isDeleteDialogOpen = ref(false)

const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.dashboard.createdAt)
  }
})

const toggleDeleteDialog = () => {
  isDeleteDialogOpen.value = !isDeleteDialogOpen.value
}

const handleDelete = async () => {
  if (!props.dashboard.permissions?.canDelete?.authorized) return

  const result = await deleteDashboard({ id: props.dashboard.id }).catch(
    convertThrowIntoFetchResult
  )

  if (result?.data?.dashboardMutations?.delete) {
    triggerNotification({
      title: `Dashboard ${props.dashboard.name} deleted`,
      type: ToastNotificationType.Success
    })
  } else {
    const err = getFirstGqlErrorMessage(result?.errors)
    triggerNotification({
      title: "Couldn't delete dashboard",
      description: err,
      type: ToastNotificationType.Danger
    })
  }
}
</script>
