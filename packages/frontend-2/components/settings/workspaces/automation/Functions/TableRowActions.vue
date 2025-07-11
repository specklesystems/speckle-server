<template>
  <LayoutMenu
    v-model:open="isOpen"
    :items="actionItems"
    mount-menu-on-body
    :menu-position="HorizontalDirection.Left"
    @chosen="({ item }) => handleAction(item)"
  >
    <FormButton
      :color="isOpen ? 'outline' : 'subtle'"
      hide-text
      :icon-right="isOpen ? XMarkIcon : EllipsisHorizontalIcon"
      @click.stop="isOpen = true"
    />
    <SettingsWorkspacesAutomationFunctionsRegenerateTokenDialog
      v-model:open="showRegenerateTokenDialog"
      :workspace-function="workspaceFunction"
    />
  </LayoutMenu>
</template>

<script setup lang="ts">
import { HorizontalDirection, type LayoutMenuItem } from '@speckle/ui-components'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type {
  AutomateFunctionPermissionChecks,
  SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunctionFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  workspaceFunction: SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunctionFragment
  permissions: AutomateFunctionPermissionChecks
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const showRegenerateTokenDialog = ref(false)

enum ActionTypes {
  RegenerateToken = 'regenerate-token'
}

const actionItems = computed(() => {
  return [
    [
      {
        title: 'Regenerate token...',
        id: ActionTypes.RegenerateToken,
        disabled: !props.permissions.canRegenerateToken.authorized,
        disabledTooltip: props.permissions.canRegenerateToken.message
      }
    ]
  ] satisfies LayoutMenuItem[][]
})

const handleAction = (actionItem: LayoutMenuItem) => {
  switch (actionItem.id) {
    case ActionTypes.RegenerateToken: {
      showRegenerateTokenDialog.value = true
      break
    }
  }
}
</script>
