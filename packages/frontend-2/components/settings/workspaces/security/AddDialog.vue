<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Add domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <FormSelectWorkspaceDomains
      :domains="verifiedUserDomains"
      :model-value="selectedDomain"
      @update:model-value="onSelectedDomainUpdate"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsAddWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'

const props = defineProps<{
  verifiedUserDomains: string[]
  workspaceId: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { mutate: addWorkspaceDomain } = useMutation(settingsAddWorkspaceDomainMutation)
const { triggerNotification } = useGlobalToast()

const selectedDomain = ref<string>('')
const onSelectedDomainUpdate = (e?: string | string[]) => {
  if (typeof e !== 'string') {
    return
  }
  selectedDomain.value = e
}

const onAdd = async () => {
  const domain = selectedDomain.value

  const result = await addWorkspaceDomain({
    input: {
      domain,
      workspaceId: props.workspaceId
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    isOpen.value = false
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Domain added',
      description: `The verified domain ${domain} has been added to your workspace`
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to add verified domain',
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
    text: 'Add',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    onClick: onAdd
  }
])
</script>
