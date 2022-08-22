import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type StreamActivityRecord = {
  streamId: Nullable<string>
  time: Date
  resourceType: Nullable<string>
  resourceId: Nullable<string>
  actionType: Nullable<string>
  userId: Nullable<string>
  info: Nullable<Record<string, unknown>>
  message: Nullable<string>
}
