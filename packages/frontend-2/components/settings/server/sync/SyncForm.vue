<template>
  <form class="flex flex-col gap-6" @submit="onSubmit">
    <FormTextInput
      v-model="versionUrl"
      label="Version URL"
      name="versionUrl"
      color="foundation"
      placeholder="https://app.speckle.systems/projects/abc123/models/def456@789"
      show-label
      label-position="left"
      :rules="versionUrlRules"
      type="url"
      help="Enter the full URL of the version you want to sync from an external Speckle server"
    />

    <FormTextInput
      v-model="authToken"
      label="Authentication Token (Optional)"
      name="authToken"
      color="foundation"
      placeholder="Enter your authentication token"
      show-label
      label-position="left"
      type="password"
      help="Enter the authentication token for accessing the external Speckle server. Only needed if the data is behind authentication."
    />

    <hr class="border-outline-3" />

    <FormSelectProjects
      v-model="project"
      label="Target Project"
      show-label
      name="targetProject"
      help="Select the local project where the version should be synced. Optionally select a specific model."
      :allow-unset="true"
    />

    <FormSelectModels
      v-if="project?.id"
      v-model="model"
      :project-id="project.id"
      label="Target Model (Optional)"
      show-label
      name="targetModel"
      help="Optionally select a specific model within the project to sync the version to."
      :allow-unset="true"
    />

    <div class="flex gap-2 mt-4">
      <FormButton type="submit" color="primary">Sync Version</FormButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isRequired, isUrl } from '~~/lib/common/helpers/validation'
import type {
  FormSelectProjects_ProjectFragment,
  FormSelectModels_ModelFragment
} from '~/lib/common/generated/gql/graphql'

const { handleSubmit } = useForm()

// Form fields
const versionUrl = ref('')
const authToken = ref('')
const project = ref<FormSelectProjects_ProjectFragment>()
const model = ref<FormSelectModels_ModelFragment>()

// Validation rules
const versionUrlRules = [isRequired, isUrl]

const onSubmit = handleSubmit(() => {
  // TODO:
})

// Clear model when project changes
watch(project, () => {
  model.value = undefined
})
</script>
