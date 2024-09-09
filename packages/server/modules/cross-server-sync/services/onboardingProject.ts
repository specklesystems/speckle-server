import { crossServerSyncLogger } from '@/logging/logging'
import {
  createCommentReplyAndNotify,
  createCommentThreadAndNotify
} from '@/modules/comments/services/management'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getObject } from '@/modules/core/repositories/objects'
import {
  getOnboardingBaseStream,
  getStream,
  getStreamCollaborators,
  markOnboardingBaseStream
} from '@/modules/core/repositories/streams'
import { getFirstAdmin, getUser } from '@/modules/core/repositories/users'
import { createBranchAndNotify } from '@/modules/core/services/branch/management'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import { createObject } from '@/modules/core/services/objects'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { downloadCommitFactory } from '@/modules/cross-server-sync/services/commit'
import { downloadProjectFactory } from '@/modules/cross-server-sync/services/project'
import {
  getOnboardingStreamCacheBustNumber,
  getOnboardingStreamUrl
} from '@/modules/shared/helpers/envHelper'

const getMetadata = () => {
  const url = getOnboardingStreamUrl()
  const cacheBustNumber = getOnboardingStreamCacheBustNumber()
  if (!url) return null

  const version = `${url}:::${cacheBustNumber}`
  return { url, cacheBustNumber, version }
}

export async function getOnboardingBaseProject() {
  const metadata = getMetadata()
  if (!metadata) {
    return undefined
  }

  return await getOnboardingBaseStream(metadata.version)
}

export async function ensureOnboardingProject() {
  const logger = crossServerSyncLogger
  logger.info('Ensuring onboarding project is present...')

  const metadata = getMetadata()
  if (!metadata) {
    logger.info('No base onboarding stream configured through env vars...')
    return undefined
  }

  const [existingStream, admin] = await Promise.all([
    getOnboardingBaseStream(metadata.version),
    getFirstAdmin()
  ])
  if (existingStream) {
    logger.info('Onboarding stream already exists, skipping...')
    return existingStream
  }
  if (!admin) {
    logger.info('No admin user found, skipping onboarding stream creation...')
    return undefined
  }

  logger.info('Onboarding stream not found, pulling from target server...')

  const downloadProject = downloadProjectFactory({
    downloadCommit: downloadCommitFactory({
      getStream,
      getStreamBranchByName,
      getStreamCollaborators,
      getUser,
      createCommitByBranchId,
      createObject,
      getObject,
      createCommentThreadAndNotify,
      createCommentReplyAndNotify
    }),
    createStreamReturnRecord,
    getUser,
    getStreamBranchByName,
    createBranchAndNotify
  })
  const res = await downloadProject(
    {
      projectUrl: metadata.url,
      authorId: admin.id,
      syncComments: true
    },
    { logger }
  )

  logger.info('Marking stream as onboarding base...')
  await markOnboardingBaseStream(res.projectId, metadata.version)

  logger.info('Onboarding base stream created successfully!')

  return res.project
}
