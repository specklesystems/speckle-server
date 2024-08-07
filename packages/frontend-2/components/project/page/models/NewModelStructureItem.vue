<template>
  <div>
    <button
      v-show="!showNewModelCard"
      class="group flex rounded-md items-center text-primary text-xs px-2 py-1 transition hover:bg-foundation-focus dark:hover:bg-primary-muted"
      @click="showNewModelCard = true"
    >
      +
      <span class="font-medium ml-1">New</span>
    </button>
    <div
      v-if="showNewModelCard"
      class="w-full p-2 flex items-center rounded-md transition bg-foundation-2 border border-outline-3"
    >
      <form
        class="flex items-center justify-between w-full space-x-2"
        @submit="onSubmit"
      >
        <div class="flex-grow">
          <FormTextInput
            v-model="name"
            name="name"
            label="Model name"
            placeholder="Model name"
            auto-focus
            color="foundation"
            :rules="rules"
            :disabled="anyMutationsLoading"
            autocomplete="off"
          />
        </div>
        <div class="flex flex-wrap gap-1 sm:gap-2">
          <FormButton submit :disabled="anyMutationsLoading">Save</FormButton>
          <FormButton color="outline" @click="showNewModelCard = false">
            Cancel
          </FormButton>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { useMutationLoading } from '@vue/apollo-composable'
import {
  useCreateNewModel,
  useModelNameValidationRules
} from '~~/lib/projects/composables/modelManagement'
import { trim } from 'lodash-es'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { sanitizeModelName } from '~/lib/projects/helpers/models'

const props = defineProps<{
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

const onSubmit = handleSubmit(async (formValues) => {
  await createModel({
    name: createFinalName(formValues.name),
    projectId: props.projectId,
    description: ''
  })
  mp.track('Branch Action', { type: 'action', name: 'create', mode: 'nested' })
  showNewModelCard.value = false
  name.value = ''
})

const showNewModelCard = ref(false)
const name = ref('')

const createFinalName = (name: string) => {
  const userEnteredName = sanitizeModelName(trim(name, '/'))
  const prefix = trim(props.parentModelName || '', '/')
  return (prefix ? `${prefix}/` : '') + userEnteredName
}
</script>
