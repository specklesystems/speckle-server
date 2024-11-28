<template>
  <div class="mt-4">
    <hr class="border-outline-3 mb-4" />
    <component :is="instructionComponent" :redirect-url="redirectUrl" />
    <hr class="border-outline-3 my-6" />
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
const CustomInstructions = resolveComponent(
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
      return CustomInstructions
  }
})

const apiOrigin = useApiOrigin()

const redirectUrl = computed(() => {
  return `${apiOrigin}/api/v1/workspaces/${props.workspaceSlug}/sso/oidc/callback?validate=true`
})
</script>
