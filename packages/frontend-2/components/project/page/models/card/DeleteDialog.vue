<template>
  <LayoutDialog
    v-model:open="isOpen"
    :buttons="[
      {
        text: 'Delete',
        props: { color: 'danger', fullWidth: true, disabled: loading },
        onClick: () => {
          onDelete()
        }
      },
      {
        text: 'Cancel',
        props: { color: 'secondary', fullWidth: true },
        onClick: () => {
          isOpen = false
        }
      }
    ]"
    max-width="sm"
  >
    <template #header>Delete Model</template>
    <div class="flex flex-col text-foreground">
      <p class="mb-2">
        Are you sure you want to delete the model
        <span class="inline font-bold">{{ model.name }}</span>
        ?
      </p>
      <p>
        This action is irreversible and all of the versions inside of this model will be
        deleted also!
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
