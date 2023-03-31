import { getObjectCommitsWithStreamIds } from '@/modules/core/repositories/commits'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'

const payloadRegexp = /^([\w\d]+):([\w\d]+):([\w\d]+)$/i

async function messageProcessor(msg: MessageType) {
  if (msg.channel !== 'preview_generation_update') return
  const [, status, streamId, objectId] = payloadRegexp.exec(msg.payload) || [
    null,
    null,
    null,
    null
  ]

  if (status !== 'finished' || !objectId || !streamId) return

  // Get all commits with that objectId
  const commits = await getObjectCommitsWithStreamIds([objectId])
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

export function listenForPreviewGenerationUpdates() {
  listenFor('preview_generation_update', messageProcessor)
}
