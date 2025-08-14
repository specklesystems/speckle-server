<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="workspaceRoute(workspaceSlug)"
        name="Projects"
        :separator="false"
      />
    </Portal>
    <WorkspaceDashboardHeader
      :workspace="props.workspace"
      :workspace-slug="workspaceSlug"
      :show-billing-alert="showBillingAlert"
    />
    <WorkspaceDashboardProjectList
      :workspace-slug="workspaceSlug"
      :workspace="props.workspace"
      class="mt-2 lg:mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Roles,
  WorkspacePlanStatuses,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceDashboard_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import type { WorkspaceWizardState } from '~/lib/workspaces/helpers/types'
import { useBillingActions } from '~/lib/billing/composables/actions'

graphql(`
  fragment WorkspaceDashboard_Workspace on Workspace {
    ...WorkspaceSidebarMembers_Workspace
    ...WorkspaceDashboardHeader_Workspace
    ...WorkspaceDashboardProjectList_Workspace
    ...BillingActions_Workspace
    id
    name
    role
    creationState {
      completed
      state
    }
  }
`)

const props = defineProps<{
  workspace?: MaybeNullOrUndefined<WorkspaceDashboard_WorkspaceFragment>
  workspaceSlug: string
}>()

const { validateCheckoutSession } = useBillingActions()
const { finalizeWizard } = useWorkspacesWizard()
const workspaceTitle = ref<string>('')

useHeadSafe({
  title: workspaceTitle
})
const hasFinalized = ref(false)

const showBillingAlert = computed(
  () =>
    props.workspace?.role !== Roles.Workspace.Guest &&
    (props.workspace?.plan?.status === WorkspacePlanStatuses.PaymentFailed ||
      props.workspace?.plan?.status === WorkspacePlanStatuses.Canceled ||
      props.workspace?.plan?.status === WorkspacePlanStatuses.CancelationScheduled)
)

watch(
  () => props.workspace,
  (newWorkspace) => {
    if (newWorkspace) {
      if (
        newWorkspace.creationState?.completed === false &&
        newWorkspace.creationState.state &&
        !hasFinalized.value &&
        import.meta.client
      ) {
        hasFinalized.value = true
        finalizeWizard(
          newWorkspace.creationState.state as WorkspaceWizardState,
          newWorkspace.id
        )
      }

      workspaceTitle.value = newWorkspace.name
      validateCheckoutSession(newWorkspace)
    }
  },
  { immediate: true }
)
</script>
