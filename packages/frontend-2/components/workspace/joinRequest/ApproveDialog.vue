<template>
  <LayoutDialog v-model:open="open" max-width="xs" :buttons="dialogButtons">
    <template #header>Approve join request</template>
    <p class="text-body-xs text-foreground">
      Are you sure you want to approve
      <span class="font-semibold">{{ joinRequest?.user.name }}'s</span>
      join request?
    </p>
    <div class="text-body-2xs text-foreground-2 leading-5 mt-4 mb-1">
      <p>
        Adding users may add seats to your current billing cycle. If there are available
        seats, they will be used first.
      </p>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useWorkspaceJoinRequest } from '~/lib/workspaces/composables/joinRequests'
import { graphql } from '~/lib/common/generated/gql'
import type { WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment } from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequest on WorkspaceJoinRequest {
    id
    user {
      id
      name
    }
    workspace {
      id
    }
  }
`)

const props = defineProps<{
  joinRequest: MaybeNullOrUndefined<WorkspaceJoinRequestApproveDialog_WorkspaceJoinRequestFragment>
}>()

const open = defineModel<boolean>('open', { required: true })

const { approve } = useWorkspaceJoinRequest()

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => {
        open.value = false
      }
    },
    {
      text: 'Approve',
      onClick: async () => {
        if (props.joinRequest?.workspace.id && props.joinRequest?.user.id) {
          await approve(
            {
              workspaceId: props.joinRequest.workspace.id,
              userId: props.joinRequest.user.id
            },
            props.joinRequest.id
          )

          open.value = false
        }
      }
    }
  ]
})
</script>
