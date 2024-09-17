import { getObjectCommitsWithStreamIds } from '@/modules/core/repositories/commits'
import {
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { listenFor, MessageType } from '@/modules/core/utils/dbNotificationListener'

const payloadRegexp = /^([\w\d]+):([\w\d]+):([\w\d]+)$/i

type MessageProcessorDeps = {
  getObjectCommitsWithStreamIds: typeof getObjectCommitsWithStreamIds
  publish: PublishSubscription
}

const messageProcessorFactory =
  (deps: MessageProcessorDeps) => async (msg: MessageType) => {
    if (msg.channel !== 'preview_generation_update') return
    const [, status, streamId, objectId] = payloadRegexp.exec(msg.payload) || [
      null,
      null,
      null,
      null
    ]

    if (status !== 'finished' || !objectId || !streamId) return

    // Get all commits with that objectId
    const commits = await deps.getObjectCommitsWithStreamIds([objectId], {
      streamIds: [streamId]
    })
    if (!commits.length) return

    await Promise.all(
      commits.map((c) =>
        deps.publish(ProjectSubscriptions.ProjectVersionsPreviewGenerated, {
          projectVersionsPreviewGenerated: {
            versionId: c.id,
            projectId: c.streamId,
            objectId
          }
        })
      )
    )
  }

export const listenForPreviewGenerationUpdatesFactory =
  (deps: MessageProcessorDeps) => () => {
    const messageProcessor = messageProcessorFactory(deps)
    listenFor('preview_generation_update', messageProcessor)
  }
