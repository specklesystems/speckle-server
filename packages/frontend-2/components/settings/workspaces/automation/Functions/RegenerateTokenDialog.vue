<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Regenerate token</template>
    <div class="flex flex-col gap-2 text-body-xs text-foreground mb-2">
      <div v-if="!newToken">
        <p>Are you sure you want to regenerate this function's token?</p>
        <p>
          Existing token(s) for
          <strong>{{ workspaceFunction.name }}</strong>
          will be
          <strong>permanently</strong>
          invalidated.
        </p>
      </div>
      <div v-else class="flex flex-col gap-4 text-foreground">
        <div class="flex flex-col gap-1">
          <h6 class="font-medium">Your new token:</h6>
          <div class="w-full">
            <CommonClipboardInputWithToast :value="newToken" />
          </div>
        </div>
        <div
          class="flex gap-4 items-center bg-foundation-2 border border-outline-3 rounded-lg p-3 text-foreground-2 mb-2"
        >
          <div class="max-w-md text-body-2xs">
            <p>
              <span class="font-medium">Note:</span>
              This is the first and last time you will be able to see the full token.
            </p>
            <p class="font-medium">Please copy paste it somewhere safe now.</p>
          </div>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { regenerateFunctionTokenMutation } from '~/lib/automate/graphql/mutations'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'

graphql(`
  fragment SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunction on AutomateFunction {
    id
    name
  }
`)

const props = defineProps<{
  workspaceFunction: SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunctionFragment
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: regenerateToken, loading } = useMutation(
  regenerateFunctionTokenMutation
)

const isOpen = defineModel<boolean>('open', { required: true })

const newToken = ref<string>()

const handleRegenerateToken = async () => {
  const result = await regenerateToken({
    functionId: props.workspaceFunction.id
  }).catch(convertThrowIntoFetchResult)

  const token = result?.data?.automateMutations.regenerateFunctionToken

  if (token) {
    newToken.value = token
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Token regenerated',
      description: 'A new token has been generated for your function.'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to regenerate token',
      description: errorMessage
    })
  }
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: (): boolean => (isOpen.value = false)
  },
  {
    text: 'Regenerate',
    props: { color: 'danger' },
    disabled: loading.value || !!newToken.value,
    onClick: handleRegenerateToken
  }
])

watch(isOpen, (open) => {
  if (!open) {
    newToken.value = undefined
  }
})
</script>
