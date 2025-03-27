import { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { WorkspaceSubscription } from '@/modules/gatekeeper/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'

export type WorkspaceBillingMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceSubscriptionGraphQLReturn = WorkspaceSubscription & {
  parent: Workspace
}
