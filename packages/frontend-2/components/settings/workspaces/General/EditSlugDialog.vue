<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Edit workspace short ID"
    max-width="sm"
    :buttons="dialogButtons"
    :on-submit="updateSlug"
  >
    <p class="text-body-xs text-foreground mb-2">
      Changing the workspace short ID has important implications.
    </p>
    <p class="text-body-xs text-foreground mb-2">
      All links generated using the old short ID will become invalid. This may break
      bookmarks or previously shared links.
    </p>
    <p class="text-body-xs text-foreground font-medium mb-2">
      Are you sure you want to proceed?
    </p>
    <FormTextInput
      v-model:model-value="workspaceShortId"
      name="slug"
      label="New short ID"
      :help="`${baseUrl}${workspaceRoute(workspaceShortId)}`"
      color="foundation"
      :rules="[isStringOfLength({ maxLength: 50, minLength: 3 })]"
      :custom-error-message="
        workspaceShortId !== originalSlug ? error?.graphQLErrors[0]?.message : undefined
      "
      :loading="loading"
      show-label
      @update:model-value="updateDebouncedShortId"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { SettingsWorkspacesGeneralEditSlugDialog_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { isStringOfLength } from '~~/lib/common/helpers/validation'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useQuery } from '@vue/apollo-composable'
import { validateWorkspaceSlugQuery } from '~/lib/workspaces/graphql/queries'
import { debounce } from 'lodash'

graphql(`
  fragment SettingsWorkspacesGeneralEditSlugDialog_Workspace on Workspace {
    id
    name
    slug
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesGeneralEditSlugDialog_WorkspaceFragment
  baseUrl: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  (e: 'update:slug', newSlug: string): void
}>()

// Main ref that holds the current value of the slug input.
const workspaceShortId = ref(props.workspace.slug)
// Used to debounce API calls for slug validation.
const debouncedWorkspaceShortId = ref(props.workspace.slug)
// Keeps track of the initially generated slug to prevent unnecessary validations.
const originalSlug = ref(props.workspace.slug)

const { error, loading } = useQuery(
  validateWorkspaceSlugQuery,
  () => ({
    slug: debouncedWorkspaceShortId.value
  }),
  () => ({
    enabled: debouncedWorkspaceShortId.value !== props.workspace.slug
  })
)

const { handleSubmit, resetForm } = useForm<{ slug: string }>()

const updateSlug = handleSubmit(() => {
  emit('update:slug', workspaceShortId.value)
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Update',
    props: {
      color: 'primary',
      disabled: workspaceShortId.value === props.workspace.slug || error.value !== null
    },
    submit: true
  }
])

const updateDebouncedShortId = debounce((value: string) => {
  debouncedWorkspaceShortId.value = value
}, 300)

watch(
  () => props.workspace.slug,
  (newValue) => {
    workspaceShortId.value = newValue
  },
  { immediate: true }
)

watch(
  () => isOpen.value,
  (newValue) => {
    if (!newValue) {
      resetForm()
      error.value = null
    }
  }
)
</script>
