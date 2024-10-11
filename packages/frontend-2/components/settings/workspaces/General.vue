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
          v-model="slug"
          color="foundation"
          label="Short ID"
          name="shortId"
          :help="slugHelp"
          :disabled="!isAdmin"
          show-label
          label-position="left"
          read-only
          :right-icon="isAdmin ? IconEdit : undefined"
          right-icon-title="Edit short ID"
          @right-icon-click="openSlugEditDialog"
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
      <div class="flex flex-col sm:flex-row space-y-2 sm:space-x-8 items-center">
        <div class="flex flex-col w-full sm:w-6/12">
          <span class="text-body-xs font-medium text-foreground">
            Default project role
          </span>
          <span class="text-body-2xs text-foreground-2">
            Role workspace members get when added to the workspace and in newly created
            projects.
          </span>
        </div>
        <div class="w-full sm:w-6/12">
          <FormSelectProjectRoles
            v-model="defaultProjectRole"
            disabled-items-tooltip="Use project settings to assign a member as project owner"
            label="Project role"
            size="md"
            :disabled-items="[Roles.Stream.Owner]"
            :disabled="!isAdmin"
            @update:model-value="save()"
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

    <SettingsWorkspacesGeneralEditSlugDialog
      v-if="workspaceResult && isAdmin"
      v-model:open="showEditSlugDialog"
      :base-url="baseUrl"
      :workspace="workspaceResult.workspace"
      @update:slug="updateWorkspaceSlug"
    />
  </section>
</template>

<script setup lang="ts">
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
import { Roles, type StreamRoles } from '@speckle/shared'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'

graphql(`
  fragment SettingsWorkspacesGeneral_Workspace on Workspace {
    ...SettingsWorkspacesGeneralEditAvatar_Workspace
    ...SettingsWorkspaceGeneralDeleteDialog_Workspace
    ...SettingsWorkspacesGeneralEditSlugDialog_Workspace
    id
    name
    slug
    description
    logo
    role
    defaultProjectRole
  }
`)

type FormValues = { name: string; description: string; defaultProjectRole: StreamRoles }

const props = defineProps<{
  workspaceId: string
}>()

const IconEdit = resolveComponent('IconEdit')

const mixpanel = useMixpanel()
const router = useRouter()
const route = useRoute()
const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsUpdateWorkspaceMutation)
const { result: workspaceResult, onResult } = useQuery(
  settingsWorkspaceGeneralQuery,
  () => ({
    id: props.workspaceId
  })
)
const config = useRuntimeConfig()

const name = ref('')
const slug = ref('')
const description = ref('')
const showDeleteDialog = ref(false)
const showEditSlugDialog = ref(false)
const showLeaveDialog = ref(false)
const defaultProjectRole = ref<StreamRoles>()

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
  if (defaultProjectRole.value !== workspaceResult.value.workspace.defaultProjectRole)
    input.defaultProjectRole = defaultProjectRole.value

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
      slug.value = workspaceResult.value.workspace.slug ?? ''
    }
  },
  { deep: true, immediate: true }
)

onResult((res) => {
  if (res.data) {
    defaultProjectRole.value = res.data.workspace.defaultProjectRole as StreamRoles
  }
})

const baseUrl = config.public.baseUrl

const slugHelp = computed(() => {
  return `Used after ${baseUrl}/workspaces/`
})

const openSlugEditDialog = () => {
  showEditSlugDialog.value = true
}

const updateWorkspaceSlug = async (newSlug: string) => {
  if (!workspaceResult.value?.workspace) {
    return
  }

  const oldSlug = slug.value

  const result = await updateMutation({
    input: {
      id: workspaceResult.value.workspace.id,
      slug: newSlug
    }
  })

  if (result && result.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Workspace short ID updated'
    })

    showEditSlugDialog.value = false

    slug.value = newSlug

    if (route.params.slug === oldSlug) {
      router.replace(workspaceRoute(newSlug))
    }
  } else {
    const errorMessage = getFirstErrorMessage(result && result.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update workspace slug',
      description: errorMessage
    })
  }
}
</script>
