import type { StreamActivityRecord } from '@/modules/activitystream/helpers/types'
import type { ActivityCollection } from '@/modules/core/graph/generated/graphql'

export type ActivityCollectionGraphQLReturn = Omit<ActivityCollection, 'items'> & {
  items: StreamActivityRecord[]
}
