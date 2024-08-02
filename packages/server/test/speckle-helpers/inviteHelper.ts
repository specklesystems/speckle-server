import { Roles } from '@speckle/shared'

import { buildUserTarget } from '@/modules/serverinvites/helpers/core'
import { InviteResult } from '@/modules/serverinvites/services/operations'
import {
  findInviteByTokenFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { BasicTestUser } from '@/test/authHelper'
import { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { getStream } from '@/modules/core/repositories/streams'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { SendEmailParams } from '@/modules/emails/services/sending'
import { db } from '@/db/knex'
import { expect } from 'chai'

const createAndSendInvite = createAndSendInviteFactory({
  findUserByTarget: findUserByTargetFactory(),
  insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
  collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
    getStream
  }),
  buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
    getStream
  }),
  emitEvent: ({ eventName, payload }) =>
    getEventBus().emit({
      eventName,
      payload
    })
})

export const createServerInviteDirectly = async (
  invite: { email: string; message?: string },
  creatorId: string
) => {
  const { email, message } = invite
  return await createAndSendInvite(
    {
      target: email,
      inviterId: creatorId,
      message,
      primaryResourceTarget: {
        resourceType: ServerInviteResourceType,
        role: Roles.Server.User,
        primary: true,
        resourceId: ''
      }
    },
    null
  )
}

/**
 * Create a new invite. User & userId are alternatives for each other, and so
 * are stream & streamId
 */
export const createStreamInviteDirectly = async (
  invite: {
    email?: string
    user?: BasicTestUser
    userId?: string
    message?: string
    stream?: BasicTestStream
    streamId?: string
  },
  creatorId: string
): Promise<InviteResult> => {
  const userId = invite.userId || invite.user?.id || null
  const email = invite.email || null
  if (!userId && !email) throw new Error('Either user/userId or email must be set')

  const streamId = invite.streamId || invite.stream?.id

  const target = email || buildUserTarget(userId!)
  if (!target) throw new Error('Cannot create invite without a target')

  return await createAndSendInvite(
    {
      target,
      inviterId: creatorId,
      message: invite.message,
      primaryResourceTarget: {
        resourceType: streamId ? ProjectInviteResourceType : ServerInviteResourceType,
        resourceId: streamId || '',
        role: streamId ? Roles.Stream.Contributor : Roles.Server.User,
        primary: true
      }
    },
    null
  )
}

function getInviteTokenFromEmailParams(emailParams: SendEmailParams) {
  const { text } = emailParams
  const [, inviteId] = text.match(/\?token=(.*?)(\s|&)/i) || []
  return inviteId
}

export async function validateInviteExistanceFromEmail(emailParams: SendEmailParams) {
  const findInviteByToken = findInviteByTokenFactory({ db })

  // Validate that invite exists
  const token = getInviteTokenFromEmailParams(emailParams)
  expect(token).to.be.ok
  const invite = await findInviteByToken({ token })
  expect(invite).to.be.ok

  return invite
}
