<template>
  <div class="flex flex-col gap-2">
    <FormSelectProjects
      v-if="!preselectedProject"
      v-model="project"
      label="Speckle Project"
      show-label
      help="Choose the project where your target model is located."
      show-required
      button-style="tinted"
      mount-menu-on-body
      :rules="projectRules"
      :allow-unset="false"
    />
    <FormSelectModels
      v-if="project?.id"
      v-model="model"
      :project-id="project.id"
      label="Speckle Model"
      show-label
      help="Choose the model you want to run your automation on."
      show-required
      button-style="tinted"
      mount-menu-on-body
      :rules="modelRules"
      :allow-unset="false"
    />
    <FormTextInput
      v-model="automationName"
      name="automationName"
      label="Name"
      show-label
      help="Give your automation a name."
      placeholder="Automation Name"
      :rules="nameRules"
      show-required
    />
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { FormTextInput, ValidationHelpers } from '@speckle/ui-components'
import type {
  FormSelectModels_ModelFragment,
  FormSelectProjects_ProjectFragment
} from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  preselectedProject?: Optional<FormSelectProjects_ProjectFragment>
}>()
const project = defineModel<Optional<FormSelectProjects_ProjectFragment>>('project', {
  required: true
})
const model = defineModel<Optional<FormSelectModels_ModelFragment>>('model', {
  required: true
})
const automationName = defineModel<Optional<string>>('automationName', {
  required: true
})

const projectRules = computed(() => [ValidationHelpers.isRequired])
const modelRules = projectRules
const nameRules = computed(() => [
  ValidationHelpers.isRequired,
  ValidationHelpers.isStringOfLength({ maxLength: 150 })
])

watch(
  () => props.preselectedProject,
  (newVal) => {
    if (newVal) {
      project.value = newVal
    }
  },
  { immediate: true }
)
</script>
