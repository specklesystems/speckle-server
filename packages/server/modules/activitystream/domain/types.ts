import {
  ActionTypes,
  ResourceTypes,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'

export type StreamActionType =
  (typeof ActionTypes.Stream)[keyof (typeof ActionTypes)['Stream']]

export type ResourceType = (typeof ResourceTypes)[keyof typeof ResourceTypes]

export type StreamActivitySummary = {
  stream: StreamRecord | null
  activity: StreamScopeActivity[]
}

export type ActivitySummary = {
  user: UserRecord
  streamActivities: StreamActivitySummary[]
}
