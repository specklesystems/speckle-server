<template>
  <div>
    <LayoutTable
      :items="items"
      :columns="[
        { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
        { id: 'key', header: 'Key', classes: 'col-span-2 truncate' },
        { id: 'description', header: 'Description', classes: 'col-span-6 truncate' },
        { id: 'actions', header: '', classes: 'col-span-1' }
      ]"
    >
      <template #name="{ item }">
        {{ item.name }}
      </template>
      <template #key="{ item }">
        <span class="text-foreground-2">{{ item.key }}</span>
      </template>
      <template #description="{ item }">
        <span class="text-foreground-2">{{ item.description }}</span>
      </template>
      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            @click.stop="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>
  </div>
</template>
<script setup lang="ts">
import type { LayoutMenuItem } from '@speckle/ui-components'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/vue/24/outline'

enum ActionTypes {
  Edit = 'edit'
}

const items = ref([
  { name: 'Europe', key: 'eu-1', description: 'Lorem ipsum baby', id: 'eu-1' },
  { name: 'Asia', key: 'as-1', description: '', id: 'as-1' }
])

const showActionsMenu = ref<Record<string, boolean>>({})
const actionItems: LayoutMenuItem[][] = [
  [{ title: 'Edit region', id: ActionTypes.Edit }]
]

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}
</script>
