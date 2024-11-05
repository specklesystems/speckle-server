<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Delete workspace"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <p class="text-body-xs text-foreground mb-2">
      Are you sure you want to permanently delete
      <span class="font-medium">{{ workspace.name }}?</span>
      This action cannot be undone.
    </p>
    <FormTextInput
      v-model="workspaceNameInput"
      name="workspaceNameConfirm"
      label="To confirm deletion, type the workspace name below."
      placeholder="Type the workspace name here..."
      full-width
      show-label
      hide-error-message
      class="text-sm mb-2"
      color="foundation"
    />
    <FormTextArea
      v-model="feedback"
      name="reasonForDeletion"
      label="Why did you delete this workspace?"
      placeholder="We want to improve so we're curious about your honest feedback"
      show-label
      show-optional
      full-width
      class="text-sm mb-2"
      color="foundation"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  SettingsWorkspaceGeneralDeleteDialog_WorkspaceFragment,
  UserWorkspacesArgs,
  User
} from '~/lib/common/generated/gql/graphql'
import { FormTextInput, type LayoutDialogButton } from '@speckle/ui-components'
import { useMutation, useApolloClient } from '@vue/apollo-composable'
import { deleteWorkspaceMutation } from '~/lib/settings/graphql/mutations'
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
import { useZapier } from '~/lib/core/composables/zapier'
import { useForm } from 'vee-validate'

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

const { mutate: deleteWorkspace } = useMutation(deleteWorkspaceMutation)
const { triggerNotification } = useGlobalToast()
const { activeUser } = useActiveUser()
const router = useRouter()
const apollo = useApolloClient().client
const mixpanel = useMixpanel()
const { sendWebhook } = useZapier()
const { resetForm } = useForm<{ feedback: string }>()

const workspaceNameInput = ref('')
const feedback = ref('')

const onDelete = async () => {
  if (workspaceNameInput.value !== props.workspace.name) return

  const cache = apollo.cache
  const result = await deleteWorkspace({
    workspaceId: props.workspace.id
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
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

    mixpanel.track('Workspace Deleted', {
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id,
      feedback: feedback.value
    })

    // Only send zapier-discord webhook if not in dev environment
    if (!import.meta.dev) {
      await sendWebhook('https://hooks.zapier.com/hooks/catch/12120532/2m4okri/', {
        userId: activeUser.value?.id ?? '',
        feedback: feedback.value
          ? `Action: Workspace Deleted(${props.workspace.name}) Feedback: ${feedback.value}`
          : `Action: Workspace Deleted(${props.workspace.name}) - No feedback provided`
      })
    }

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace deleted',
      description: `The ${props.workspace.name} workspace has been deleted`
    })

    router.push(homeRoute)
    isOpen.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete workspace',
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
    text: 'Delete',
    props: {
      color: 'danger',
      disabled: workspaceNameInput.value !== props.workspace.name
    },
    onClick: onDelete
  }
])

watch(isOpen, () => {
  resetForm()
})
</script>
