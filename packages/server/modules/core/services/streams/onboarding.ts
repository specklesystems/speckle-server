import { Optional } from '@speckle/shared'
import {
  StreamCloneError,
  StreamInvalidAccessError
} from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { getOnboardingBaseProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import {
  createStreamFactory,
  getOnboardingBaseStream,
  getStreamFactory,
  updateStreamFactory
} from '@/modules/core/repositories/streams'
import { getUser } from '@/modules/core/services/users'
import {
  ContextResourceAccessRules,
  isNewResourceAllowed
} from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { createStreamReturnRecordFactory } from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { db } from '@/db/knex'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getUsers } from '@/modules/core/repositories/users'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { addStreamCreatedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'

export async function createOnboardingStream(
  targetUserId: string,
  targetUserResourceAccessRules: ContextResourceAccessRules
) {
  const canCreateStream = isNewResourceAllowed({
    resourceType: TokenResourceIdentifierType.Project,
    resourceAccessRules: targetUserResourceAccessRules
  })
  if (!canCreateStream) {
    throw new StreamInvalidAccessError(
      'You do not have the permissions to create a new stream'
    )
  }

  const updateStream = updateStreamFactory({ db })
  const addStreamCreatedActivity = addStreamCreatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
  const getStream = getStreamFactory({ db })
  const createStreamReturnRecord = createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
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
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })

  const sourceStream = await getOnboardingBaseProjectFactory({
    getOnboardingBaseStream
  })()
  // clone from base
  let newStream: Optional<StreamRecord> = undefined
  if (sourceStream) {
    try {
      logger.info('Cloning onboarding stream')
      newStream = await cloneStream(targetUserId, sourceStream.id)
      logger.info('Done cloning onboarding stream')
    } catch (e) {
      if (!(e instanceof StreamCloneError)) {
        throw e
      } else {
        logger.warn(e, 'Onboarding stream clone failed')
      }
    }
  }

  // clone failed, just create empty stream
  if (!newStream) {
    logger.warn('Fallback: Creating a blank stream for onboarding')
    newStream = await createStreamReturnRecord({
      ownerId: targetUserId,
      ownerResourceAccessRules: targetUserResourceAccessRules
    })
  }

  logger.info('Updating onboarding stream title')
  const user = await getUser(targetUserId)
  const name = user.name.split(' ')[0]
  await updateStream({
    id: newStream.id,
    name: `${name}'s First Project`,
    description: `Welcome to Speckle! This is your sample project, designed by Beijia Gu - feel free to do whatever you want with it!`
  })
  logger.info('Done updating onboarding stream title')
  return newStream
}
