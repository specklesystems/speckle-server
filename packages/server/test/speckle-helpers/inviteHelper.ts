import { MaybeAsync, Roles, StreamRoles } from '@speckle/shared'

import { buildUserTarget } from '@/modules/serverinvites/helpers/core'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteByTokenFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
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
import { sendEmail, SendEmailParams } from '@/modules/emails/services/sending'
import { db } from '@/db/knex'
import { expect } from 'chai'
import {
  PrimaryInviteResourceTarget,
  ServerInviteRecord,
  ServerInviteResourceTarget
} from '@/modules/serverinvites/domain/types'
import {
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { createEmailListener } from '@/test/speckle-helpers/email'
import type Mail from 'nodemailer/lib/mailer'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

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
  getServerInfo,
  finalizeInvite: buildFinalizeProjectInvite()
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
): Promise<ServerInviteRecord> => {
  const userId = invite.userId || invite.user?.id || null
  const email = invite.email || null
  if (!userId && !email) throw new Error('Either user/userId or email must be set')

  const streamId = invite.streamId || invite.stream?.id
  const streamRole = invite.role || Roles.Stream.Contributor

  const target = email || buildUserTarget(userId!)
  if (!target) throw new Error('Cannot create invite without a target')

  return await captureCreatedInvite(
    async () =>
      await createAndSendInvite(
        {
          target,
          inviterId: creatorId,
          message: invite.message,
          primaryResourceTarget: {
            resourceType: streamId
              ? ProjectInviteResourceType
              : ServerInviteResourceType,
            resourceId: streamId || '',
            role: streamId ? streamRole : Roles.Server.User,
            primary: true
          }
        },
        null
      )
  )
}

function getInviteTokenFromEmailParams(emailParams: SendEmailParams | Mail.Options) {
  const { text } = emailParams
  const [, inviteId] = (text?.toString() || '').match(/\?token=(.*?)(\s|&)/i) || []
  return inviteId
}

export async function validateInviteExistanceFromEmail(
  emailParams: SendEmailParams | Mail.Options
) {
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
  const emailListener = await createEmailListener({ destroyWhenNoListeners: true })
  const { getSends } = emailListener.listen({ times: 1 })

  await Promise.resolve(createInvite())

  const emails = getSends()
  expect(emails).to.have.lengthOf(1)
  const emailParams = emails[0]
  expect(emailParams).to.be.ok

  return await validateInviteExistanceFromEmail(emailParams)
}
