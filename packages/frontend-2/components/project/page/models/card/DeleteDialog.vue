<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div class="flex flex-col text-foreground">
      <div class="h4 font-bold mb-4">Delete model</div>
      <p class="mb-6">
        Are you sure you want to delete the model
        <span class="inline font-bold">{{ model.name }}</span>
        ? This action is irreversible and all of the versions inside of this model will
        be deleted also!
      </p>
      <div class="flex justify-end">
        <FormButton submit :disabled="loading" color="danger" @click="onDelete">
          Delete
        </FormButton>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageModelsCardDeleteDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useDeleteModel } from '~~/lib/projects/composables/modelManagement'

graphql(`
  fragment ProjectPageModelsCardDeleteDialog on Model {
    id
    name
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'deleted'): void
}>()

const props = defineProps<{
  open: boolean
  projectId: string
  model: ProjectPageModelsCardDeleteDialogFragment
}>()

const deleteModel = useDeleteModel()

const loading = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onDelete = async () => {
  loading.value = true
  const deleted = await deleteModel({
    id: props.model.id,
    projectId: props.projectId
  }).finally(() => (loading.value = false))
  isOpen.value = false

  if (deleted) emit('deleted')
}
</script>
