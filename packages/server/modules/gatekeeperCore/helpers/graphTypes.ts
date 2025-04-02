import { Price } from '@/modules/core/graph/generated/graphql'
import { WorkspaceSubscription } from '@/modules/gatekeeper/domain/billing'

export type PriceGraphQLReturn = Omit<Price, 'currencySymbol'>

export type WorkspaceSubscriptionSeatsGraphQLReturn = WorkspaceSubscription
