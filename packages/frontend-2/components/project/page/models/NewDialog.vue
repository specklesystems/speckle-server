<template>
  <LayoutDialog v-model:open="openState" max-width="md" hide-closer>
    <form @submit="onSubmit">
      <div class="flex flex-col space-y-4">
        <h1 class="h4 font-bold text-foreground">Create new model</h1>
        <FormTextInput
          v-model="newModelName"
          name="name"
          label="Model Name"
          placeholder="model/name/here"
          :custom-icon="CubeIcon"
          :rules="rules"
          :disabled="anyMutationsLoading"
        />
        <p class="text-foreground-2 label label--light">
          Use forward slashes in the model name to nest it below other models.
        </p>
        <div class="grow flex justify-end">
          <FormButton text @click="openState = false">Cancel</FormButton>
          <FormButton submit :disabled="anyMutationsLoading">Create</FormButton>
        </div>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/solid'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useCreateNewModel,
  useModelNameValidationRules
} from '~~/lib/projects/composables/modelManagement'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  projectId: string
  /**
   * If creating a nested model, specify the prefix of the parent model here as it will be prefixed
   * to whatever the user enters.
   * E.g. if creating a model under "a/b", then put "a/b" here
   */
  parentModelName?: string
}>()

const { handleSubmit } = useForm<{ name: string }>()
const anyMutationsLoading = useMutationLoading()
const rules = useModelNameValidationRules()
const createModel = useCreateNewModel()
const mp = useMixpanel()

const newModelName = ref('')

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onSubmit = handleSubmit(async ({ name }) => {
  await createModel({ name, projectId: props.projectId })
  mp.track('Branch Action', { type: 'action', name: 'create', mode: 'dialog' })
  openState.value = false
})

watch(
  () => props.open,
  (isOpen, oldIsOpen) => {
    if (isOpen && isOpen !== oldIsOpen) {
      newModelName.value = props.parentModelName ? `${props.parentModelName}/` : ''
    }
  }
)
</script>
