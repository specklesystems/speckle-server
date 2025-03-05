<template>
  <HeaderWithEmptyPage empty-header>
    <template #header-left>
      <HeaderLogoBlock
        :active="false"
        class="min-w-40 cursor-pointer"
        no-link
        @click="onCancelClick"
      />
    </template>
    <template #header-right>
      <FormButton
        v-if="requiresWorkspaceCreation"
        size="sm"
        color="outline"
        @click="logout()"
      >
        Sign out
      </FormButton>
      <FormButton v-else size="sm" color="outline" @click="onCancelClick">
        Cancel
      </FormButton>
    </template>

    <WorkspaceWizard :workspace-id="workspaceId" />

    <div
      v-if="requiresWorkspaceCreation && isFirstStep"
      class="w-full max-w-sm mx-auto mt-4"
    >
      <CommonAlert color="neutral" size="xs" hide-icon>
        <template #title>Why am I seeing this?</template>
        <template #description>
          This server now requires you to be a member of a workspace. Please create a
          new workspace to continue.
        </template>
      </CommonAlert>
    </div>

    <WorkspaceWizardCancelDialog
      v-model:open="isCancelDialogOpen"
      :workspace-id="workspaceId"
    />
  </HeaderWithEmptyPage>
</template>

<script setup lang="ts">
import { workspacesRoute } from '~~/lib/common/helpers/route'
import { WizardSteps } from '~/lib/workspaces/helpers/types'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useAuthManager } from '~/lib/auth/composables/auth'
import { useQuery } from '@vue/apollo-composable'
import { activeUserWorkspaceExistenceCheckQuery } from '~/lib/auth/graphql/queries'

defineProps<{
  workspaceId?: string
}>()

const { currentStep, resetWizardState } = useWorkspacesWizard()
const mixpanel = useMixpanel()
const { logout } = useAuthManager()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const isWorkspacesEnabled = useIsWorkspacesEnabled()

const { result } = useQuery(activeUserWorkspaceExistenceCheckQuery)

const isCancelDialogOpen = ref(false)

const isFirstStep = computed(() => currentStep.value === WizardSteps.Details)

const requiresWorkspaceCreation = computed(() => {
  return (
    isWorkspacesEnabled.value &&
    isWorkspaceNewPlansEnabled.value &&
    (result.value?.activeUser?.workspaces?.totalCount || 0) === 0 &&
    // Legacy projects
    (result.value?.activeUser?.versions.totalCount || 0) === 0
  )
})

const onCancelClick = () => {
  if (isFirstStep.value) {
    navigateTo(workspacesRoute)
    resetWizardState()
    mixpanel.stop_session_recording()
  } else {
    isCancelDialogOpen.value = true
  }
}
</script>
