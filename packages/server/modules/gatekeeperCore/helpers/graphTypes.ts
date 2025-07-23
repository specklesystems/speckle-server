import type { Price } from '@/modules/core/graph/generated/graphql'
import type { WorkspacePlan } from '@speckle/shared'

export type PriceGraphQLReturn = Omit<Price, 'currencySymbol'>

export type WorkspacePlanGraphQLReturn = WorkspacePlan & { workspaceId: string }
export type WorkspacePlanUsageGraphQLReturn = { workspaceId: string }
