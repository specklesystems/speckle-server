import { Price } from '@/modules/core/graph/generated/graphql'

export type PriceGraphQLReturn = Omit<Price, 'currencySymbol'>
