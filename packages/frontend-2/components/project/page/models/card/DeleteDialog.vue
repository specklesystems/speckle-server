<template>
  <LayoutDialog
    v-model:open="isOpen"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'outline' },
        onClick: () => {
          isOpen = false
        }
      },
      {
        text: 'Delete',
        props: { color: 'danger', disabled: loading },
        onClick: () => {
          onDelete()
        }
      }
    ]"
    max-width="sm"
  >
    <template #header>Delete model</template>
    <div class="flex flex-col text-foreground">
      <p class="mb-2">
        Are you sure you want to delete the model
        <span class="inline font-medium">{{ model.name }}</span>
        ?
      </p>
      <p>
        This action is irreversible and all of the versions inside of this model will be
        deleted.
      </p>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageModelsCardDeleteDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useDeleteModel } from '~~/lib/projects/composables/modelManagement'

graphql(`
  fragment ProjectPageModelsCardDeleteDialog on Model {
    id
    name
  }
`)

const emit = defineEmits<{
  (e: 'deleted'): void
}>()

const props = defineProps<{
  projectId: string
  model: ProjectPageModelsCardDeleteDialogFragment
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const deleteModel = useDeleteModel()

const loading = ref(false)

const mp = useMixpanel()

const onDelete = async () => {
  loading.value = true
  const deleted = await deleteModel({
    id: props.model.id,
    projectId: props.projectId
  }).finally(() => (loading.value = false))
  isOpen.value = false
  mp.track('Branch Action', { type: 'action', name: 'delete' })

  if (deleted) emit('deleted')
}
</script>
