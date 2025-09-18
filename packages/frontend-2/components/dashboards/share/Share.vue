<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="flex items-center relative">
    <FormButton
      color="outline"
      class="hidden sm:flex"
      size="sm"
      :disabled="!canCreateToken"
      @click="shareDialogOpen = true"
    >
      Share
    </FormButton>
    <DashboardsShareDialog
      v-model:open="shareDialogOpen"
      :workspace-slug="workspaceSlug"
      :dashboard-id="id"
    />
  </div>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const dashboardsSharePermissionsQuery = graphql(`
  query DashboardsSharePermissions($id: String!) {
    dashboard(id: $id) {
      id
      permissions {
        canCreateToken {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

const props = defineProps<{
  id: MaybeNullOrUndefined<string>
  workspaceSlug: MaybeNullOrUndefined<string>
}>()

const { result } = useQuery(dashboardsSharePermissionsQuery, {
  id: props.id as string
})

const canCreateToken = computed(
  () => result.value?.dashboard?.permissions?.canCreateToken?.authorized
)

const shareDialogOpen = ref(false)
</script>
