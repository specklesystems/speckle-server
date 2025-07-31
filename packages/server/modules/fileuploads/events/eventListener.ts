import type { EventPayload } from '@/modules/shared/services/eventBus'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type { MixpanelClient } from '@/modules/shared/utils/mixpanel'
import { getClient, MixpanelEvents } from '@/modules/shared/utils/mixpanel'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { throwUncoveredError } from '@speckle/shared'
import type { GetProject } from '@/modules/core/domain/projects/operations'
import type { Knex } from 'knex'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { getUserFactory } from '@/modules/core/repositories/users'
import type { ObserveResult } from '@/modules/fileuploads/observability/metrics'

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
