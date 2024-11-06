<template>
  <section class="flex flex-col space-y-3">
    <SettingsSectionHeader title="SSO" subheading class="mb-3" />

    <div v-if="loading" class="flex justify-center">
      <LoadingSpinner />
    </div>

    <template v-else>
      <div class="p-4 border border-outline- rounded">
        <!-- Show provider list if we have providers -->
        <div v-if="provider && !isEditing" class="space-y-4">
          <div class="flex items-center justify-between">
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

const logger = useLogger()
const { provider, loading } = useWorkspaceSso({
  workspaceSlug: props.workspace.slug
})

const isEditing = ref(false)

const startEditing = () => {
  isEditing.value = true
}

const handleFormSubmit = (data: SsoFormValues) => {
  // Handle form submission
  logger.info('Form submitted:', data)
  isEditing.value = false
}

const formInitialData = computed(() => {
  if (!isEditing.value || !provider.value) return undefined

  return {
    providerName: provider.value.name ?? '',
    clientId: provider.value.clientId ?? '',
    clientSecret: '••••••••••',
    issuerUrl: provider.value.issuerUrl ?? ''
  }
})
</script>
