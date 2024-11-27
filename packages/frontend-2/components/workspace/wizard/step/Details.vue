<template>
  <WorkspaceWizardStep
    title="Create a workspace"
    description="Fill in some details for your teammates."
  >
    <form class="flex flex-col gap-4 w-full md:w-96" @submit="onSubmit">
      <FormTextInput
        v-model:model-value="name"
        name="name"
        label="Workspace name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        show-label
        auto-focus
        size="lg"
        @update:model-value="updateShortId"
      />
      <FormTextInput
        v-model:model-value="slug"
        name="slug"
        label="Short ID"
        :help="getShortIdHelp"
        color="foundation"
        :loading="loading"
        :rules="isStringOfLength({ maxLength: 50, minLength: 3 })"
        :custom-error-message="error?.graphQLErrors[0]?.message"
        show-label
        size="lg"
        @update:model-value="onSlugChange"
      />
      <FormButton size="lg" submit full-width class="mt-4">Continue</FormButton>
    </form>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { generateSlugFromName } from '@speckle/shared'
import { debounce } from 'lodash'
import { useQuery } from '@vue/apollo-composable'
import { validateWorkspaceSlugQuery } from '~/lib/workspaces/graphql/queries'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

const { handleSubmit } = useForm<{ name: string; slug: string }>()
const { input, goToNextStep } = useWorkspacesWizard()

const { name, slug } = toRefs(input.value)
const shortIdManuallyEdited = ref(false)

const { error, loading } = useQuery(
  validateWorkspaceSlugQuery,
  () => ({
    slug: slug.value
  }),
  () => ({
    enabled: !!slug.value
  })
)

const baseUrl = useRuntimeConfig().public.baseUrl

const getShortIdHelp = computed(() =>
  slug.value
    ? `${baseUrl}/workspaces/${slug.value}`
    : `Used after ${baseUrl}/workspaces/`
)

const updateShortId = debounce((newName: string) => {
  if (!shortIdManuallyEdited.value) {
    const newSlug = generateSlugFromName({ name: newName })
    slug.value = newSlug
    updateDebouncedShortId(newSlug)
  }
}, 600)

const updateDebouncedShortId = debounce((newSlug: string) => {
  slug.value = newSlug
}, 300)

const onSlugChange = (newSlug: string) => {
  slug.value = newSlug
  shortIdManuallyEdited.value = true
  updateDebouncedShortId(newSlug)
}

const onSubmit = handleSubmit(() => {
  goToNextStep()
})
</script>
