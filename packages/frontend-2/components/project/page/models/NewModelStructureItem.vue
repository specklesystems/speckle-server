<template>
  <div>
    <button
      v-show="!showNewModelCard"
      class="group flex w-full rounded-md items-center text-primary text-xs px-2 py-1 transition hover:bg-foundation-focus dark:hover:bg-primary-muted"
      @click="showNewModelCard = true"
    >
      +
      <span class="font-bold ml-1">NEW</span>
    </button>
    <div
      v-if="showNewModelCard"
      class="w-full py-2 h-14 px-3 flex items-center rounded-md transition bg-foundation-focus dark:bg-primary-muted"
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
            placeholder="name"
            auto-focus
            :rules="rules"
            :disabled="anyMutationsLoading"
          />
        </div>
        <div class="space-x-2">
          <FormButton submit :disabled="anyMutationsLoading">Save</FormButton>
          <FormButton outlined color="danger" @click="showNewModelCard = false">
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
    projectId: props.projectId
  })
  mp.track('Branch Action', { type: 'action', name: 'create', mode: 'nested' })
  showNewModelCard.value = false
  name.value = ''
})

const showNewModelCard = ref(false)
const name = ref('')

const createFinalName = (name: string) => {
  const userEnteredName = trim(name, '/')
  const prefix = trim(props.parentModelName || '', '/')
  return (prefix ? `${prefix}/` : '') + userEnteredName
}
</script>
