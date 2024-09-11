import {
  AccessRequestType,
  ServerAccessRequestRecord
} from '@/modules/accessrequests/repositories'
import { Nullable, Optional } from '@speckle/shared'

export type GetUsersPendingAccessRequest = <
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
>(
  userId: string,
  resourceType: T,
  resourceId: I
) => Promise<Optional<ServerAccessRequestRecord<T, I>>>
