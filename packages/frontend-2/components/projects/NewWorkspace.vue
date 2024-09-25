<template>
  <div class="rounded-lg border border-outline-3 bg-foundation-2">
    <div class="border-b border-outline-3 py-2 px-4">
      <p class="text-foreground text-heading-sm font-medium">Create new workspace</p>
    </div>
    <div class="py-4 px-4 flex flex-col gap-4 w-full">
      <FormTextInput
        v-model:model-value="workspaceName"
        name="name"
        label="Workspace name"
        placeholder="Name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        show-label
      />
      <FormTextInput
        v-model:model-value="workspaceDescription"
        name="description"
        label="Workspace description"
        placeholder="Description"
        :rules="[isStringOfLength({ maxLength: 512 })]"
        color="foundation"
        show-optional
        show-label
      />
      <div class="flex justify-end gap-x-2">
        <FormButton color="outline" @click="$emit('cancel')">Cancel</FormButton>
        <FormButton @click="handleCreateWorkspace">Create workspace</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import type { ProjectsNewWorkspace_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment ProjectsNewWorkspace_Workspace on Workspace {
    id
    name
    defaultLogoIndex
    logo
    description
  }
`)

type FormValues = { name: string; description: string }

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'workspace-created', v: ProjectsNewWorkspace_WorkspaceFragment): void
}>()

const props = defineProps<{
  mixpanelEventSource: string
}>()

const createWorkspace = useCreateWorkspace()
const { generateDefaultLogoIndex } = useWorkspacesAvatar()
const { handleSubmit } = useForm<FormValues>()

const workspaceName = ref<string>('')
const workspaceDescription = ref<string>('')
const workspaceLogo = ref<MaybeNullOrUndefined<string>>()

const handleCreateWorkspace = handleSubmit(async () => {
  const result = await createWorkspace(
    {
      name: workspaceName.value,
      description: workspaceDescription.value,
      defaultLogoIndex: generateDefaultLogoIndex(),
      logo: workspaceLogo.value
    },
    {
      navigateOnSuccess: false
    },
    {
      source: props.mixpanelEventSource
    }
  )

  if (result?.data?.workspaceMutations.create) {
    emit('workspace-created', result.data.workspaceMutations.create)
  }
})
</script>
