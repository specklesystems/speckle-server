import type { GetProjectModelById } from '@/modules/core/domain/branches/operations'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import type { PublishSubscription } from '@/modules/shared/utils/subscriptions'
import { FileImportSubscriptions } from '@/modules/shared/utils/subscriptions'

const reportFileUploadStartedFactory =
  (deps: { publish: PublishSubscription; getProjectModelById: GetProjectModelById }) =>
  async (payload: EventPayload<typeof FileuploadEvents.Started>) => {
    const {
      payload: { upload }
    } = payload

    const projectId = upload.streamId || upload.projectId
    const model = upload.modelId
      ? await deps.getProjectModelById({ modelId: upload.modelId, projectId })
      : null

    if (!model) {
      await deps.publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
        projectPendingModelsUpdated: {
          id: upload.id,
          type: ProjectPendingModelsUpdatedMessageType.Created,
          model: upload
        },
        projectId: upload.streamId
      })
    } else {
      await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: upload.id,
          type: ProjectPendingVersionsUpdatedMessageType.Created,
          version: upload
        },
        projectId: upload.streamId
      })
    }

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: upload.id,
        type: ProjectFileImportUpdatedMessageType.Created,
        upload
      },
      projectId: upload.projectId
    })
  }

const reportFileUploadUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof FileuploadEvents.Updated>) => {
    const {
      payload: { upload, isNewModel }
    } = payload

    if (isNewModel || !upload.modelId) {
      await deps.publish(FileImportSubscriptions.ProjectPendingModelsUpdated, {
        projectPendingModelsUpdated: {
          id: upload.id,
          type: ProjectPendingModelsUpdatedMessageType.Updated,
          model: upload
        },
        projectId: upload.projectId
      })
    } else {
      await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
        projectPendingVersionsUpdated: {
          id: upload.id,
          type: ProjectPendingVersionsUpdatedMessageType.Updated,
          version: upload
        },
        projectId: upload.projectId
      })
    }

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: upload.id,
        type: ProjectFileImportUpdatedMessageType.Updated,
        upload
      },
      projectId: upload.projectId
    })
  }

export const reportSubscriptionEventsFactory =
  (
    deps: {
      eventListen: EventBusListen
      publish: PublishSubscription
    } & DependenciesOf<typeof reportFileUploadStartedFactory> &
      DependenciesOf<typeof reportFileUploadUpdatedFactory>
  ) =>
  () => {
    const reportFileUploadStarted = reportFileUploadStartedFactory(deps)
    const reportFileUploadUpdated = reportFileUploadUpdatedFactory(deps)

    const quitCbs = [
      deps.eventListen(FileuploadEvents.Started, reportFileUploadStarted),
      deps.eventListen(FileuploadEvents.Updated, reportFileUploadUpdated)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
