<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="General" text="Manage your workspace settings" />
      <SettingsSectionHeader title="Workspace details" subheading />
      <div class="pt-4">
        <div class="pt-6 md:pt-0">
          <FormTextInput
            v-model="name"
            color="foundation"
            label="Name"
            name="name"
            placeholder="Example Ltd."
            show-label
            :disabled="!isAdmin"
            :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
            validate-on-value-update
            @change="save()"
          />
          <hr class="mt-4 mb-2" />
          <FormTextInput
            v-model="description"
            color="foundation"
            label="Description"
            name="description"
            placeholder="This is your workspace"
            show-label
            :disabled="!isAdmin"
            :rules="[isStringOfLength({ maxLength: 512 })]"
            @change="save()"
          />
        </div>
      </div>
      <hr class="my-6 md:my-10" />
      <div class="flex flex-col space-y-6">
        <SettingsSectionHeader title="Delete workspace" subheading />
        <div
          class="rounded border bg-foundation border-outline-3 text-body-xs text-foreground py-4 px-6"
        >
          We will delete all content of this workspace, and any associated data. We will
          ask you to type in your workspace name and press the delete button.
        </div>
        <div>
          <FormButton :disabled="!isAdmin" color="danger" @click="openDeleteDialog">
            Delete workspace
          </FormButton>
        </div>
      </div>
    </div>
    <SettingsWorkspacesGeneralDeleteDialog
      v-if="workspaceResult"
      v-model:open="showDeleteDialog"
      :workspace="workspaceResult.workspace"
    />
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useForm } from 'vee-validate'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { Roles } from '@speckle/shared'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { settingsUpdateWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import { settingsWorkspaceGeneralQuery } from '~/lib/settings/graphql/queries'
import type { WorkspaceUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

graphql(`
  fragment SettingsWorkspacesGeneral_Workspace on Workspace {
    ...SettingsWorkspaceGeneralDeleteDialog_Workspace
    logo
    description
  }
`)

type FormValues = { name: string; description: string }

const props = defineProps<{
  workspaceId: string
}>()

const { activeUser: user } = useActiveUser()
const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsUpdateWorkspaceMutation)
const { result: workspaceResult } = useQuery(settingsWorkspaceGeneralQuery, () => ({
  id: props.workspaceId
}))

const name = ref('')
const description = ref('')
const showDeleteDialog = ref(false)

const isAdmin = computed(() => user.value?.role === Roles.Server.Admin)

const save = handleSubmit(async () => {
  if (!workspaceResult.value?.workspace) return

  const input: WorkspaceUpdateInput = {
    id: workspaceResult.value.workspace.id
  }
  if (name.value !== workspaceResult.value.workspace.name) input.name = name.value
  if (description.value !== workspaceResult.value.workspace.description)
    input.description = description.value

  const result = await updateMutation({ input }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace updated'
    })
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Workspace update failed',
      description: errorMessage
    })
  }
})

function openDeleteDialog() {
  showDeleteDialog.value = true
}

watch(
  () => workspaceResult,
  () => {
    if (workspaceResult.value?.workspace) {
      name.value = workspaceResult.value.workspace.name
      description.value = workspaceResult.value.workspace.description ?? ''
    }
  },
  { deep: true, immediate: true }
)
</script>
