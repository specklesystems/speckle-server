import { ServerRoles, StreamRoles } from '@speckle/shared'
import { UserWithOptionalRole } from '../core/repositories/users'
import { ResourceTargets } from './helpers/inviteHelper'
import { ServerInviteRecord, StreamInviteRecord } from './helpers/types'
import { StreamWithOptionalRole } from '../core/repositories/streams'

export interface ServerInvitesRepository {
  queryAllUserStreamInvites: (userId: string) => Promise<StreamInviteRecord[]>
  findStreamInvite: (
    streamId: string,
    {
      target,
      token,
      inviteId
    }: { target?: string | null; token?: string | null; inviteId?: string | null }
  ) => Promise<StreamInviteRecord | null>
  findUserByTarget: (target: string) => Promise<UserWithOptionalRole | null>
  findResource: (invite: {
    resourceId?: string | null
    resourceTarget?: typeof ResourceTargets.Streams | null
  }) => Promise<StreamWithOptionalRole | undefined | null>
  insertInviteAndDeleteOld: (
    invite: Pick<
      ServerInviteRecord,
      | 'id'
      | 'target'
      | 'inviterId'
      | 'message'
      | 'resourceTarget'
      | 'resourceId'
      | 'role'
      | 'token'
      | 'serverRole'
    >,
    alternateTargets: string[]
  ) => Promise<number[]>
  findServerInvite: (
    email?: string,
    token?: string
  ) => Promise<ServerInviteRecord | null>
  queryAllStreamInvites: (streamId: string) => Promise<StreamInviteRecord[]>
  deleteAllStreamInvites: (streamId: string) => Promise<boolean>
  deleteServerOnlyInvites: (email?: string) => Promise<number | undefined>
  updateAllInviteTargets: (
    oldTargets?: string | string[],
    newTarget?: string
  ) => Promise<void>
  deleteStreamInvite: (inviteId?: string) => Promise<number | undefined>
  findInvite: (inviteId?: string) => Promise<ServerInviteRecord | null>
  deleteInvite: (inviteId?: string) => Promise<boolean>
  deleteInvitesByTarget: (
    targets?: string | string[],
    resourceTarget?: string,
    resourceId?: string
  ) => Promise<boolean>
}

export interface CreateInviteParams {
  target: string
  inviterId: string
  message?: string | null
  resourceTarget?: typeof ResourceTargets.Streams
  resourceId?: string
  role?: StreamRoles
  serverRole?: ServerRoles | null
}
