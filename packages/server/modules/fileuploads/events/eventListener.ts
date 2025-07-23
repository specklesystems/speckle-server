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

export const fileuploadTrackingFactory =
  ({
    getProject,
    getUser,
    mixpanel = getClient()
  }: {
    getProject: GetProject
    getUser: GetUser
    mixpanel?: MixpanelClient
  }) =>
  async (params: EventPayload<'fileupload.*'>) => {
    if (!mixpanel) return
    const {
      eventName,
      payload: { upload }
    } = params

    switch (eventName) {
      case FileuploadEvents.Started:
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
      default:
        throwUncoveredError(eventName)
    }
  }

export const initializeEventListenersFactory =
  ({ db }: { db: Knex }) =>
  () => {
    const eventBus = getEventBus()
    const quitCbs = [
      eventBus.listen('fileupload.*', async (payload) => {
        await fileuploadTrackingFactory({
          getProject: getProjectFactory({ db }),
          getUser: getUserFactory({ db })
        })(payload)
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
