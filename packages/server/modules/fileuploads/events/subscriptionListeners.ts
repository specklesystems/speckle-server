import { GetBranchById } from '@/modules/core/domain/branches/operations'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  FileImportSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

const reportFileUploadStartedFactory =
  (deps: { publish: PublishSubscription; getBranchById: GetBranchById }) =>
  async (payload: EventPayload<typeof FileuploadEvents.Started>) => {
    const {
      payload: { upload }
    } = payload

    const model = upload.modelId ? await deps.getBranchById(upload.modelId) : null
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
        projectId: upload.streamId,
        branchName: model.name
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

export const reportSubscriptionEventsFactory =
  (
    deps: {
      eventListen: EventBusListen
      publish: PublishSubscription
    } & DependenciesOf<typeof reportFileUploadStartedFactory>
  ) =>
  () => {
    const reportFileUploadStarted = reportFileUploadStartedFactory(deps)

    const quitCbs = [
      deps.eventListen(FileuploadEvents.Started, reportFileUploadStarted)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
