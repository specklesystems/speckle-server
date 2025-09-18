<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Share dashboard</template>
    <h4 class="text-body-xs font-medium text-foreground mb-1">Dashboard URL</h4>
    <FormClipboardInput :value="dashboardUrl" />

    <div v-if="canCreateToken">
      <hr class="my-4 border-outline-3" />
      <div class="flex items-center justify-between">
        <div>
          <p class="text-body-xs font-medium text-foreground">Enable public access</p>
          <p class="text-body-2xs text-foreground-2">Anyone with the link can view</p>
        </div>
        <FormSwitch v-model="enablePublicUrl" name="isPublic" :show-label="false" />
      </div>
      <FormClipboardInput v-if="enablePublicUrl" class="mt-3" :value="shareUrl" />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { dashboardRoute } from '~~/lib/common/helpers/route'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery, useMutation } from '@vue/apollo-composable'

const dashboardsDialogSharePermissionsQuery = graphql(`
  query DashboardsSharDialogPermissions($id: String!) {
    dashboard(id: $id) {
      id
      shareLink {
        id
        content
        revoked
      }
      permissions {
        canCreateToken {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

const dashboardsDialogShareTokenMutation = graphql(`
  mutation DashboardsShareToken($dashboardId: String!) {
    dashboardMutations {
      share(dashboardId: $dashboardId) {
        id
        revoked
        content
      }
    }
  }
`)

const dashboardsDialogShareEnableTokenMutation = graphql(`
  mutation DashboardsShareEnableToken($input: DashboardShareInput!) {
    dashboardMutations {
      enableShare(input: $input) {
        id
        revoked
        content
      }
    }
  }
`)

const dashboardsDialogShareDisableTokenMutation = graphql(`
  mutation DashboardsShareDisableToken($input: DashboardShareInput!) {
    dashboardMutations {
      disableShare(input: $input) {
        id
        revoked
        content
      }
    }
  }
`)

const props = defineProps<{
  workspaceSlug: MaybeNullOrUndefined<string>
  dashboardId: MaybeNullOrUndefined<string>
}>()

const open = defineModel<boolean>('open', { required: true })

const { result, refetch } = useQuery(dashboardsDialogSharePermissionsQuery, () => ({
  id: props.dashboardId || ''
}))
const { mutate: createToken } = useMutation(dashboardsDialogShareTokenMutation)
const { mutate: disableToken } = useMutation(dashboardsDialogShareDisableTokenMutation)
const { mutate: enableToken } = useMutation(dashboardsDialogShareEnableTokenMutation)

const isRevoked = computed(() => result.value?.dashboard?.shareLink?.revoked)
const shareLink = computed(() => result.value?.dashboard?.shareLink)
const shareUrl = computed(() => {
  if (!shareLink.value?.id || !props.workspaceSlug || !props.dashboardId) return ''

  const url = new URL(
    dashboardRoute(props.workspaceSlug, props.dashboardId),
    window.location.toString()
  )
  url.searchParams.set('dashboardToken', shareLink.value.content)

  return url.toString()
})
const canCreateToken = computed(
  () => result.value?.dashboard?.permissions?.canCreateToken?.authorized
)
const enablePublicUrl = computed({
  get: () => !isRevoked.value && !!shareLink.value?.id,
  set: (value: boolean) => {
    onEnablePublicUrl(value)
  }
})
const dashboardUrl = computed(() => {
  if (!props.workspaceSlug || !props.dashboardId) return ''

  return new URL(
    dashboardRoute(props.workspaceSlug, props.dashboardId),
    window.location.toString()
  ).toString()
})

const onEnablePublicUrl = async (value: boolean) => {
  if (!props.dashboardId) return

  if (value) {
    // If enabling and no share link exists, create one first
    if (!shareLink.value?.id) {
      await createToken({ dashboardId: props.dashboardId })
    }

    // Enable the share link
    if (shareLink.value?.id) {
      await enableToken({
        input: { dashboardId: props.dashboardId, shareId: shareLink.value.id }
      })
    }
  } else {
    if (shareLink.value?.id) {
      await disableToken({
        input: { dashboardId: props.dashboardId, shareId: shareLink.value.id }
      })
    }
  }

  await refetch()
}
</script>
