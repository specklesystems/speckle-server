import { crossServerSyncLogger } from '@/logging/logging'
import {
  GetOnboardingBaseStream,
  MarkOnboardingBaseStream
} from '@/modules/core/domain/streams/operations'
import { GetFirstAdmin } from '@/modules/core/domain/users/operations'
import {
  DownloadProject,
  EnsureOnboardingProject,
  GetOnboardingBaseProject
} from '@/modules/cross-server-sync/domain/operations'
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

export const getOnboardingBaseProjectFactory =
  (deps: {
    getOnboardingBaseStream: GetOnboardingBaseStream
  }): GetOnboardingBaseProject =>
  async () => {
    const metadata = getMetadata()
    if (!metadata) {
      return undefined
    }

    return await deps.getOnboardingBaseStream(metadata.version)
  }

export const ensureOnboardingProjectFactory =
  (deps: {
    getOnboardingBaseStream: GetOnboardingBaseStream
    getFirstAdmin: GetFirstAdmin
    downloadProject: DownloadProject
    markOnboardingBaseStream: MarkOnboardingBaseStream
  }): EnsureOnboardingProject =>
  async () => {
    const logger = crossServerSyncLogger
    logger.info('Ensuring onboarding project is present...')

    const metadata = getMetadata()
    if (!metadata) {
      logger.info('No base onboarding stream configured through env vars...')
      return undefined
    }

    const [existingStream, admin] = await Promise.all([
      deps.getOnboardingBaseStream(metadata.version),
      deps.getFirstAdmin()
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

    const res = await deps.downloadProject(
      {
        projectUrl: metadata.url,
        authorId: admin.id,
        syncComments: true
      },
      { logger }
    )

    logger.info('Marking stream as onboarding base...')
    await deps.markOnboardingBaseStream(res.projectId, metadata.version)

    logger.info('Onboarding base stream created successfully!')

    return res.project
  }
