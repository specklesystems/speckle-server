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
        v-model="newModelName"
        name="name"
        label="Model Name"
        placeholder="model/name/here"
        help="Use forward slashes in the model name to nest it below other models."
        :custom-icon="CubeIcon"
        :rules="rules"
        :disabled="loading"
      />
      <div class="flex justify-end">
        <FormButton submit :disabled="loading">
          Create model and move versions
        </FormButton>
      </div>
    </div>
  </form>
</template>
<script setup lang="ts">
import { ProjectModelPageDialogMoveToVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useModelNameValidationRules } from '~~/lib/projects/composables/modelManagement'
import { CubeIcon } from '@heroicons/vue/24/solid'
import { useForm } from 'vee-validate'

defineProps<{
  projectId: string
  versions: ProjectModelPageDialogMoveToVersionFragment[]
}>()

const rules = useModelNameValidationRules()
const { handleSubmit } = useForm<{ name: string }>()

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  console.log(values)
})
</script>
