import { moduleLogger } from '@/logging/logging'
import {
  getViewerE2eTestStream,
  markStreamViewerE2eTest
} from '@/modules/core/repositories/streams'
import { getFirstUser } from '@/modules/core/repositories/users'
import { ProjectVisibility } from '@/test/graphql/generated/graphql'
import { downloadCommit } from '@/modules/cli/services/download/commit'
import { getStreamCommitsWithBranchId } from '@/modules/core/repositories/commits'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'

const version = '1.0'
const commits = [
  'https://latest.speckle.systems/projects/92b620fb17/models/76fd8a01c8@eb39048a8e',
  'https://latest.speckle.systems/projects/92b620fb17/models/76fd8a01c8@91048318e8',
  'https://latest.speckle.systems/projects/92b620fb17/models/76fd8a01c8@bb744f570b'
]

/**
 * Used to seed in a standard test stream for viewer e2e tests
 */
export async function seedViewerE2eTestStream() {
  const logger = moduleLogger.child({ func: 'seedViewerE2eTestStream' })

  const stream = await getViewerE2eTestStream(version)
  if (stream) {
    logger.debug('Viewer e2e test stream already exists, skipping creation...')
    const commits = await getStreamCommitsWithBranchId(stream.id)
    return {
      streamId: stream.id,
      commits: commits.map((c) => ({ commitId: c.id, branchId: c.branchId }))
    }
  }

  logger.debug('Creating viewer e2e test stream...')
  const author = await getFirstUser()
  if (!author) {
    throw new Error('Could not find first server user')
  }

  const newStream = await createStreamReturnRecord({
    description: 'Viewer e2e test stream, version ' + version,
    name: 'Viewer e2e test stream - ' + version,
    visibility: ProjectVisibility.Public,
    ownerId: author.id
  })

  const commitsRes = []
  logger.debug(`Adding ${commits.length} commits to viewer e2e test stream...`)
  for (const commitUrl of commits) {
    const res = await downloadCommit(
      {
        commitUrl,
        targetStreamId: newStream.id,
        commentAuthorId: author.id,
        branchName: 'main'
      },
      { logger }
    )
    commitsRes.push({ commitId: res.commitId, branchId: res.branchId })
  }

  logger.debug('Marking stream as e2e test stream...')
  await markStreamViewerE2eTest(newStream.id, version)

  logger.debug('Viewer e2e test stream created successfully')

  return {
    streamId: newStream.id,
    commits: commitsRes
  }
}
