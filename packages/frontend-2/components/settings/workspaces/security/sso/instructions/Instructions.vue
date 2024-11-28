<template>
  <div class="flex flex-col gap-4">
    <component :is="instructionComponent" :redirect-url="redirectUrl" />
    <SettingsWorkspacesSecuritySsoInstructionsScopes />
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import { SsoProviderType } from '~/lib/workspaces/helpers/types'

const props = defineProps<{
  selectedProvider: SsoProviderType
  workspaceSlug: string
}>()

const GoogleInstructions = resolveComponent(
  'SettingsWorkspacesSecuritySsoInstructionsGoogle'
)
const OktaInstructions = resolveComponent(
  'SettingsWorkspacesSecuritySsoInstructionsOkta'
)
const EntraIdInstructions = resolveComponent(
  'SettingsWorkspacesSecuritySsoInstructionsEntraId'
)
const ManualInstructions = resolveComponent(
  'SettingsWorkspacesSecuritySsoInstructionsCustom'
)

const instructionComponent = computed(() => {
  switch (props.selectedProvider) {
    case SsoProviderType.Google:
      return GoogleInstructions
    case SsoProviderType.Okta:
      return OktaInstructions
    case SsoProviderType.EntraId:
      return EntraIdInstructions
    default:
      return ManualInstructions
  }
})

const apiOrigin = useApiOrigin()

const redirectUrl = computed(() => {
  return `${apiOrigin}/api/v1/workspaces/${props.workspaceSlug}/sso/oidc/callback?validate=true`
})
</script>
