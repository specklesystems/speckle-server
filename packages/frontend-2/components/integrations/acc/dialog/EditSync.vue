<template>
  <LayoutDialog v-model:open="open" max-width="sm" title="Configure ACC Sync">
    <div class="mb-4">
      {{ syncItem.model?.name }} is linked with {{ syncItem.accFileName }}
    </div>
    <FormButton color="danger" @click="handleDelete">Delete Sync</FormButton>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useDeleteAccSyncItem } from '~/lib/acc/composables/useDeleteAccSyncItem'
import { graphql } from '~/lib/common/generated/gql'
import type { IntegrationsAccEditSyncDialog_AccSyncItemFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment IntegrationsAccEditSyncDialog_AccSyncItem on AccSyncItem {
    id
    model {
      id
      name
    }
    project {
      id
    }
    accFileName
    accFileViewName
    accFileVersionIndex
    updatedAt
  }
`)

const props = defineProps<{
  syncItem: IntegrationsAccEditSyncDialog_AccSyncItemFragment
}>()

const open = defineModel<boolean>('open', { required: true })

const deleteAccSyncItem = useDeleteAccSyncItem()

const handleDelete = async () => {
  await deleteAccSyncItem(props.syncItem.project.id, props.syncItem.id)
  open.value = false
}
</script>
