<template>
  <LayoutDialog v-model:open="isOpen" max-width="lg">
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="h4 font-bold mb-4">Rename model</div>
      <div class="flex flex-col space-y-3 mb-6">
        <FormTextInput
          v-model="newName"
          name="name"
          label="Model name"
          placeholder="Model name"
          size="lg"
          :rules="rules"
          show-required
          auto-focus
          :disabled="loading"
        />
      </div>
      <div class="flex justify-end">
        <FormButton submit :disabled="loading">Save</FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Get } from 'type-fest'
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import {
  ProjectPageModelsCardRenameDialogFragment,
  UpdateModelMutation
} from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useModelNameValidationRules,
  useUpdateModel
} from '~~/lib/projects/composables/modelManagement'

graphql(`
  fragment ProjectPageModelsCardRenameDialog on Model {
    id
    name
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

const { handleSubmit } = useForm<{ name: string }>()
const rules = useModelNameValidationRules()
const updateModel = useUpdateModel()

const newName = ref(props.model.name)
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
    name: vals.name,
    projectId: props.projectId
  }).finally(() => (loading.value = false))
  isOpen.value = false
  mp.track('Branch Action', { type: 'action', name: 'edit' })

  if (updatedModel) emit('updated', updatedModel)
})

watch(
  () => [props.open, props.model.name],
  () => (newName.value = props.model.name)
)
</script>
