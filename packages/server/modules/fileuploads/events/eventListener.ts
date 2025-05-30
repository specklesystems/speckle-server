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
    const { eventName, payload } = params

    switch (eventName) {
      case FileuploadEvents.Started:
        const project = await getProject({ projectId: payload.projectId })
        const user = await getUser(payload.userId)
        await mixpanel.track({
          eventName: MixpanelEvents.FileUploadStarted,
          userEmail: user?.email,
          workspaceId: project?.workspaceId,
          payload: {
            fileSize: payload.fileSize,
            fileType: payload.fileType
          }
        })
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
