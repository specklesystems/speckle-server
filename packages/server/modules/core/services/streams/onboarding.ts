import { Nullable, Optional } from '@speckle/shared'
import { getOnboardingStreamId } from '@/modules/shared/helpers/envHelper'
import { StreamCloneError } from '@/modules/core/errors/stream'
import { cloneStream } from '@/modules/core/services/streams/clone'
import { StreamRecord } from '@/modules/core/helpers/types'
import { logger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'

async function cloneOnboardingStream(userId: string, sourceStreamId: Nullable<string>) {
  if (!sourceStreamId) {
    throw new StreamCloneError('Onboarding stream ID undefined, check env vars')
  }

  return await cloneStream(userId, sourceStreamId)
}

export async function createOnboardingStream(targetUserId: string) {
  const sourceStreamId = getOnboardingStreamId()

  let newStream: Optional<StreamRecord> = undefined
  try {
    newStream = await cloneOnboardingStream(targetUserId, sourceStreamId)
  } catch (e) {
    if (!(e instanceof StreamCloneError)) {
      throw e
    } else {
      logger.warn(e, 'Stream clone failed')
    }
  }

  if (newStream) return newStream

  // clone failed, just create empty stream
  return await createStreamReturnRecord({ ownerId: targetUserId })
}
