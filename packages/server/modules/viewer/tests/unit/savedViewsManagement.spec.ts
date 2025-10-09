import { expect } from 'chai'
import {
  createSavedViewFactory,
  createSavedViewGroupFactory,
  updateSavedViewFactory,
  updateSavedViewGroupFactory
} from '@/modules/viewer/services/savedViewsManagement'
import cryptoRandomString from 'crypto-random-string'
import type { SerializedViewerState } from '@speckle/shared/viewer/state'

describe('savedViewsManagement @viewer', () => {
  describe('createSavedViewFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const authorId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      const resourceObjectId = cryptoRandomString({ length: 10 })
      const SUT = createSavedViewFactory({
        storeSavedView: async (create) => {
          return {
            ...create.view,
            id: cryptoRandomString({ length: 10 }),
            description: create.view.description!,
            authorId,
            groupId: null,
            viewerState: {
              version: 0,
              state: emptyViewerState({ projectId, resourceIdString: resourceObjectId })
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        getViewerResourceGroups: async () => ({
          groups: [
            {
              identifier: cryptoRandomString({ length: 10 }),
              items: [
                {
                  objectId: resourceObjectId
                }
              ]
            }
          ],
          request: {},
          resourceIdString: ''
        }),
        getSavedViewGroup: async () => undefined,
        getStoredViewCount: async () => 0,
        recalculateGroupResourceIds: async () => ({
          id: '',
          authorId,
          projectId,
          resourceIds: [],
          name: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        downscaleScreenshotForThumbnail: async (s) => s.screenshot,
        setNewHomeView: async () => false,
        getNewViewSpecificPosition: async () => ({
          newPosition: 0,
          needsRebalancing: false
        }),
        rebalanceViewPositions: async () => 0,
        emit: async () => {}
      })

      const result = await SUT({
        input: {
          projectId,
          resourceIdString: resourceObjectId,
          name: '<script>alert("xss")</script>Safe view name',
          description: '<script>alert("xss")</script>Safe view description.',
          viewerState: emptyViewerState({
            projectId,
            resourceIdString: resourceObjectId
          }),
          screenshot: 'data:image/png;base64,foobar'
        },
        authorId: cryptoRandomString({ length: 10 })
      })
      expect(result.name).to.eq('Safe view name')
      expect(result.description).to.eq('Safe view description.')
    })
  })
  describe('createSavedViewGroupFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const resourceIdString = cryptoRandomString({ length: 10 })
      const SUT = createSavedViewGroupFactory({
        storeSavedViewGroup: async (create) => {
          return {
            id: cryptoRandomString({ length: 10 }),
            authorId: cryptoRandomString({ length: 10 }),
            projectId: cryptoRandomString({ length: 10 }),
            resourceIds: [],
            name: create.group.name!,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        getViewerResourceGroups: async () => ({
          groups: [
            {
              identifier: cryptoRandomString({ length: 10 }),
              items: [
                {
                  objectId: resourceIdString
                }
              ]
            }
          ],
          request: {},
          resourceIdString: ''
        }),
        getStoredViewGroupCount: async () => 0,
        emit: async () => {}
      })

      const result = await SUT({
        input: {
          projectId: cryptoRandomString({ length: 10 }),
          resourceIdString,
          groupName: '<script>alert("xss")</script>Safe group name'
        },
        authorId: cryptoRandomString({ length: 10 })
      })

      expect(result.name).to.eq('Safe group name')
    })
  })
  describe('updateSavedViewFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const authorId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      const resourceObjectId = cryptoRandomString({ length: 10 })
      const SUT = updateSavedViewFactory({
        updateSavedViewRecord: async (input) => {
          return {
            ...input.update,
            id: cryptoRandomString({ length: 10 }),
            projectId,
            name: input.update.name!,
            description: input.update.description!,
            authorId,
            groupId: null,
            resourceIds: [resourceObjectId],
            groupResourceIds: [resourceObjectId],
            isHomeView: false,
            visibility: 'authorOnly',
            screenshot: input.update.screenshot!,
            thumbnail: input.update.screenshot!,
            position: 0,
            viewerState: {
              version: 0,
              state: emptyViewerState({ projectId, resourceIdString: resourceObjectId })
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        getViewerResourceGroups: async () => ({
          groups: [
            {
              identifier: cryptoRandomString({ length: 10 }),
              items: [
                {
                  objectId: resourceObjectId
                }
              ]
            }
          ],
          request: {},
          resourceIdString: ''
        }),
        getSavedViewGroup: async () => undefined,
        getSavedView: async () => ({
          id: cryptoRandomString({ length: 10 }),
          projectId,
          name: 'Old name',
          description: 'Old description',
          authorId,
          groupId: null,
          resourceIds: [resourceObjectId],
          groupResourceIds: [resourceObjectId],
          isHomeView: false,
          visibility: 'authorOnly',
          viewerState: {
            version: 0,
            state: emptyViewerState({ projectId, resourceIdString: resourceObjectId })
          },
          screenshot: 'data:image/png;base64,oldthumbnail',
          thumbnail: 'data:image/png;base64,oldthumbnail',
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        recalculateGroupResourceIds: async () => ({
          id: '',
          authorId,
          projectId,
          resourceIds: [],
          name: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        downscaleScreenshotForThumbnail: async (s) => s.screenshot,
        setNewHomeView: async () => false,
        getNewViewSpecificPosition: async () => ({
          newPosition: 0,
          needsRebalancing: false
        }),
        rebalanceViewPositions: async () => 0,
        emit: async () => {}
      })

      const result = await SUT({
        userId: authorId,
        input: {
          id: cryptoRandomString({ length: 10 }),
          projectId,
          name: '<script>alert("xss")</script>Safe view name',
          description: '<script>alert("xss")</script>Safe view description.'
        }
      })
      expect(result.name).to.eq('Safe view name')
      expect(result.description).to.eq('Safe view description.')
    })
  })
  describe('updateSavedViewGroupFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const authorId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      const groupId = cryptoRandomString({ length: 10 })
      const resourceIdString = cryptoRandomString({ length: 10 })
      const SUT = updateSavedViewGroupFactory({
        updateSavedViewGroupRecord: async (input) => {
          return {
            id: groupId,
            authorId,
            projectId,
            resourceIds: [],
            name: input.update.name!,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        getSavedViewGroup: async () => ({
          id: groupId,
          authorId,
          projectId,
          name: 'Old name',
          resourceIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          identifier: cryptoRandomString({ length: 10 }),
          items: [
            {
              objectId: resourceIdString
            }
          ]
        }),
        emit: async () => {}
      })

      const response = await SUT({
        input: {
          groupId,
          projectId,
          name: '<script>alert("xss")</script>Safe group name'
        },
        userId: cryptoRandomString({ length: 10 })
      })
      expect(response.name).to.eq('Safe group name')
    })
  })
})

const emptyViewerState = (params: {
  projectId: string
  resourceIdString: string
}): SerializedViewerState => ({
  projectId: params.projectId,
  sessionId: cryptoRandomString({ length: 10 }),
  viewer: {
    metadata: {
      filteringState: null
    }
  },
  resources: {
    request: {
      resourceIdString: params.resourceIdString,
      threadFilters: {}
    }
  },
  ui: {
    threads: {
      openThread: {
        threadId: null,
        isTyping: false,
        newThreadEditor: false
      }
    },
    diff: {
      command: null,
      time: 0,
      mode: 0
    },
    spotlightUserSessionId: null,
    filters: {
      isolatedObjectIds: [],
      hiddenObjectIds: [],
      /** Map of object id => application id or null, if no application id */
      selectedObjectApplicationIds: {},
      propertyFilters: [],
      activeColorFilterId: null,
      filterLogic: ''
    },
    camera: {
      position: [],
      target: [],
      isOrthoProjection: true,
      zoom: 0
    },
    viewMode: {
      mode: 0,
      edgesEnabled: false,
      edgesWeight: 0,
      outlineOpacity: 0,
      edgesColor: 0
    },
    sectionBox: null,
    lightConfig: {},
    explodeFactor: 0,
    selection: null,
    measurement: {
      enabled: false,
      options: null,
      measurements: []
    }
  }
})
