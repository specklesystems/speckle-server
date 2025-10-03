<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Share presentation</template>
    <div class="flex items-center justify-between mt-2 mb-6">
      <div>
        <p class="text-body-xs font-medium text-foreground">Enable public access</p>
        <p class="text-body-2xs text-foreground-2">
          Let anyone view the presentation. No sign-in required.
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
      cta-text="Copy link"
    />

    <hr class="mb-6 border-outline-3" />

    <p class="text-body-2xs text-foreground-2 mb-3">
      Permissions for who can view and edit the presentation is based on the project
      roles.
      <NuxtLink
        v-if="isProjectOwner"
        :to="projectRoute(projectId, 'collaborators')"
        class="text-primary"
      >
        Manage project roles.
      </NuxtLink>
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { presentationRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedPresentationState } from '~~/lib/presentations/composables/setup'
import { projectRoute } from '~/lib/common/helpers/route'
import { Roles } from '@speckle/shared'

const presentationDialogSharePermissionsQuery = graphql(`
  query PresentationShareDialogPermissions(
    $projectId: String!
    $savedViewGroupId: ID!
  ) {
    project(id: $projectId) {
      id
      role
      savedViewGroup(id: $savedViewGroupId) {
        id
        groupId
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
  }
`)

const presentationDialogShareTokenMutation = graphql(`
  mutation PresentationShareToken($input: SavedViewGroupShareInput!) {
    projectMutations {
      savedViewMutations {
        share(input: $input) {
          id
          revoked
          content
        }
      }
    }
  }
`)

const presentationDialogShareEnableTokenMutation = graphql(`
  mutation PresentationShareEnableToken($input: SavedViewGroupShareUpdateInput!) {
    projectMutations {
      savedViewMutations {
        enableShare(input: $input) {
          id
          revoked
          content
        }
      }
    }
  }
`)

const presentationDialogShareDisableTokenMutation = graphql(`
  mutation PresentationShareDisableToken($input: SavedViewGroupShareUpdateInput!) {
    projectMutations {
      savedViewMutations {
        disableShare(input: $input) {
          id
          revoked
          content
        }
      }
    }
  }
`)

const open = defineModel<boolean>('open', { required: true })

const { projectId, presentationId } = useInjectedPresentationState()

const { result, refetch } = useQuery(presentationDialogSharePermissionsQuery, () => ({
  projectId: projectId.value,
  savedViewGroupId: presentationId.value
}))
const { mutate: createToken } = useMutation(presentationDialogShareTokenMutation)
const { mutate: disableToken } = useMutation(
  presentationDialogShareDisableTokenMutation
)
const { mutate: enableToken } = useMutation(presentationDialogShareEnableTokenMutation)
const { triggerNotification } = useGlobalToast()
const mixpanel = useMixpanel()

const isProjectOwner = computed(
  () => result.value?.project?.role === Roles.Stream.Owner
)
const createTokenPermission = computed(
  () => result.value?.project?.savedViewGroup?.permissions?.canCreateToken
)
const isRevoked = computed(
  () => result.value?.project?.savedViewGroup?.shareLink?.revoked
)
const shareLink = computed(() => result.value?.project?.savedViewGroup?.shareLink)
const shareUrl = computed(() => {
  if (!shareLink.value?.id || !projectId.value || !presentationId.value) return ''

  const url = new URL(
    presentationRoute(projectId.value, presentationId.value),
    window.location.toString()
  )
  url.searchParams.set('presentationToken', shareLink.value.content)

  return url.toString()
})
const enablePublicUrl = computed({
  get: () => !isRevoked.value && !!shareLink.value?.id,
  set: (value: boolean) => {
    onEnablePublicUrl(value)
  }
})

const onEnablePublicUrl = async (value: boolean) => {
  if (!projectId.value || !presentationId.value) return

  if (value) {
    // If enabling and no share link exists, create one first
    if (!shareLink.value?.id) {
      const result = await createToken({
        input: { projectId: projectId.value, groupId: presentationId.value }
      }).catch(convertThrowIntoFetchResult)

      if (!result?.data?.projectMutations.savedViewMutations.share.id) {
        const errMsg = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to enable public access',
          description: errMsg
        })
        return
      }
    }

    // Enable the share link
    if (shareLink.value?.id) {
      await enableToken({
        input: {
          projectId: projectId.value,
          groupId: presentationId.value,
          shareId: shareLink.value.id
        }
      })
    }
  } else {
    if (shareLink.value?.id) {
      await disableToken({
        input: {
          projectId: projectId.value,
          groupId: presentationId.value,
          shareId: shareLink.value.id
        }
      })
    }
  }

  // Track the sharing toggle event
  mixpanel.track('Presentation Sharing Toggled', {
    public: value,
    projectId: projectId.value,
    savedViewGroupId: presentationId.value
  })

  await refetch()
}
</script>
