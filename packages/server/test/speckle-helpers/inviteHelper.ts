import { Roles } from '@speckle/shared'

import {
  buildUserTarget,
  ResourceTargets
} from '@/modules/serverinvites/helpers/inviteHelper'
import { InviteResult } from '@/modules/serverinvites/services/operations'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import {
  findResource,
  findUserByTarget,
  insertInviteAndDeleteOld
} from '@/modules/serverinvites/repositories/serverInvites'
import { Knex } from 'knex'
import { createAndSendInvite } from '@/modules/serverinvites/services/inviteCreationService'

/**
 * Create a new invite. User & userId are alternatives for each other, and so
 * are stream & streamId
 */
export const createInviteDirectly =
  // This is a test helper, so im ok, with leaking the internal abstractions here


    ({ db }: { db: Knex }) =>
    async (
      invite: {
        email?: string
        user?: UserRecord
        userId?: string
        message?: string
        stream?: StreamRecord
        streamId?: string
      },
      creatorId: string
    ): Promise<InviteResult> => {
      const userId = invite.userId || invite.user?.id || null
      const email = invite.email || null
      if (!userId && !email) throw new Error('Either user/userId or email must be set')

      const streamId = invite.streamId || invite.stream?.id

      const target = email || buildUserTarget(userId)
      if (!target) throw new Error('Cannot create invite without a target')

      return await createAndSendInvite({
        findUserByTarget: findUserByTarget(),
        findResource: findResource(),
        insertInviteAndDeleteOld: insertInviteAndDeleteOld({ db })
      })({
        target,
        inviterId: creatorId,
        message: invite.message,
        resourceTarget: streamId ? ResourceTargets.Streams : undefined,
        resourceId: streamId,
        role: streamId ? Roles.Stream.Contributor : undefined
      })
    }
