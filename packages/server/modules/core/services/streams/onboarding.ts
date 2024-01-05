import { Optional } from '@speckle/shared'
import { StreamCloneError } from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { getOnboardingBaseProject } from '@/modules/cross-server-sync/services/onboardingProject'
import { updateStream } from '../../repositories/streams'
import { getUserById } from '../users'

export async function createOnboardingStream(targetUserId: string) {
  const user = await getUserById({ userId: targetUserId })
  if (!user) throw new Error('User not found.')

  const sourceStream = await getOnboardingBaseProject()
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
    newStream = await createStreamReturnRecord({ ownerId: targetUserId })
  }

  logger.info('Updating onboarding stream title')
  const name = user.name.split(' ')[0]
  await updateStream({ id: newStream.id, name: `${name}'s First Project` })
  logger.info('Done updating onboarding stream title')
  return newStream
}
