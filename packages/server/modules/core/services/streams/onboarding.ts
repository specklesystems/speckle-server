import { Optional } from '@speckle/shared'
import {
  StreamCloneError,
  StreamInvalidAccessError
} from '@/modules/core/errors/stream'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import {
  ContextResourceAccessRules,
  isNewResourceAllowed
} from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import {
  CloneStream,
  CreateOnboardingStream,
  CreateStream,
  UpdateStreamRecord
} from '@/modules/core/domain/streams/operations'
import { GetOnboardingBaseProject } from '@/modules/cross-server-sync/domain/operations'
import { GetUser } from '@/modules/core/domain/users/operations'

export const createOnboardingStreamFactory =
  (deps: {
    getOnboardingBaseProject: GetOnboardingBaseProject
    cloneStream: CloneStream
    createStreamReturnRecord: CreateStream
    getUser: GetUser
    updateStream: UpdateStreamRecord
  }): CreateOnboardingStream =>
  async (
    targetUserId: string,
    targetUserResourceAccessRules: ContextResourceAccessRules
  ) => {
    const canCreateStream = isNewResourceAllowed({
      resourceType: TokenResourceIdentifierType.Project,
      resourceAccessRules: targetUserResourceAccessRules
    })
    if (!canCreateStream) {
      throw new StreamInvalidAccessError(
        'You do not have the permissions to create a new stream'
      )
    }

    const sourceStream = await deps.getOnboardingBaseProject()
    // clone from base
    let newStream: Optional<StreamRecord> = undefined
    if (sourceStream) {
      try {
        logger.info('Cloning onboarding stream')
        newStream = await deps.cloneStream(targetUserId, sourceStream.id)
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
      newStream = await deps.createStreamReturnRecord({
        ownerId: targetUserId,
        ownerResourceAccessRules: targetUserResourceAccessRules
      })
    }

    logger.info('Updating onboarding stream title')
    const user = await deps.getUser(targetUserId)
    const name = user!.name.split(' ')[0]
    await deps.updateStream({
      id: newStream.id,
      name: `${name}'s First Project`,
      description: `Welcome to Speckle! This is your sample project, designed by Beijia Gu - feel free to do whatever you want with it!`
    })
    logger.info('Done updating onboarding stream title')
    return newStream
  }
