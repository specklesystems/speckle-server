import type { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import type { WorkspaceSubscription } from '@/modules/gatekeeper/domain/billing'

export type WorkspaceBillingMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceSubscriptionGraphQLReturn = WorkspaceSubscription
export type WorkspaceSubscriptionSeatsGraphQLReturn = { workspaceId: string }
