import { StreamScopeActivity } from '@/modules/activitystream/helpers/types'

export type GetActivity = (
  streamId: string,
  start: Date,
  end: Date,
  filteredUser: string | null
) => Promise<StreamScopeActivity[]>

export type GetActiveUserStreams = (
  start: Date,
  end: Date
) => Promise<
  {
    userId: string
    streamIds: string[]
  }[]
>
