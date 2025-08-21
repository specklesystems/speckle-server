<template>
  <LayoutDialog
    v-model:open="open"
    title="Delete view"
    max-width="sm"
    :buttons="buttons"
  >
    <!-- prettier-ignore -->
    <p>
      Are you sure you want to delete the view <span class="font-bold">{{ viewName }}</span>?
      <br/>This action is irreversible.
    </p>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment } from '~/lib/common/generated/gql/graphql'
import { useDeleteSavedView } from '~/lib/viewer/composables/savedViews/management'

graphql(`
  fragment ViewerSavedViewsPanelViewDeleteDialog_SavedView on SavedView {
    id
    name
    ...UseDeleteSavedView_SavedView
  }
`)

const emit = defineEmits<{
  success: [viewId: string]
}>()

const props = defineProps<{
  view: ViewerSavedViewsPanelViewDeleteDialog_SavedViewFragment | undefined
}>()

const open = defineModel<boolean>('open', {
  required: true
})
const deleteView = useDeleteSavedView()

const viewName = computed(() => props.view?.name)

const buttons = computed((): LayoutDialogButton[] => [
  {
    id: 'cancel',
    text: 'Cancel',
    props: {
      color: 'outline'
    },
    onClick: () => {
      open.value = false
    }
  },
  {
    id: 'delete',
    text: 'Delete',
    props: {
      color: 'danger'
    },
    onClick: async () => {
      if (!props.view) return
      const viewId = props.view.id

      const deleted = await deleteView({ view: props.view })
      if (deleted) {
        emit('success', viewId)
        open.value = false
      }
    }
  }
])
</script>
