<template>
  <form @submit="onSubmit">
    <div class="flex flex-col space-y-4">
      <div class="">
        Please select the target branch to move
        <template v-if="versions.length > 1">all of the selected versions</template>
        <template v-else-if="versions.length">
          the selected version
          <span class="font-bold">"{{ versions[0].message || 'no message' }}"</span>
        </template>
        to.
      </div>
      <CommonModelSelect
        :project-id="projectId"
        name="model"
        label="Target model"
        :rules="[isRequired]"
      />
      <div class="flex justify-end">
        <FormButton submit>Move</FormButton>
      </div>
    </div>
  </form>
</template>
<script setup lang="ts">
import { Optional } from '@speckle/shared'
import {
  CommonModelSelectorModelFragment,
  ProjectModelPageDialogMoveToVersionFragment
} from '~~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import { isRequired } from '~~/lib/common/helpers/validation'

defineProps<{
  projectId: string
  versions: ProjectModelPageDialogMoveToVersionFragment[]
}>()

const { handleSubmit } = useForm<{
  model: Optional<CommonModelSelectorModelFragment>
}>()

const onSubmit = handleSubmit(async (values) => {
  console.log(values)
})
</script>
