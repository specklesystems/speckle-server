<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Add domain"
    max-width="sm"
    :buttons="dialogButtons"
  >
    <div class="h-24">
      <FormSelectWorkspaceDomains
        :domains="verifiedUserDomains"
        :model-value="selectedDomain"
        @update:model-value="onSelectedDomainUpdate"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation, useQuery } from '@vue/apollo-composable'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsAddWorkspaceDomainMutation } from '~/lib/settings/graphql/mutations'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'
import { activeUserEmailsQuery } from '~/lib/user/graphql/queries'
import type { WorkspaceDomainInfo_SettingsFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  workspaceId: string
}>()

const emit = defineEmits<{
  added: [WorkspaceDomainInfo_SettingsFragment[]]
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { result: activeUserEmails } = useQuery(activeUserEmailsQuery)
const { mutate: addWorkspaceDomain } = useMutation(settingsAddWorkspaceDomainMutation)
const { triggerNotification } = useGlobalToast()

const verifiedUserDomains = computed(() => {
  const emails = new Set<string>()

  for (const email of activeUserEmails?.value?.activeUser?.emails ?? []) {
    if (!email.verified) {
      continue
    }
    emails.add(email.email.split('@')[1])
  }

  return [...emails]
})

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
    emit('added', result.data.workspaceMutations.addDomain.domains)
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
