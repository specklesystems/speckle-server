import { crossServerSyncLogger } from '@/logging/logging'
import {
  getOnboardingBaseStream,
  markOnboardingBaseStream
} from '@/modules/core/repositories/streams'
import { getFirstAdmin } from '@/modules/core/repositories/users'
import { downloadProject } from '@/modules/cross-server-sync/services/project'
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
    logger.debug('Onboarding stream already exists, skipping...')
    return existingStream
  }
  if (!admin) {
    logger.info('No admin user found, skipping onboarding stream creation...')
    return undefined
  }

  logger.debug('Onboarding stream not found, pulling from target server...')
  const res = await downloadProject(
    {
      projectUrl: metadata.url,
      authorId: admin.id,
      syncComments: true
    },
    { logger }
  )

  logger.debug('Marking stream as onboarding base...')
  await markOnboardingBaseStream(res.projectId, metadata.version)

  logger.info('Onboarding base stream created successfully!')

  return res.project
}
