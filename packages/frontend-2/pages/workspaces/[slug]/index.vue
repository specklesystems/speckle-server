<template>
  <div>
    <div v-if="ssoError">
      {{ ssoError }}
      <a :href="`/workspaces/${workspaceSlug}/sso?redirect=${$route.fullPath}`">
        Sign in with SSO
      </a>
    </div>
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
import { useWorkspaceProjectsSubscription } from '~/lib/workspaces/composables/projectUpdates'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)
const { ssoError } = useWorkspaceSsoValidation(workspaceSlug)
useOnWorkspaceUpdated({ workspaceSlug })
useWorkspaceProjectsSubscription(workspaceSlug)

const token = computed(() => route.query.token as string | undefined)
</script>
