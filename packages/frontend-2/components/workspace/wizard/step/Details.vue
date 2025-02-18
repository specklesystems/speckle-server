<template>
  <WorkspaceWizardStep
    title="Create a workspace"
    description="Workspaces are environments where you can safely collaborate with your team and manage guests."
  >
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
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  disableSlugEdit: boolean
}>()

const mixpanel = useMixpanel()
const { handleSubmit } = useForm<{ name: string; slug: string }>()
const { goToNextStep, state } = useWorkspacesWizard()

const { error, loading } = useQuery(
  validateWorkspaceSlugQuery,
  () => ({
    slug: state.value.slug
  }),
  () => ({
    enabled: !!state.value.slug && !props.disableSlugEdit
  })
)

const shortIdManuallyEdited = ref(false)
const baseUrl = useRuntimeConfig().public.baseUrl

const getShortIdHelp = computed(
  () => `Preview: ${baseUrl}/workspaces/${state.value.slug}`
)
const disableContinue = computed(
  () =>
    !state.value.name || !state.value.slug || !!error.value?.graphQLErrors[0]?.message
)

const updateShortId = debounce((newName: string) => {
  if (!shortIdManuallyEdited.value) {
    const newSlug = generateSlugFromName({ name: newName })
    state.value.slug = newSlug
    updateDebouncedShortId(newSlug)
  }
}, 600)

const updateDebouncedShortId = debounce((newSlug: string) => {
  state.value.slug = newSlug
}, 300)

const onSlugChange = (newSlug: string) => {
  state.value.slug = newSlug
  shortIdManuallyEdited.value = true
  updateDebouncedShortId(newSlug)
}

const onSubmit = handleSubmit(() => {
  mixpanel.track('Workspace Details Step Completed', {
    name: state.value.name,
    slug: state.value.slug
  })

  goToNextStep()
})

onMounted(() => {
  mixpanel.track('Workspace Details Step Viewed')
})
</script>
