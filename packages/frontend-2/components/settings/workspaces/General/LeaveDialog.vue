<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Leave workspace"
    max-width="xs"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      Are you sure you want to leave
      <span class="font-medium">{{ workspace.name }}</span>
      ?
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  SettingsWorkspaceGeneralDeleteDialog_WorkspaceFragment,
  UserWorkspacesArgs,
  User
} from '~/lib/common/generated/gql/graphql'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import { settingsLeaveWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  getCacheId,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { isUndefined } from 'lodash-es'
import { useMixpanel } from '~/lib/core/composables/mp'
import { homeRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment SettingsWorkspaceGeneralDeleteDialog_Workspace on Workspace {
    id
    name
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspaceGeneralDeleteDialog_WorkspaceFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: leaveWorkspace } = useMutation(settingsLeaveWorkspaceMutation)
const { triggerNotification } = useGlobalToast()
const { activeUser } = useActiveUser()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()
const router = useRouter()

const onLeave = async () => {
  isOpen.value = false

  const cache = apollo.cache
  const result = await leaveWorkspace({
    leaveId: props.workspace.id
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    router.push(homeRoute)

    if (activeUser.value) {
      cache.evict({
        id: getCacheId('Workspace', props.workspace.id)
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

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace left',
      description: `You have left the ${props.workspace.name} workspace`
    })

    mixpanel.track('Workspace User Left', {
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to leave workspace',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Leave',
    props: {
      color: 'primary'
    },
    onClick: onLeave
  }
])
</script>
