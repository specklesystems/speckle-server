<template>
  <LayoutDialog
    v-model:open="openState"
    max-width="sm"
    hide-closer
    :buttons="dialogButtons"
  >
    <template #header>Create new model</template>
    <form @submit="onSubmit">
      <div class="flex flex-col space-y-6 mb-4">
        <FormTextInput
          v-model="newModelName"
          color="foundation"
          name="name"
          label="Model name"
          show-label
          placeholder="model/name/here"
          :custom-icon="CubeIcon"
          :rules="rules"
          :disabled="anyMutationsLoading"
          help="Use forward slashes in the model name to nest it below other models."
          autocomplete="off"
        />
        <FormTextArea
          v-model="newDescription"
          color="foundation"
          name="description"
          show-label
          show-optional
          label="Model description"
          placeholder="Description"
          size="lg"
          :disabled="anyMutationsLoading"
        />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CubeIcon } from '@heroicons/vue/24/outline'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { useForm } from 'vee-validate'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useCreateNewModel,
  useModelNameValidationRules
} from '~~/lib/projects/composables/modelManagement'
import { sanitizeModelName } from '~~/lib/projects/helpers/models'

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

const { handleSubmit } = useForm<{ name: string; description: string }>()
const anyMutationsLoading = useMutationLoading()
const rules = useModelNameValidationRules()
const createModel = useCreateNewModel()
const mp = useMixpanel()

const newModelName = ref('')
const newDescription = ref('')

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onSubmit = handleSubmit(async ({ name, description }) => {
  await createModel({
    name: sanitizeModelName(name),
    description,
    projectId: props.projectId
  })
  mp.track('Branch Action', { type: 'action', name: 'create', mode: 'dialog' })
  openState.value = false
})

watch(
  () => props.open,
  (isOpen, oldIsOpen) => {
    if (isOpen && isOpen !== oldIsOpen) {
      newModelName.value = props.parentModelName ? `${props.parentModelName}/` : ''
      newDescription.value = ''
    }
  }
)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      openState.value = false
    }
  },
  {
    text: 'Create',
    props: {},
    onClick: () => {
      onSubmit()
    },
    disabled: anyMutationsLoading.value
  }
])
</script>
