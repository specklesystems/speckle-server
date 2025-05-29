import { EventPayload, getEventBus } from '@/modules/shared/services/eventBus'
import {
  getBaseTrackingProperties,
  getClient,
  GetUserTrackingProperties,
  getUserTrackingPropertiesFactory,
  MixpanelEvents,
  WORKSPACE_TRACKING_ID_KEY
} from '@/modules/shared/utils/mixpanel'
import { getFeatureFlags } from '@speckle/shared/environment'
import { Mixpanel } from 'mixpanel'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { throwUncoveredError } from '@speckle/shared'
import { assign } from 'lodash'
import { GetProject } from '@/modules/core/domain/projects/operations'
import { Knex } from 'knex'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import { findPrimaryEmailForUserFactory } from '@/modules/core/repositories/userEmails'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

export const fileuploadTrackingFactory =
  ({
    getProject,
    getUserTrackingProperties,
    mixpanel = getClient(),
    getServerTrackingProperties = getBaseTrackingProperties
  }: {
    getProject: GetProject
    getUserTrackingProperties: GetUserTrackingProperties
    mixpanel?: Mixpanel
    getServerTrackingProperties?: typeof getBaseTrackingProperties
  }) =>
  async (params: EventPayload<'fileupload.*'>) => {
    if (!FF_BILLING_INTEGRATION_ENABLED) return
    if (!mixpanel) return
    const { eventName, payload } = params

    switch (eventName) {
      case FileuploadEvents.Started:
        const project = await getProject({ projectId: payload.projectId })

        mixpanel.track(
          MixpanelEvents.FileUploadStarted,
          assign(
            {
              fileSize: payload.fileSize,
              fileType: payload.fileType
            },
            project?.workspaceId && {
              [WORKSPACE_TRACKING_ID_KEY]: project?.workspaceId
            },
            await getUserTrackingProperties({ userId: payload.userId }),
            getServerTrackingProperties()
          )
        )
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
          getUserTrackingProperties: getUserTrackingPropertiesFactory({
            findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db })
          })
        })(payload)
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
