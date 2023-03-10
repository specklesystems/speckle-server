<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-4">
      <div class="">
        Create a new model to which
        <template v-if="versions.length > 1">all of the selected versions</template>
        <template v-else-if="versions.length">
          the selected version
          <span class="font-bold">"{{ versions[0].message || 'no message' }}"</span>
        </template>
        will be moved to.
      </div>
      <FormTextInput
        name="name"
        label="Model Name"
        placeholder="model/name/here"
        help="Use forward slashes in the model name to nest it below other models."
        :custom-icon="CubeIcon"
        :rules="rules"
        :disabled="disabled"
      />
      <div class="flex justify-end">
        <FormButton submit :disabled="disabled">Move</FormButton>
      </div>
    </div>
  </form>
</template>
<script setup lang="ts">
import { ProjectModelPageDialogMoveToVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useModelNameValidationRules } from '~~/lib/projects/composables/modelManagement'
import { CubeIcon } from '@heroicons/vue/24/solid'
import { useForm } from 'vee-validate'

const emit = defineEmits<{
  (e: 'model-selected', val: string): void
}>()

defineProps<{
  projectId: string
  versions: ProjectModelPageDialogMoveToVersionFragment[]
  disabled?: boolean
}>()

const rules = useModelNameValidationRules()
const { handleSubmit } = useForm<{ name: string }>()

const onSubmit = handleSubmit((values) => {
  emit('model-selected', values.name)
})
</script>
