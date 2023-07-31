import { Optional } from '@speckle/shared'
import { StreamCloneError } from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { getOnboardingBaseProject } from '@/modules/cross-server-sync/services/onboardingProject'

export async function createOnboardingStream(targetUserId: string) {
  const sourceStream = await getOnboardingBaseProject()

  if (sourceStream) {
    let newStream: Optional<StreamRecord> = undefined
    try {
      newStream = await cloneStream(targetUserId, sourceStream.id)
    } catch (e) {
      if (!(e instanceof StreamCloneError)) {
        throw e
      } else {
        logger.warn(e, 'Stream clone failed')
      }
    }

    if (newStream) return newStream
  }

  // clone failed, just create empty stream
  return await createStreamReturnRecord({ ownerId: targetUserId })
}
