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
import { useBillingActions } from '~/lib/billing/composables/actions'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

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

const { cancelCheckoutSession } = useBillingActions()
const route = useRoute()
const pageFetchPolicy = usePageQueryStandardFetchPolicy()
const { triggerNotification } = useGlobalToast()
const { result: workspaceResult, onResult } = useQuery(
  workspaceDashboardQuery,
  () => ({
    workspaceSlug: props.workspaceSlug
  }),
  () => ({
    fetchPolicy: pageFetchPolicy.value
  })
)

const workspace = computed(() => workspaceResult.value?.workspaceBySlug)
const showBillingAlert = computed(
  () =>
    workspace?.value?.role !== Roles.Workspace.Guest &&
    (workspace.value?.plan?.status === WorkspacePlanStatuses.PaymentFailed ||
      workspace.value?.plan?.status === WorkspacePlanStatuses.Canceled ||
      workspace.value?.plan?.status === WorkspacePlanStatuses.CancelationScheduled)
)

onResult((queryResult) => {
  if (queryResult.data?.workspaceBySlug) {
    useHeadSafe({
      title: queryResult.data.workspaceBySlug.name
    })

    const sessionIdQuery = route.query?.session_id
    const paymentStatusQuery = route.query?.payment_status

    if (sessionIdQuery && paymentStatusQuery) {
      if (paymentStatusQuery === WorkspacePlanStatuses.Canceled) {
        cancelCheckoutSession(`${sessionIdQuery}`, queryResult.data.workspaceBySlug.id)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Your payment was canceled'
        })
      }
    }
  }
})
</script>
