<template>
  <form @submit="onSubmit">
    <div class="flex flex-col gap-y-4">
      <div class="">
        Please select the target branch to move
        <template v-if="versions.length > 1">all of the selected versions</template>
        <template v-else-if="versions.length">
          the selected version
          <span class="font-medium">"{{ versions[0].message || 'no message' }}"</span>
        </template>
        to.
      </div>
      <CommonModelSelect
        :project-id="projectId"
        name="model"
        label="Target model"
        :rules="[isRequired]"
        :disabled="disabled"
        mount-menu-on-body
        :excluded-ids="modelId ? [modelId] : undefined"
      />
      <div class="flex justify-end">
        <FormButton submit :disabled="disabled">Move</FormButton>
      </div>
    </div>
  </form>
</template>
<script setup lang="ts">
import type {
  CommonModelSelectorModelFragment,
  ProjectModelPageDialogMoveToVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import { isRequired } from '~~/lib/common/helpers/validation'

const emit = defineEmits<{
  (e: 'model-selected', val: string): void
}>()

defineProps<{
  projectId: string
  versions: ProjectModelPageDialogMoveToVersionFragment[]
  disabled?: boolean
  modelId?: string
}>()

const { handleSubmit } = useForm<{
  model: CommonModelSelectorModelFragment
}>()

const onSubmit = handleSubmit((values) => {
  emit('model-selected', values.model.name)
})
</script>
