<template>
  <div class="flex flex-col gap-6">
    <FormSelectProjects
      v-if="!preselectedProject"
      v-model="project"
      label="Speckle project"
      show-label
      help="Choose the project where your target model is located"
      show-required
      mount-menu-on-body
      :rules="projectRules"
      :allow-unset="false"
      validate-on-value-update
      owned-only
    />
    <FormSelectModels
      v-if="project?.id"
      v-model="model"
      :project-id="project.id"
      label="Model"
      show-label
      :help="selectModelHelpText"
      show-required
      mount-menu-on-body
      :rules="modelRules"
      :allow-unset="false"
      validate-on-value-update
    />
    <FormTextInput
      v-model="automationName"
      name="automationName"
      label="Automation name"
      color="foundation"
      show-label
      help="Give your automation a name"
      placeholder="Name"
      :rules="nameRules"
      show-required
      validate-on-value-update
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
  isTestAutomation: boolean
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

const selectModelHelpText = computed(() => {
  return props.isTestAutomation
    ? 'Local function executions will be provided the latest version of this model'
    : 'The model that should trigger this automation'
})

watch(
  () => props.preselectedProject,
  (newVal) => {
    if (newVal) {
      project.value = newVal
    }
  },
  { immediate: true }
)

watch(project, (newVal, oldVal) => {
  if (model.value && newVal && newVal.id !== oldVal?.id) {
    model.value = undefined
  }
})
</script>
