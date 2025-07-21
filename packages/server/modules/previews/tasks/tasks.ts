import {
  getPrivateObjectsServerOrigin,
  getServerOrigin,
  previewServiceShouldUsePrivateObjectsServerUrl
} from '@/modules/shared/helpers/envHelper'
import type { Queue } from 'bull'
import {
  getNumberOfJobsInQueueFactory,
  requestObjectPreviewFactory
} from '@/modules/previews/queues/previews'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import {
  getPaginatedObjectPreviewInErrorStateFactory,
  retryFailedPreviewsFactory
} from '@/modules/previews/services/retryErrors'
import { getStreamCollaboratorsFactory } from '@/modules/core/repositories/streams'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { db } from '@/db/knex'
import {
  getPaginatedObjectPreviewsPageFactory,
  getPaginatedObjectPreviewsTotalCountFactory,
  updateObjectPreviewFactory
} from '@/modules/previews/repository/previews'

export const scheduleRetryFailedPreviews = async ({
  scheduleExecution,
  previewRequestQueue,
  responseQueueName,
  cronExpression
}: {
  scheduleExecution: ScheduleExecution
  previewRequestQueue: Queue
  responseQueueName: string
  cronExpression: string
}) => {
  const previewResurrectionHandlers: ReturnType<typeof retryFailedPreviewsFactory>[] =
    []
  const regionClients = await getAllRegisteredDbClients()
  for (const config of regionClients) {
    const projectDb = config.client
    previewResurrectionHandlers.push(
      retryFailedPreviewsFactory({
        getPaginatedObjectPreviewsInErrorState:
          getPaginatedObjectPreviewInErrorStateFactory({
            getPaginatedObjectPreviewsPage: getPaginatedObjectPreviewsPageFactory({
              db: projectDb
            }),
            getPaginatedObjectPreviewsTotalCount:
              getPaginatedObjectPreviewsTotalCountFactory({
                db: projectDb
              })
          }),
        updateObjectPreview: updateObjectPreviewFactory({
          db: projectDb
        }),
        requestObjectPreview: requestObjectPreviewFactory({
          queue: previewRequestQueue,
          responseQueue: responseQueueName
        }),
        serverOrigin: previewServiceShouldUsePrivateObjectsServerUrl()
          ? getPrivateObjectsServerOrigin()
          : getServerOrigin(),
        getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
        createAppToken: createAppTokenFactory({
          storeApiToken: storeApiTokenFactory({ db }),
          storeTokenScopes: storeTokenScopesFactory({ db }),
          storeTokenResourceAccessDefinitions:
            storeTokenResourceAccessDefinitionsFactory({
              db
            }),
          storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
        }),
        getNumberOfJobsInQueue: getNumberOfJobsInQueueFactory({
          queue: previewRequestQueue
        }),
        region: config.regionKey
      })
    )
  }

  return scheduleExecution(
    cronExpression,
    'PreviewResurrection',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        previewResurrectionHandlers.map(async (handler) => {
          await handler({
            logger
          })
          return handler
        })
      )
    }
  )
}
