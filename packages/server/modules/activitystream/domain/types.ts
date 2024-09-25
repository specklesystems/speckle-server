import { ActionTypes } from '@/modules/activitystream/helpers/types'

export type StreamActionType =
  (typeof ActionTypes.Stream)[keyof (typeof ActionTypes)['Stream']]
