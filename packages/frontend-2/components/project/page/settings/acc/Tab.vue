<template>
  <ProjectPageSettingsBlock :auth-check="canUpdate" title="ACC">
    <template #top-buttons>
      <FormButton
        color="outline"
        to="https://docs.speckle.systems/beta/acc/overview"
        external
        target="_blank"
      >
        Docs
      </FormButton>
      <FormButton :disabled="!canUpdate?.authorized">New</FormButton>
    </template>
    <IntegrationsAccSyncs
      :project-id="projectId"
      :is-logged-in="hasTokens"
      :tokens="tokens"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { useAccAuthManager } from '~/lib/acc/composables/useAccAuthManager'
import { graphql } from '~/lib/common/generated/gql'
import { projectIntegrationsQuery } from '~/lib/projects/graphql/queries'

graphql(`
  fragment ProjectPageSettingsIntegrations_Project on Project {
    id
    permissions {
      canReadAccIntegrationSettings {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const hasTokens = computed(() => !!tokens.value?.access_token)

const { tokens, tryGetTokensFromCookies } = useAccAuthManager()

const { result } = useQuery(projectIntegrationsQuery, () => ({
  projectId: projectId.value
}))

const canUpdate = computed(
  () => result.value?.project?.permissions?.canReadAccIntegrationSettings
)

onMounted(async () => {
  await tryGetTokensFromCookies()
})
</script>
