<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'outline' },
        onClick: () => {
          isOpen = false
        }
      },
      {
        text: 'Save',
        props: {},
        onClick: () => {
          onSubmit()
        }
      }
    ]"
  >
    <template #header>Edit model</template>
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="flex flex-col gap-4 mb-4">
        <FormTextInput
          v-model="newName"
          name="name"
          show-label
          label="Model name"
          placeholder="model/name/here"
          :rules="rules"
          auto-focus
          color="foundation"
          :disabled="loading"
          help="Use forward slashes in the model name to nest it below other models."
          autocomplete="off"
        />
        <FormTextArea
          v-model="newDescription"
          name="description"
          show-label
          label="Model description"
          show-optional
          placeholder="Description"
          color="foundation"
          :disabled="loading"
        />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { Get } from 'type-fest'
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectPageModelsCardRenameDialogFragment,
  UpdateModelMutation
} from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useModelNameValidationRules,
  useUpdateModel
} from '~~/lib/projects/composables/modelManagement'
import { sanitizeModelName } from '~~/lib/projects/helpers/models'

graphql(`
  fragment ProjectPageModelsCardRenameDialog on Model {
    id
    name
    description
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'updated', newModel: Get<UpdateModelMutation, 'modelMutations.update'>): void
}>()

const props = defineProps<{
  open: boolean
  model: ProjectPageModelsCardRenameDialogFragment
  projectId: string
}>()

const { handleSubmit } = useForm<{ name: string; description: string }>()
const rules = useModelNameValidationRules()
const updateModel = useUpdateModel()

const newName = ref(props.model.name)
const newDescription = ref(props.model.description || '')
const loading = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
const mp = useMixpanel()
const onSubmit = handleSubmit(async (vals) => {
  loading.value = true
  const updatedModel = await updateModel({
    id: props.model.id,
    name: sanitizeModelName(vals.name),
    description: vals.description,
    projectId: props.projectId
  }).finally(() => (loading.value = false))
  isOpen.value = false
  mp.track('Branch Action', { type: 'action', name: 'edit' })

  if (updatedModel) emit('updated', updatedModel)
})

watch(
  () => [props.open, props.model.name, props.model.description],
  () => {
    newName.value = props.model.name
    newDescription.value = props.model.description || ''
  }
)
</script>
