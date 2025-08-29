import { db } from '@/db/knex'
import {
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  SavedViewVisibility,
  type SavedView
} from '@/modules/viewer/domain/types/savedViews'
import { formatResourceIdsForGroup } from '@/modules/viewer/helpers/savedViews'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory,
  getSavedViewGroupFactory,
  getStoredViewCountFactory,
  recalculateGroupResourceIdsFactory,
  setNewHomeViewFactory,
  storeSavedViewFactory
} from '@/modules/viewer/repositories/savedViews'
import { createSavedViewFactory } from '@/modules/viewer/services/savedViewsManagement'
import { getViewerResourceGroupsFactory } from '@/modules/viewer/services/viewerResources'
import type { BasicTestUser } from '@/test/authHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { ViewerState } from '@speckle/shared/viewer'
import { inputToVersionedState } from '@speckle/shared/viewer/state'
import cryptoRandomString from 'crypto-random-string'
import { assign, merge, set } from 'lodash-es'
import type { PartialDeep } from 'type-fest'

export const fakeScreenshot =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PiQ2YQAAAABJRU5ErkJggg=='

export const fakeScreenshot2 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAICAgICAgICAgICAgICAwUDAwMDAwYEBAMFBQYGBQYGBwcICQoJCQkJCQoMCgsMDAwMDAwP/2wBDAwMDAwQDBAgEBAgQEBAgMCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgP/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAHEAP/EABQQAQAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8BP//EABQRAQAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8BP//Z'

export const buildFakeSerializedViewerState = (
  overrides?: PartialDeep<ViewerState.SerializedViewerState>
) =>
  merge(
    {},
    ViewerState.formatSerializedViewerState({
      projectId: cryptoRandomString({ length: 10 }),
      resources: {
        request: {
          resourceIdString: cryptoRandomString({ length: 10 })
        }
      },
      ui: {
        camera: {
          position: [0, 0, 0],
          target: [0, 0, 0]
        }
      }
    }),
    overrides || {}
  )

export const buildTestSavedView = (overrides?: Partial<SavedView>): SavedView => {
  const resourceIds = overrides?.resourceIds || [cryptoRandomString({ length: 10 })]
  const resourceIdString = resourceIds.join(',')
  const groupResourceIds = formatResourceIdsForGroup(resourceIdString)
  const projectId = overrides?.projectId || cryptoRandomString({ length: 10 })

  return assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      description: cryptoRandomString({ length: 10 }),
      projectId,
      authorId: cryptoRandomString({ length: 10 }),
      groupId: null,
      resourceIds,
      groupResourceIds,
      isHomeView: false,
      visibility: SavedViewVisibility.public,
      viewerState: inputToVersionedState(
        buildFakeSerializedViewerState({
          projectId,
          resources: {
            request: {
              resourceIdString
            }
          }
        })
      ),
      screenshot: fakeScreenshot,
      position: 0,
      createdAt: new Date(Date.now() - 10000),
      updatedAt: new Date(Date.now() - 10000)
    },
    overrides
  )
}

export const createTestSavedView = async (params?: {
  view?: Partial<SavedView>
  author?: BasicTestUser
  project?: BasicTestStream
}) => {
  const { author, project } = params || {}

  const view = buildTestSavedView({
    ...params?.view,
    ...(project ? { projectId: project.id } : {}),
    ...(author ? { authorId: author.id } : {})
  })

  const getViewerResourceGroups = getViewerResourceGroupsFactory({
    getStreamObjects: getStreamObjectsFactory({ db }),
    getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
    getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
    getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
    getAllBranchCommits: getAllBranchCommitsFactory({ db }),
    getBranchesByIds: getBranchesByIdsFactory({ db }),
    getSavedView: getSavedViewFactory({ db }),
    getModelHomeSavedView: getModelHomeSavedViewFactory({ db })
  })

  const createSavedView = createSavedViewFactory({
    getViewerResourceGroups,
    getStoredViewCount: getStoredViewCountFactory({ db }),
    storeSavedView: storeSavedViewFactory({ db }),
    getSavedViewGroup: getSavedViewGroupFactory({ db }),
    recalculateGroupResourceIds: recalculateGroupResourceIdsFactory({
      db
    }),
    setNewHomeView: setNewHomeViewFactory({
      db
    }),
    emit: getEventBus().emit
  })

  const createdView = await createSavedView({
    input: {
      ...view,
      resourceIdString: view.resourceIds.join(','),
      viewerState: view.viewerState.state
    },
    authorId: view.authorId!
  })

  // Mutate param before returning, in case its useful for someone
  if (params?.view) {
    for (const [key, val] of Object.entries(createdView)) {
      set(params.view, key, val)
    }
  }

  return createdView
}
