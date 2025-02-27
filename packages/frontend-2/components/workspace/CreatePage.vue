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
      <FormButton v-if="isForcedCreation" size="sm" color="outline" @click="logout()">
        Sign out
      </FormButton>
      <FormButton v-else size="sm" color="outline" @click="onCancelClick">
        Cancel
      </FormButton>
    </template>

    <WorkspaceWizard :workspace-id="workspaceId" />

    <div v-if="isForcedCreation && isFirstStep" class="w-full max-w-sm mx-auto mt-4">
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
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'

defineProps<{
  workspaceId?: string
}>()

const { currentStep, resetWizardState } = useWorkspacesWizard()
const mixpanel = useMixpanel()
const { logout } = useAuthManager()
const { hasDiscoverableWorkspacesOrJoinRequests } = useDiscoverableWorkspaces()
const { requiresWorkspaceCreation } = useActiveUser()

const isCancelDialogOpen = ref(false)

const isFirstStep = computed(() => currentStep.value === WizardSteps.Details)

const isForcedCreation = computed(() => {
  return (
    requiresWorkspaceCreation.value && !hasDiscoverableWorkspacesOrJoinRequests.value
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
