import { MaybeAsync, Roles, StreamRoles } from '@speckle/shared'

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
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  ProjectInviteResourceType,
  ServerInviteResourceType
} from '@/modules/serverinvites/domain/constants'
import { SendEmailParams } from '@/modules/emails/services/sending'
import { db } from '@/db/knex'
import { expect } from 'chai'
import {
  PrimaryInviteResourceTarget,
  ServerInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const createAndSendInvite = createAndSendInviteFactory({
  findUserByTarget: findUserByTargetFactory({ db }),
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
    }),
  getUser,
  getServerInfo
})

export const createServerInviteDirectly = async (
  invite: { email: string; message?: string },
  creatorId: string
) => {
  const { email, message } = invite
  const primaryResourceTarget: PrimaryInviteResourceTarget<ServerInviteResourceTarget> =
    {
      resourceType: ServerInviteResourceType,
      role: Roles.Server.User,
      primary: true,
      resourceId: ''
    }

  return await createAndSendInvite(
    {
      target: email,
      inviterId: creatorId,
      message,
      primaryResourceTarget
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
    role?: StreamRoles
  },
  creatorId: string
): Promise<InviteResult> => {
  const userId = invite.userId || invite.user?.id || null
  const email = invite.email || null
  if (!userId && !email) throw new Error('Either user/userId or email must be set')

  const streamId = invite.streamId || invite.stream?.id
  const streamRole = invite.role || Roles.Stream.Contributor

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
        role: streamId ? streamRole : Roles.Server.User,
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

  return invite!
}

/**
 * Mock out the email service and capture the created invite record from that as its
 * created through whatever logic is passed in the createInvite function
 */
export const captureCreatedInvite = async (createInvite: () => MaybeAsync<unknown>) => {
  const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
    'sendEmail',
    async () => true
  )

  await Promise.resolve(createInvite())

  expect(sendEmailInvocations.args).to.have.lengthOf(1)
  const emailParams = sendEmailInvocations.args[0][0]
  expect(emailParams).to.be.ok

  return await validateInviteExistanceFromEmail(emailParams)
}
