import { Price } from '@/modules/core/graph/generated/graphql'
import { WorkspacePlan } from '@speckle/shared'

export type PriceGraphQLReturn = Omit<Price, 'currencySymbol'>

export type WorkspacePlanGraphQLReturn = WorkspacePlan & { workspaceId: string }
export type WorkspacePlanUsageGraphQLReturn = { workspaceId: string }
