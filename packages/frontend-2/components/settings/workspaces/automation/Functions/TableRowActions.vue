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
      :icon-right="isOpen ? X : Ellipsis"
      @click.stop="isOpen = true"
    />
    <SettingsWorkspacesAutomationFunctionsRegenerateTokenDialog
      v-model:open="showRegenerateTokenDialog"
      :workspace-function="workspaceFunction"
    />
  </LayoutMenu>
</template>

<script setup lang="ts">
import type { LayoutMenuItem } from '@speckle/ui-components'
import { HorizontalDirection } from '@speckle/ui-components'
import { Ellipsis, X } from 'lucide-vue-next'
import type { SettingsWorkspacesAutomationTableRowActions_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment SettingsWorkspacesAutomationTableRowActions_AutomateFunction on AutomateFunction {
    id
    permissions {
      ...SettingsWorkspacesAutomationTableRowActions_AutomateFunctionPermissionChecks
    }
    ...SettingsWorkspacesAutomationRegenerateTokenDialog_AutomateFunction
  }
`)

graphql(`
  fragment SettingsWorkspacesAutomationTableRowActions_AutomateFunctionPermissionChecks on AutomateFunctionPermissionChecks {
    canRegenerateToken {
      ...FullPermissionCheckResult
    }
  }
`)

const props = defineProps<{
  workspaceFunction: SettingsWorkspacesAutomationTableRowActions_AutomateFunctionFragment
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const showRegenerateTokenDialog = ref(false)

enum ActionTypes {
  RegenerateToken = 'regenerate-token'
}

const actionItems = computed<LayoutMenuItem[][]>(() => {
  return [
    [
      {
        title: 'Regenerate token...',
        id: ActionTypes.RegenerateToken,
        disabled: !props.workspaceFunction.permissions.canRegenerateToken.authorized,
        disabledTooltip: props.workspaceFunction.permissions.canRegenerateToken.message
      }
    ]
  ]
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
