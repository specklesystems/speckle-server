<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <LayoutMenu
      v-model:open="showActionsMenu"
      menu-id="workspaceOptions"
      :items="actionsItems"
      :menu-position="HorizontalDirection.Left"
      @click.stop.prevent
    >
      <FormButton
        color="subtle"
        hide-text
        :icon-right="EllipsisHorizontalIcon"
        class="!text-foreground-2"
        @click="onButtonClick"
      ></FormButton>
    </LayoutMenu>
  </div>
</template>
<script setup lang="ts">
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { HorizontalDirection } from '~~/lib/common/composables/window'

const showActionsMenu = ref(false)

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      title: 'Edit...',
      id: 'rename'
    },
    { title: 'Copy link', id: 'copy' }
  ],
  [
    {
      title: 'Delete...',
      id: 'delete'
    }
  ]
])

const onButtonClick = () => {
  showActionsMenu.value = !showActionsMenu.value
}
</script>
