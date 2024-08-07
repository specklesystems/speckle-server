<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Remove domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    Are you sure you want to remove
    <b>@{{ domain }}</b>
    from your workspace's verified domains?
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { emit } from 'process'
import type { WorkspaceDomainInfo_SettingsFragment } from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { settingsDeleteWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'

const props = defineProps<{
  workspaceId: string
  domain: WorkspaceDomainInfo_SettingsFragment
}>()

const emit = defineEmits<{
  removed: [WorkspaceDomainInfo_SettingsFragment[]]
}>()

const { mutate: deleteWorkspaceDomain } = useMutation(
  settingsDeleteWorkspaceDomainMutation
)
const { triggerNotification } = useGlobalToast()

const isOpen = defineModel<boolean>('open', { required: true })

const handleRemove = async () => {
  const result = await deleteWorkspaceDomain({
    input: {
      workspaceId: props.workspaceId,
      id: props.domain.id
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Domain removed',
      description: `Removed domain successfully`
    })
    emit('removed', result.data.workspaceMutations.deleteDomain.domains)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to remove domain',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Remove',
    props: {
      fullWidth: true,
      color: 'danger'
    },
    onClick: handleRemove
  }
])
</script>
