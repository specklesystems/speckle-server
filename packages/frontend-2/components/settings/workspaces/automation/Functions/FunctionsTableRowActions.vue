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
  </LayoutMenu>
</template>

<script setup lang="ts">
import { HorizontalDirection, type LayoutMenuItem } from '@speckle/ui-components'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { AutomateFunctionPermissionChecks } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  permissions: AutomateFunctionPermissionChecks
}>()

const isOpen = defineModel<boolean>('open', { default: false })

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
      break
    }
  }
}
</script>
