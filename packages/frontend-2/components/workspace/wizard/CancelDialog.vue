<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Discard new workspace?"
    :buttons="dialogButtons"
    max-width="xs"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        You will lose all the information entered for this workspace.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'
import { homeRoute } from '~/lib/common/helpers/route'
import {
  convertThrowIntoFetchResult,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import { deleteWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import type { UserWorkspacesArgs, User } from '~/lib/common/generated/gql/graphql'
import { isUndefined } from 'lodash-es'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const props = defineProps<{
  workspaceId?: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const { resetWizardState } = useWorkspacesWizard()
const { mutate: deleteWorkspace } = useMutation(deleteWorkspaceMutation)
const { activeUser } = useActiveUser()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()
const router = useRouter()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Discard',
    props: { color: 'primary' },
    onClick: onConfirm
  }
])

const onConfirm = async () => {
  // If we have a in progress workspace ID, we're deleting the workspace
  if (props.workspaceId) {
    const cache = apollo.cache
    const result = await deleteWorkspace({
      workspaceId: props.workspaceId
    }).catch(convertThrowIntoFetchResult)

    // TODO: Move this to the composable, this a copy of the logic in the delete dialog
    if (result?.data) {
      if (activeUser.value) {
        cache.evict({
          id: getCacheId('Workspace', props.workspaceId)
        })

        modifyObjectFields<UserWorkspacesArgs, User['workspaces']>(
          cache,
          activeUser.value.id,
          (_fieldName, variables, value, { DELETE }) => {
            if (variables?.filter?.search?.length) return DELETE

            const newTotalCount = isUndefined(value?.totalCount)
              ? undefined
              : Math.max(0, (value?.totalCount || 0) - 1)

            return {
              ...value,
              ...(isUndefined(newTotalCount) ? {} : { totalCount: newTotalCount })
            }
          },
          { fieldNameWhitelist: ['workspaces'] }
        )
      }
    } else {
      return
    }
  }

  router.push(homeRoute)
  isOpen.value = false
  resetWizardState()
  mixpanel.track('Workspace Creation Canceled')
  mixpanel.stop_session_recording()
}
</script>
