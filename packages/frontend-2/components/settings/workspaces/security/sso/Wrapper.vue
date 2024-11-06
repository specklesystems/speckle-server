<template>
  <section class="flex flex-col gap-3">
    <SettingsSectionHeader title="Authentication" subheading class="mb-3" />

    <div v-if="loading" class="flex justify-center">
      <LoadingSpinner />
    </div>

    <template v-else>
      <template v-if="!provider">
        <div class="flex items-center">
          <div class="flex-1 flex-col pr-6 gap-y-1">
            <p class="text-body-xs font-medium text-foreground">Enable SSO</p>
            <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
              Allow logins through your OpenID identity provider.
            </p>
          </div>
          <FormSwitch
            v-model="isSsoToggleEnabled"
            name="domain-discoverability"
            :show-label="false"
          />
        </div>

        <!-- Show form only when SSO is enabled but not yet configured -->
        <div
          v-if="isSsoToggleEnabled"
          class="py-6 px-8 border border-outline-3 rounded-lg mt-4"
        >
          <p class="text-body-xs mb-4">
            To set up SSO, create a new web application using the OpenID Connect
            protocol in your identity provider's panel, which will contain the necessary
            settings for Speckle. When asked about
            <span class="font-bold">Redirect URL</span>
            (callback) please use:
          </p>

          <div class="mb-8">
            <CommonClipboardInputWithToast is-multiline :value="redirectUrl" />
          </div>

          <SettingsWorkspacesSecuritySsoForm
            :workspace-slug="workspace.slug"
            @cancel="handleCancel"
            @submit="handleFormSubmit"
          />
        </div>
      </template>
      <div v-else class="p-4 border border-outline-3 rounded-lg">
        <div v-if="provider && !isEditing" class="flex items-center justify-between">
          <div>
            <h3 class="text-body-xs font-medium text-foreground">
              {{ provider.name }}
            </h3>
            <p class="text-body-2xs text-foreground-2">
              {{ provider.issuerUrl }}
            </p>
          </div>
          <FormButton color="outline" @click="startEditing">Edit</FormButton>
        </div>

        <!-- Show form when editing or no providers exist -->
        <SettingsWorkspacesSecuritySsoForm
          v-else
          :initial-data="formInitialData"
          :workspace-slug="workspace.slug"
          @cancel="isEditing = false"
          @submit="handleFormSubmit"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { SettingsWorkspacesSecurity_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { useWorkspaceSso } from '~/lib/workspaces/composables/management'
import type { SsoFormValues } from '~/lib/workspaces/helpers/types'

const props = defineProps<{
  workspace: SettingsWorkspacesSecurity_WorkspaceFragment
}>()

const apiOrigin = useApiOrigin()
const logger = useLogger()
const { provider, loading } = useWorkspaceSso({
  workspaceSlug: props.workspace.slug
})

const isEditing = ref(false)
const isSsoToggleEnabled = ref(false)

const startEditing = () => {
  isEditing.value = true
}

const handleFormSubmit = (data: SsoFormValues) => {
  // Handle form submission
  logger.info('Form submitted:', data)
  isEditing.value = false
}

const handleCancel = () => {
  isSsoToggleEnabled.value = false
}

const redirectUrl = computed(() => {
  return `${apiOrigin}/api/v1/workspaces/${props.workspace.slug}/sso/oidc/callback?validate=true`
})

const formInitialData = computed(() => {
  if (!isEditing.value || !provider.value) return undefined

  return {
    providerName: provider.value.name ?? '',
    clientId: provider.value.clientId ?? '',
    clientSecret: '••••••••••••••••••',
    issuerUrl: provider.value.issuerUrl ?? ''
  }
})
</script>
