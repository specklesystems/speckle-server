<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Cancel workspace creation"
    :buttons="dialogButtons"
    max-width="md"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        If you cancel, you will lose all progress.
        <br />
        Do you want to continue?
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mp'
import { workspacesRoute } from '~/lib/common/helpers/route'
import {
  convertThrowIntoFetchResult,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import { deleteWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import type { UserWorkspacesArgs, User } from '~/lib/common/generated/gql/graphql'
import { isUndefined } from 'lodash-es'
const props = defineProps<{
  workspaceId?: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

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
    text: 'Confirm',
    props: { color: 'primary' },
    onClick: onConfirm
  }
])

const onConfirm = async () => {
  // If we have a in progress workspace ID, we're deleting a workspace
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

  router.push(workspacesRoute)
  isOpen.value = false
  mixpanel.track('Workspace Creation Canceled', {
    ...(props.workspaceId && {
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
    })
  })
}
</script>
