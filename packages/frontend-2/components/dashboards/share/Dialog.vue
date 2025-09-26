<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Share dashboard</template>
    <div class="flex items-center justify-between mt-2 mb-6">
      <div>
        <p class="text-body-xs font-medium text-foreground">Enable public access</p>
        <p class="text-body-2xs text-foreground-2">
          Let anyone view the dashboard. No sign-in required.
        </p>
      </div>
      <div
        v-tippy="
          createTokenPermission?.authorized ? undefined : createTokenPermission?.message
        "
      >
        <FormSwitch
          v-model="enablePublicUrl"
          name="isPublic"
          :show-label="false"
          :disabled="!createTokenPermission?.authorized"
        />
      </div>
    </div>
    <FormClipboardInput
      v-if="enablePublicUrl"
      class="mb-6"
      :value="shareUrl"
      cta-color="primary"
    />

    <template v-if="isWorkspaceAdmin">
      <hr class="mb-6 border-outline-3" />

      <p class="text-body-2xs text-foreground-2 mb-3">
        Permissions for who can view and edit dashboards is based on the workspace
        seats. Editor seats can edit, Viewer seats can view.
        <NuxtLink
          :to="settingsWorkspaceRoutes.members.route(workspaceSlug)"
          class="text-primary"
        >
          Manage seats.
        </NuxtLink>
      </p>
    </template>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { dashboardRoute } from '~~/lib/common/helpers/route'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { Roles } from '@speckle/shared'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

const dashboardsDialogSharePermissionsQuery = graphql(`
  query DashboardsSharDialogPermissions($id: String!) {
    dashboard(id: $id) {
      id
      shareLink {
        id
        content
        revoked
      }
      workspace {
        id
        role
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
const { triggerNotification } = useGlobalToast()

const isWorkspaceAdmin = computed(
  () => result.value?.dashboard?.workspace?.role === Roles.Workspace.Admin
)
const createTokenPermission = computed(
  () => result.value?.dashboard?.permissions?.canCreateToken
)
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
const enablePublicUrl = computed({
  get: () => !isRevoked.value && !!shareLink.value?.id,
  set: (value: boolean) => {
    onEnablePublicUrl(value)
  }
})

const onEnablePublicUrl = async (value: boolean) => {
  if (!props.dashboardId) return

  if (value) {
    // If enabling and no share link exists, create one first
    if (!shareLink.value?.id) {
      const result = await createToken({ dashboardId: props.dashboardId }).catch(
        convertThrowIntoFetchResult
      )

      if (!result?.data?.dashboardMutations.share.id) {
        const errMsg = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to enable public access',
          description: errMsg
        })
      }
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
