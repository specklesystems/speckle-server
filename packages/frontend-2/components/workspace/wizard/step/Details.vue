<template>
  <WorkspaceWizardStep title="Create a workspace" description="Start with a good name">
    <form class="flex flex-col gap-4 w-full md:w-96" @submit="onSubmit">
      <FormTextInput
        id="workspace-name"
        v-model:model-value="state.name"
        name="name"
        label="Workspace name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        show-label
        auto-focus
        size="lg"
        @update:model-value="updateShortId"
      />
      <div>
        <FormTextInput
          id="workspace-slug"
          v-model:model-value="state.slug"
          name="slug"
          label="Short ID"
          color="foundation"
          :loading="loading"
          :rules="isStringOfLength({ maxLength: 50, minLength: 3 })"
          :custom-error-message="error?.graphQLErrors[0]?.message"
          show-label
          size="lg"
          :disabled="disableSlugEdit"
          @update:model-value="onSlugChange"
        />
        <p class="text-body-2xs mt-1.5 text-foreground-2">
          {{ getShortIdHelp }}
        </p>
      </div>
      <FormButton size="lg" :disabled="disableContinue" submit full-width class="mt-4">
        Continue
      </FormButton>
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
import {
  useWorkspacesWizard,
  useWorkspaceWizardState
} from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  disableSlugEdit: boolean
}>()

const mixpanel = useMixpanel()
const { handleSubmit } = useForm<{ name: string; slug: string }>()
const { goToNextStep } = useWorkspacesWizard()
const wizardState = useWorkspaceWizardState()

const { error, loading } = useQuery(
  validateWorkspaceSlugQuery,
  () => ({
    slug: wizardState.value.state.slug
  }),
  () => ({
    enabled: !!wizardState.value.state.slug && !props.disableSlugEdit
  })
)

const shortIdManuallyEdited = ref(false)
const baseUrl = useRuntimeConfig().public.baseUrl

const getShortIdHelp = computed(
  () => `Preview: ${baseUrl}/workspaces/${wizardState.value.state.slug}`
)
const disableContinue = computed(
  () =>
    !wizardState.value.state.name ||
    !wizardState.value.state.slug ||
    !!error.value?.graphQLErrors[0]?.message
)

const updateShortId = debounce((newName: string) => {
  if (!shortIdManuallyEdited.value) {
    const newSlug = generateSlugFromName({ name: newName })
    wizardState.value.state.slug = newSlug
    updateDebouncedShortId(newSlug)
  }
}, 600)

const updateDebouncedShortId = debounce((newSlug: string) => {
  wizardState.value.state.slug = newSlug
}, 300)

const onSlugChange = (newSlug: string) => {
  wizardState.value.state.slug = newSlug
  shortIdManuallyEdited.value = true
  updateDebouncedShortId(newSlug)
}

const onSubmit = handleSubmit(() => {
  mixpanel.track('Workspace Details Step Completed', {
    name: wizardState.value.state.name,
    slug: wizardState.value.state.slug
  })

  goToNextStep()
})
</script>
