<template>
  <div>
    <CommonAlert
      v-if="ssoError || validationStatus.show"
      :color="validationStatus.color"
      class="mb-4"
    >
      <template #title>{{ validationStatus.title }}</template>
      <template #description>
        <div>{{ validationStatus.message }}</div>
        <div v-if="providerDetails" class="mt-1 text-body-2xs opacity-80">
          <div v-if="providerDetails.providerName">
            Provider: {{ providerDetails.providerName }}
          </div>
          <div v-if="providerDetails.clientId">
            Client ID: {{ providerDetails.clientId }}
          </div>
          <div v-if="providerDetails.issuerUrl">
            Issuer URL: {{ providerDetails.issuerUrl }}
          </div>
        </div>
      </template>
    </CommonAlert>
    <WorkspaceInviteWrapper
      v-if="token"
      :workspace-slug="workspaceSlug"
      :token="token"
    />
    <WorkspaceProjectList v-else :workspace-slug="workspaceSlug" />
  </div>
</template>

<script setup lang="ts">
import { useOnWorkspaceUpdated } from '~/lib/workspaces/composables/management'
import { useWorkspaceSsoValidation } from '~/lib/workspaces/composables/sso'
import { useWorkspaceProjectsUpdatedTracking } from '~/lib/workspaces/composables/projectUpdates'
import { CommonAlert } from '@speckle/ui-components'
import type { AlertColor } from '@speckle/ui-components'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)
const { ssoError } = useWorkspaceSsoValidation(workspaceSlug)
useOnWorkspaceUpdated({ workspaceSlug })
useWorkspaceProjectsUpdatedTracking(workspaceSlug)

const token = computed(() => route.query.token as string | undefined)

const providerDetails = computed(() => {
  const details = {
    providerName: route.query.providerName,
    clientId: route.query.clientId,
    issuerUrl: route.query.issuerUrl
  }

  // Only return if we have any details
  return Object.values(details).some(Boolean) ? details : null
})

const validationStatus = computed<{
  show: boolean
  color: AlertColor
  title: string
  message: string
}>(() => {
  // Handle SSO validation result
  if (route.query.ssoValidationSuccess === 'false') {
    return {
      show: true,
      color: 'danger',
      title: 'SSO Configuration Failed',
      message: route.query.ssoError
        ? decodeURIComponent(route.query.ssoError as string)
        : 'Please check your credentials and try again.'
    }
  }

  // Handle generic SSO errors
  if (route.query.ssoError) {
    return {
      show: true,
      color: 'danger',
      title: 'SSO Error',
      message: decodeURIComponent(route.query.ssoError as string)
    }
  }

  // Handle successful validation
  if (route.query.ssoValidationSuccess === 'true') {
    return {
      show: true,
      color: 'success',
      title: 'SSO Configuration Successful',
      message: 'Your SSO provider has been successfully configured.'
    }
  }

  return {
    show: false,
    color: 'danger',
    title: '',
    message: ''
  }
})
</script>
