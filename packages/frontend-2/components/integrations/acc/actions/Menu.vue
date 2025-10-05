<template>
  <div>
    <LayoutMenu
      v-model:open="showMenu"
      :items="actionItems"
      size="lg"
      mount-menu-on-body
      :menu-position="HorizontalDirection.Left"
      :menu-id="`acc-sync-items-${targetSyncItem.id}`"
      @chosen="({ item }) => onActionChosen(item.id)"
    >
      <FormButton
        :color="showMenu ? 'outline' : 'subtle'"
        hide-text
        :icon-right="showMenu ? XMarkIcon : EllipsisHorizontalIcon"
        @click="toggleMenu"
      />
    </LayoutMenu>
  </div>
</template>

<script setup lang="ts">
import { HorizontalDirection, type LayoutMenuItem } from '@speckle/ui-components'
import { useMutation } from '@vue/apollo-composable'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { accSyncItemUpdateMutation } from '~/lib/acc/graphql/mutations'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsProjectIntegrationsActionsMenu_AccSyncItemFragment } from '~/lib/common/generated/gql/graphql'
import { useDeleteAccSyncItem } from '~/lib/acc/composables/useDeleteAccSyncItem'

graphql(`
  fragment SettingsProjectIntegrationsActionsMenu_AccSyncItem on AccSyncItem {
    id
    status
    project {
      id
    }
  }
`)

const props = defineProps<{
  targetSyncItem: SettingsProjectIntegrationsActionsMenu_AccSyncItemFragment
}>()

const showMenu = ref(false)

const { triggerNotification } = useGlobalToast()

const projectId = computed(() => props.targetSyncItem.project.id)
const isPaused = computed(() => props.targetSyncItem.status === 'paused')

const actionItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: isPaused.value ? 'Trigger sync...' : 'Pause sync...',
      id: 'trigger'
    },
    {
      title: 'Delete sync...',
      id: 'delete'
    }
  ]
])

const deleteAccSyncItem = useDeleteAccSyncItem()

const handleDeleteSyncItem = async (id: string) => {
  await deleteAccSyncItem(projectId.value, id)
}

const { mutate: updateAccSyncItem } = useMutation(accSyncItemUpdateMutation)

const handleStatusSyncItem = async (id: string) => {
  try {
    await updateAccSyncItem({
      input: {
        projectId: projectId.value,
        id,
        status: isPaused.value ? 'pending' : 'paused'
      }
    })
  } catch (error) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Update sync item failed',
      description: error instanceof Error ? error.message : 'Unexpected error'
    })
  }
}

const onActionChosen = (actionItem: string) => {
  switch (actionItem) {
    case 'trigger': {
      handleStatusSyncItem(props.targetSyncItem.id)
      break
    }
    case 'delete': {
      handleDeleteSyncItem(props.targetSyncItem.id)
      break
    }
  }
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}
</script>
