<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <LayoutMenu
      v-model:open="showActionsMenu"
      :items="actionsItems"
      @click.stop.prevent
    >
      <FormButton size="sm" text @click="showActionsMenu = !showActionsMenu">
        <EllipsisVerticalIcon class="w-4 h-4" />
      </FormButton>
    </LayoutMenu>
  </div>
</template>
<script setup lang="ts">
import { EllipsisVerticalIcon } from '@heroicons/vue/24/solid'
import { LayoutMenuItem } from '~~/lib/layout/helpers/components'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const showActionsMenu = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    { title: 'Rename', id: 'a' },
    { title: 'Delete', id: '2' }
  ],
  [{ title: 'Share', id: '3' }]
])
</script>
