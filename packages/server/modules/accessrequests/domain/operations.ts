import { StreamAccessRequestGraphQLReturn } from '@/modules/accessrequests/helpers/graphTypes'
import {
  AccessRequestType,
  ServerAccessRequestRecord,
  StreamAccessRequestRecord
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

export type AccessRecordInput<
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
> = Omit<ServerAccessRequestRecord<T, I>, 'createdAt' | 'updatedAt'>

export type CreateNewRequest = <
  T extends AccessRequestType = AccessRequestType,
  I extends Nullable<string> = Nullable<string>
>(
  input: AccessRecordInput<T, I>
) => Promise<ServerAccessRequestRecord<T, I>>

export type GetPendingAccessRequests = <T extends AccessRequestType>(
  resourceType: T,
  resourceId: string
) => Promise<ServerAccessRequestRecord<T, string>[]>

export type GetPendingAccessRequest = <T extends AccessRequestType = AccessRequestType>(
  requestId: string,
  resourceType?: T
) => Promise<Optional<ServerAccessRequestRecord<T, string>>>

export type DeleteRequestById = (requestId: string) => Promise<boolean>

export type GetUserProjectAccessRequest = (
  userId: string,
  projectId: string
) => Promise<Nullable<StreamAccessRequestRecord>>

export type GetUserStreamAccessRequest = (
  userId: string,
  streamId: string
) => Promise<Nullable<StreamAccessRequestGraphQLReturn>>

export type RequestProjectAccess = (
  userId: string,
  projectId: string
) => Promise<StreamAccessRequestRecord>

export type GetPendingProjectRequests = (
  projectId: string
) => Promise<StreamAccessRequestRecord[]>
