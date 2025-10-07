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
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsProjectIntegrationsActionsMenu_AccSyncItemFragment } from '~/lib/common/generated/gql/graphql'
import { useDeleteAccSyncItem } from '~/lib/acc/composables/useDeleteAccSyncItem'
import { useUpdateAccSyncItem } from '~/lib/acc/composables/useUpdateAccSyncItem'

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

const updateAccSyncItem = useUpdateAccSyncItem()

const handleStatusSyncItem = async (id: string) => {
  await updateAccSyncItem(projectId.value, id, isPaused.value ? 'pending' : 'paused')
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
