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
          :disabled="!isAdmin || needsSsoLogin"
          :tooltip-text="disabledTooltipText"
          label-position="left"
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          validate-on-value-update
          @change="save()"
        />
        <ClientOnly>
          <hr class="my-4 border-outline-3" />
          <FormTextInput
            id="short-id"
            v-model="slug"
            color="foundation"
            label="Short ID"
            name="shortId"
            :help="slugHelp"
            :disabled="disableSlugInput"
            show-label
            label-position="left"
            :tooltip-text="disabledSlugTooltipText"
            read-only
            :right-icon="disableSlugInput ? undefined : IconEdit"
            :right-icon-title="disableSlugInput ? undefined : 'Edit short ID'"
            custom-help-class="!break-all"
            @right-icon-click="openSlugEditDialog"
          />
        </ClientOnly>
        <hr class="my-4 border-outline-3" />
        <FormTextArea
          id="settings-description"
          v-model="description"
          color="foundation"
          label="Description"
          name="description"
          placeholder="Workspace description"
          :tooltip-text="disabledTooltipText"
          show-label
          label-position="left"
          :disabled="!isAdmin || needsSsoLogin"
          :rules="[isStringOfLength({ maxLength: 512 })]"
          help="Maximum 512 characters"
          @change="save()"
        />
        <hr class="my-4 border-outline-3" />
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col">
            <span class="text-body-xs font-medium text-foreground">Workspace icon</span>
            <span class="text-body-2xs text-foreground-2 max-w-[230px]">
              Upload your icon image
            </span>
          </div>
          <div :key="String(isAdmin)" v-tippy="disabledTooltipText">
            <SettingsWorkspacesGeneralEditAvatar
              v-if="workspaceResult?.workspaceBySlug"
              :workspace="workspaceResult?.workspaceBySlug"
              :disabled="!isAdmin || needsSsoLogin"
              size="3xl"
            />
          </div>
        </div>
        <hr class="my-4 border-outline-3" />
        <div class="grid grid-cols-2 gap-4 pt-1">
          <div class="flex flex-col">
            <span class="text-body-xs font-medium text-foreground">
              Speckle logo in embeds
            </span>
            <span class="text-body-2xs text-foreground-2 max-w-[230px]">
              Control the visibility of the Speckle logo in model embeds
            </span>
          </div>
          <div class="flex h-full flex-col justify-center gap-y-2">
            <ClientOnly>
              <div
                v-tippy="
                  !canEditEmbedOptions?.authorized
                    ? canEditEmbedOptions?.message
                    : undefined
                "
                class="flex items-center gap-x-2"
              >
                <FormSwitch
                  v-model="showBranding"
                  :disabled="!canEditEmbedOptions?.authorized || needsSsoLogin"
                  name="showBranding"
                  label="Show branding"
                  :show-label="false"
                  @update:model-value="updateShowBranding"
                />
                <p class="text-body-xs text-foreground-2">
                  {{ showBranding ? 'Logo visible' : 'Logo hidden' }}
                </p>
              </div>
              <p
                v-if="
                  !canEditEmbedOptions?.authorized &&
                  canEditEmbedOptions?.code === 'WorkspaceNoFeatureAccess'
                "
                class="text-body-2xs text-foreground-2"
              >
                This feature is only available on the business plan
                <NuxtLink
                  :to="settingsWorkspaceRoutes.billing.route(slug)"
                  class="underline"
                >
                  upgrade now
                </NuxtLink>
              </p>
            </ClientOnly>
          </div>
        </div>
      </div>
      <hr class="my-6 border-outline-2" />
      <div class="flex flex-col space-y-6">
        <SettingsSectionHeader title="Leave workspace" subheading />
        <CommonCard class="text-body-xs bg-foundation">
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
          <CommonCard class="text-body-xs bg-foundation">
            We will delete all projects where you are the sole owner, and any associated
            data. We will ask you to type in your email address and press the delete
            button.
          </CommonCard>

          <div class="flex">
            <div v-tippy="deleteWorkspaceTooltip">
              <FormButton
                :disabled="!canDeleteWorkspace"
                color="primary"
                @click="showDeleteDialog = true"
              >
                Delete workspace
              </FormButton>
            </div>
          </div>
        </div>
      </template>
      <template v-if="workspaceResult?.workspaceBySlug?.id">
        <hr class="mb-6 mt-8 border-outline-2" />
        <p class="text-body-2xs text-foreground-2">
          Workspace ID: #{{ workspaceResult?.workspaceBySlug?.id }}
        </p>
      </template>
    </div>

    <SettingsWorkspacesGeneralLeaveDialog
      v-model:open="showLeaveDialog"
      :workspace="workspaceResult?.workspaceBySlug"
    />

    <SettingsWorkspacesGeneralDeleteDialog
      v-model:open="showDeleteDialog"
      :workspace="workspaceResult?.workspaceBySlug"
    />

    <SettingsWorkspacesGeneralEditSlugDialog
      v-model:open="showEditSlugDialog"
      :base-url="baseUrl"
      :workspace="workspaceResult?.workspaceBySlug"
      @update:slug="updateWorkspaceSlug"
    />
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useForm } from 'vee-validate'
import { useQuery, useMutation } from '@vue/apollo-composable'
import {
  settingsUpdateWorkspaceMutation,
  settingsUpdateWorkspaceEmbedOptionsMutation
} from '~/lib/settings/graphql/mutations'
import { settingsWorkspaceGeneralQuery } from '~/lib/settings/graphql/queries'
import type { WorkspaceUpdateInput } from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~/lib/core/composables/mp'
import { Roles, WorkspacePlans } from '@speckle/shared'
import { workspaceRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { WorkspacePlanStatuses } from '~/lib/common/generated/gql/graphql'
import { useWorkspaceSsoStatus } from '~/lib/workspaces/composables/sso'

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
    plan {
      status
      name
    }
    embedOptions {
      hideSpeckleBranding
    }
    permissions {
      canEditEmbedOptions {
        ...FullPermissionCheckResult
      }
    }
  }
`)

definePageMeta({
  middleware: ['require-valid-workspace'],
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - General'
})

type FormValues = { name: string; description: string }

const routeSlug = computed(() => (route.params.slug as string) || '')

const IconEdit = resolveComponent('IconEdit')

const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const mixpanel = useMixpanel()
const router = useRouter()
const route = useRoute()
const { handleSubmit } = useForm<FormValues>()
const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsUpdateWorkspaceMutation)
const { mutate: updateEmbedOptionsMutation } = useMutation(
  settingsUpdateWorkspaceEmbedOptionsMutation
)
const { result: workspaceResult } = useQuery(settingsWorkspaceGeneralQuery, () => ({
  slug: routeSlug.value
}))
const config = useRuntimeConfig()
const { hasSsoEnabled, needsSsoLogin } = useWorkspaceSsoStatus({
  workspaceSlug: computed(() => workspaceResult.value?.workspaceBySlug?.slug || '')
})

const name = ref('')
const slug = ref('')
const description = ref('')
const showDeleteDialog = ref(false)
const showEditSlugDialog = ref(false)
const showLeaveDialog = ref(false)
const showBranding = ref(true)

const isAdmin = computed(
  () => workspaceResult.value?.workspaceBySlug?.role === Roles.Workspace.Admin
)
const adminRef = toRef(isAdmin)
const canDeleteWorkspace = computed(
  () =>
    isAdmin.value &&
    !needsSsoLogin.value &&
    (!isBillingIntegrationEnabled ||
      !(
        [
          WorkspacePlanStatuses.Valid,
          WorkspacePlanStatuses.PaymentFailed,
          WorkspacePlanStatuses.CancelationScheduled
        ] as string[]
      ).includes(
        workspaceResult.value?.workspaceBySlug?.plan?.status as WorkspacePlanStatuses
      ) ||
      workspaceResult.value?.workspaceBySlug?.plan?.name === WorkspacePlans.Free)
)
const deleteWorkspaceTooltip = computed(() => {
  if (needsSsoLogin.value)
    return 'You cannot delete a workspace that requires SSO without an active session'
  if (!canDeleteWorkspace.value)
    return 'You cannot delete a workspace with an active plan. Please cancel your plan before deleting.'
  if (!isAdmin.value) return 'Only admins can delete workspaces'
  return undefined
})

const save = handleSubmit(async () => {
  if (!workspaceResult.value?.workspaceBySlug) return

  const input: WorkspaceUpdateInput = {
    id: workspaceResult.value.workspaceBySlug.id
  }
  if (name.value !== workspaceResult.value.workspaceBySlug.name) input.name = name.value
  if (description.value !== workspaceResult.value.workspaceBySlug.description)
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
      workspace_id: workspaceResult.value.workspaceBySlug.id,
      source: 'settings'
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
    if (workspaceResult.value?.workspaceBySlug) {
      name.value = workspaceResult.value.workspaceBySlug.name
      description.value = workspaceResult.value.workspaceBySlug.description ?? ''
      slug.value = workspaceResult.value.workspaceBySlug.slug ?? ''
      showBranding.value =
        !workspaceResult.value.workspaceBySlug.embedOptions.hideSpeckleBranding
    }
  },
  { deep: true, immediate: true }
)

const baseUrl = config.public.baseUrl

const slugHelp = computed(() => {
  // Ensure the correct slug is used both on the server and client
  if (!workspaceResult.value?.workspaceBySlug) {
    return `${baseUrl}/workspaces/${routeSlug.value}`
  }
  return `${baseUrl}/workspaces/${workspaceResult.value.workspaceBySlug.slug}`
})

const canEditEmbedOptions = computed(
  () => workspaceResult.value?.workspaceBySlug?.permissions?.canEditEmbedOptions
)

const disabledTooltipText = computed(() => {
  if (!adminRef.value) return 'Only admins can edit this field'
  if (needsSsoLogin.value) return 'Log in with your SSO provider to edit this field'
  return undefined
})

const disableSlugInput = computed(() => !isAdmin.value || hasSsoEnabled.value)

const disabledSlugTooltipText = computed(() => {
  return hasSsoEnabled.value
    ? 'Short ID cannot be changed while SSO is enabled.'
    : disabledTooltipText.value
})

const openSlugEditDialog = () => {
  if (hasSsoEnabled.value) return
  showEditSlugDialog.value = true
}

const updateShowBranding = async () => {
  if (!workspaceResult.value?.workspaceBySlug) return

  const result = await updateEmbedOptionsMutation({
    input: {
      workspaceId: workspaceResult.value.workspaceBySlug.id,
      hideSpeckleBranding: !showBranding.value
    }
  })

  if (result && result.data) {
    mixpanel.track('Workspace Embed Options Updated', {
      hideBranding: !showBranding.value,
      // eslint-disable-next-line camelcase
      workspace_id: workspaceResult.value.workspaceBySlug.id
    })

    triggerNotification({
      type: ToastNotificationType.Success,
      title: `Speckle logo on embeds ${showBranding.value ? 'enabled' : 'disabled'}`
    })
  }
}
const updateWorkspaceSlug = async (newSlug: string) => {
  if (!workspaceResult.value?.workspaceBySlug) {
    return
  }

  const oldSlug = slug.value

  const result = await updateMutation({
    input: {
      id: workspaceResult.value.workspaceBySlug.id,
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

    if (routeSlug.value === oldSlug) {
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
