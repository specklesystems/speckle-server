<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="General" text="Manage your workspace settings" />
      <SettingsSectionHeader title="Workspace details" subheading />

      <div class="pt-6">
        <FormTextInput
          v-model="name"
          color="foundation"
          label="Name"
          name="name"
          placeholder="Workspace name"
          show-label
          :disabled="!isAdmin"
          label-position="left"
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          validate-on-value-update
          @change="save()"
        />
        <hr class="my-4 border-outline-3" />
        <FormTextInput
          v-model="description"
          color="foundation"
          label="Description"
          name="description"
          placeholder="Workspace description"
          show-label
          label-position="left"
          :disabled="!isAdmin"
          :rules="[isStringOfLength({ maxLength: 512 })]"
          @change="save()"
        />
        <hr class="my-4 border-outline-3" />
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col">
            <span class="text-body-xs font-medium text-foreground">Workspace logo</span>
            <span class="text-body-2xs text-foreground-2 max-w-[230px]">
              Upload your logo image or use one from our set of workspace icons.
            </span>
          </div>
          <SettingsWorkspacesGeneralEditAvatar
            v-if="workspaceResult?.workspace"
            :workspace="workspaceResult?.workspace"
            :disabled="!isAdmin"
            size="xxl"
          />
        </div>
      </div>
      <hr class="my-6 border-outline-2" />
      <div class="flex flex-col space-y-6">
        <SettingsSectionHeader title="Leave workspace" subheading />
        <CommonCard class="bg-foundation">
          By clicking the button below you will leave this workspace.
        </CommonCard>
        <div>
          <FormButton color="primary" @click="showLeaveDialog = true">
            Leave workspace
          </FormButton>
        </div>
      </div>
      <template v-if="isAdmin">
        <hr class="mb-6 mt-8 border-outline-2" />
        <div class="flex flex-col space-y-6">
          <SettingsSectionHeader title="Delete workspace" subheading />
          <CommonCard class="bg-foundation">
            We will delete all projects where you are the sole owner, and any associated
            data. We will ask you to type in your email address and press the delete
            button.
          </CommonCard>
          <div>
            <FormButton color="primary" @click="showDeleteDialog = true">
              Delete workspace
            </FormButton>
          </div>
        </div>
      </template>
    </div>

    <SettingsWorkspacesGeneralLeaveDialog
      v-if="workspaceResult"
      v-model:open="showLeaveDialog"
      :workspace="workspaceResult.workspace"
    />

    <SettingsWorkspacesGeneralDeleteDialog
      v-if="workspaceResult && isAdmin"
      v-model:open="showDeleteDialog"
      :workspace="workspaceResult.workspace"
    />
  </section>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useForm } from 'vee-validate'
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
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment SettingsWorkspacesGeneral_Workspace on Workspace {
    ...SettingsWorkspacesGeneralEditAvatar_Workspace
    ...SettingsWorkspaceGeneralDeleteDialog_Workspace
    id
    name
    description
    logo
    role
  }
`)

type FormValues = { name: string; description: string }

const props = defineProps<{
  workspaceId: string
}>()

const mixpanel = useMixpanel()
const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsUpdateWorkspaceMutation)
const { result: workspaceResult } = useQuery(settingsWorkspaceGeneralQuery, () => ({
  id: props.workspaceId
}))

const name = ref('')
const description = ref('')
const showDeleteDialog = ref(false)
const showLeaveDialog = ref(false)

const isAdmin = computed(
  () => workspaceResult.value?.workspace?.role === Roles.Workspace.Admin
)

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

    mixpanel.track('Workspace General Settings Updated', {
      fields: (Object.keys(input) as Array<keyof WorkspaceUpdateInput>).filter(
        (key) => key !== 'id'
      ),

      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
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
