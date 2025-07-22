import { EventPayload, getEventBus } from '@/modules/shared/services/eventBus'
import {
  getClient,
  MixpanelClient,
  MixpanelEvents
} from '@/modules/shared/utils/mixpanel'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { throwUncoveredError } from '@speckle/shared'
import { GetProject } from '@/modules/core/domain/projects/operations'
import { Knex } from 'knex'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import { GetUser } from '@/modules/core/domain/users/operations'
import { getUserFactory } from '@/modules/core/repositories/users'
import { ObserveResult } from '@/modules/fileuploads/observability/metrics'

export const fileuploadTrackingFactory =
  ({
    getProject,
    getUser,
    observeResult,
    mixpanel = getClient()
  }: {
    getProject: GetProject
    getUser: GetUser
    observeResult?: ObserveResult
    mixpanel?: MixpanelClient
  }) =>
  async (params: EventPayload<'fileupload.*'>) => {
    const { eventName } = params

    switch (eventName) {
      case FileuploadEvents.Started:
        if (!mixpanel) return
        const {
          payload: { upload }
        } = params
        const project = await getProject({ projectId: upload.projectId })
        const user = await getUser(upload.userId)
        await mixpanel.track({
          eventName: MixpanelEvents.FileUploadStarted,
          userEmail: user?.email,
          workspaceId: project?.workspaceId,
          payload: {
            fileSize: upload.fileSize,
            fileType: upload.fileType
          }
        })
        break
      case FileuploadEvents.Updated:
        break
      case FileuploadEvents.Finished:
        observeResult?.(params.payload)
        break
      default:
        throwUncoveredError(eventName)
    }
  }

export const initializeEventListenersFactory =
  ({ db, observeResult }: { db: Knex; observeResult?: ObserveResult }) =>
  () => {
    const eventBus = getEventBus()
    const quitCbs = [
      eventBus.listen('fileupload.*', async (payload) => {
        await fileuploadTrackingFactory({
          getProject: getProjectFactory({ db }),
          getUser: getUserFactory({ db }),
          observeResult
        })(payload)
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
