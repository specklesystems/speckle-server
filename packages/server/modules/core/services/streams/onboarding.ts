import { Optional } from '@speckle/shared'
import {
  StreamCloneError,
  StreamInvalidAccessError
} from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { getOnboardingBaseProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import {
  getOnboardingBaseStream,
  updateStream
} from '@/modules/core/repositories/streams'
import { getUser } from '@/modules/core/services/users'
import {
  ContextResourceAccessRules,
  isNewResourceAllowed
} from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'

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
