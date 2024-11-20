import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'
import { MessageType } from '@/modules/core/utils/dbNotificationListener'
import { getObjectCommitsWithStreamIdsFactory } from '@/modules/core/repositories/commits'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

const payloadRegexp = /^([\w\d]+):([\w\d]+):([\w\d]+)$/i

export const messageProcessor = async (msg: MessageType) => {
  if (msg.channel !== 'preview_generation_update') return
  const [, status, streamId, objectId] = payloadRegexp.exec(msg.payload) || [
    null,
    null,
    null,
    null
  ]

  if (status !== 'finished' || !objectId || !streamId) return

  // Get all commits with that objectId
  const projectDb = await getProjectDbClient({ projectId: streamId })
  const commits = await getObjectCommitsWithStreamIdsFactory({ db: projectDb })(
    [objectId],
    {
      streamIds: [streamId]
    }
  )
  if (!commits.length) return

  await Promise.all(
    commits.map((c) =>
      publish(ProjectSubscriptions.ProjectVersionsPreviewGenerated, {
        projectVersionsPreviewGenerated: {
          versionId: c.id,
          projectId: c.streamId,
          objectId
        }
      })
    )
  )
}
