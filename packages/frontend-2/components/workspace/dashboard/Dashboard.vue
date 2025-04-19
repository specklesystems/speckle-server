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
      :workspace="workspace"
      :workspace-slug="workspaceSlug"
      :show-billing-alert="showBillingAlert"
    />
    <WorkspaceDashboardProjectList
      :workspace-slug="workspaceSlug"
      :workspace="workspace"
      class="mt-2 lg:mt-4"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Roles, WorkspacePlanStatuses } from '@speckle/shared'
import { workspaceDashboardQuery } from '~~/lib/workspaces/graphql/queries'
import { graphql } from '~~/lib/common/generated/gql'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import type { WorkspaceWizardState } from '~/lib/workspaces/helpers/types'
import { useBillingActions } from '~/lib/billing/composables/actions'

graphql(`
  fragment WorkspaceDashboard_Workspace on Workspace {
    ...WorkspaceSidebarMembers_Workspace
    ...WorkspaceDashboardHeader_Workspace
    ...WorkspaceDashboardProjectList_Workspace
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
  workspaceSlug: string
}>()

const { validateCheckoutSession } = useBillingActions()
const { finalizeWizard } = useWorkspacesWizard()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const { result: workspaceResult, onResult } = useQuery(
  workspaceDashboardQuery,
  () => ({
    workspaceSlug: props.workspaceSlug
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const hasFinalized = ref(false)

const workspace = computed(() => workspaceResult.value?.workspaceBySlug)
const showBillingAlert = computed(
  () =>
    workspace?.value?.role === Roles.Workspace.Guest &&
    (workspace.value?.plan?.status === WorkspacePlanStatuses.PaymentFailed ||
      workspace.value?.plan?.status === WorkspacePlanStatuses.Canceled ||
      workspace.value?.plan?.status === WorkspacePlanStatuses.CancelationScheduled)
)

onResult((queryResult) => {
  if (
    queryResult.data?.workspaceBySlug.creationState?.completed === false &&
    queryResult.data.workspaceBySlug.creationState.state &&
    !hasFinalized.value &&
    import.meta.client
  ) {
    hasFinalized.value = true
    finalizeWizard(
      queryResult.data.workspaceBySlug.creationState.state as WorkspaceWizardState,
      queryResult.data.workspaceBySlug.id
    )
  }

  if (queryResult.data?.workspaceBySlug) {
    useHeadSafe({
      title: queryResult.data.workspaceBySlug.name
    })
    validateCheckoutSession(queryResult.data.workspaceBySlug)
  }
})
</script>
