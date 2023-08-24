import { Optional } from '@speckle/shared'
import { StreamCloneError } from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { getOnboardingBaseProject } from '@/modules/cross-server-sync/services/onboardingProject'
import {
  getUserOnboardingStream,
  markUserOnboardingStream
} from '@/modules/core/repositories/streams'

export async function createOnboardingStream(targetUserId: string) {
  const sourceStream = await getOnboardingBaseProject()

  // clone from base
  let newStream: Optional<StreamRecord> = undefined
  if (sourceStream) {
    try {
      newStream = await cloneStream(targetUserId, sourceStream.id)
    } catch (e) {
      if (!(e instanceof StreamCloneError)) {
        throw e
      } else {
        logger.warn(e, 'Stream clone failed')
      }
    }
  }

  // clone failed, just create empty stream
  if (!newStream) {
    newStream = await createStreamReturnRecord({ ownerId: targetUserId })
  }

  // mark as onboarding stream
  await markUserOnboardingStream(targetUserId, newStream.id)

  return newStream
}

export async function ensureOnboardingStream(targetUserId: string) {
  return (
    (await getUserOnboardingStream(targetUserId)) ||
    (await createOnboardingStream(targetUserId))
  )
}
