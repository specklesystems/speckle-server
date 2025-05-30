import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'
import {
  buildMixpanelFake,
  MixpanelFakeEventRecord
} from '@/modules/shared/test/helpers/mixpanel'
import { fileuploadTrackingFactory } from '@/modules/fileuploads/events/eventListener'
import { buildBasicTestUser } from '@/test/authHelper'
import {
  getUserTrackingPropertiesFactory,
  MixpanelEvents,
  SERVER_TRACKING_ID_KEY,
  USER_TRACKING_ID_KEY,
  WORKSPACE_TRACKING_ID_KEY
} from '@/modules/shared/utils/mixpanel'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { expect } from 'chai'

describe('fileuploadsTrackingFactory creates a function, that @fileuploads', () => {
  const workspaceId = 'some_workspace_id'
  const project = buildBasicTestProject({ workspaceId })
  const user = buildBasicTestUser({
    email: 'test@email.com'
  })
  const email = {
    id: user.id,
    email: user.email,
    primary: true,
    verified: true,
    userId: user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  const getProject = async () => project
  const findPrimaryEmailForUser = async () => email
  const getServerTrackingProperties = () => ({
    [SERVER_TRACKING_ID_KEY]: 'tracking_server_id',
    speckleVersion: 'test',
    hostApp: 'serverside'
  })

  it('emits events to mixpanel when a file upload has started', async () => {
    const events: MixpanelFakeEventRecord = []
    const workspaceTracking = fileuploadTrackingFactory({
      getProject,
      getUserTrackingProperties: getUserTrackingPropertiesFactory({
        findPrimaryEmailForUser
      }),
      getServerTrackingProperties,
      mixpanel: buildMixpanelFake({ events })
    })

    await workspaceTracking({
      eventName: FileuploadEvents.Started,
      payload: {
        userId: user.id,
        projectId: project.id,
        fileSize: 1240,
        fileType: 'test/type'
      }
    })

    const event = events[0]
    expect(events).to.have.lengthOf(1)
    expect(event.event).to.be.eq(MixpanelEvents.FileUploadStarted)
    expect(event.payload).to.be.deep.eq({
      [USER_TRACKING_ID_KEY]: '@93942E96F5ACD83E2E047AD8FE03114D',
      [WORKSPACE_TRACKING_ID_KEY]: workspaceId,
      [SERVER_TRACKING_ID_KEY]: 'tracking_server_id',
      fileSize: 1240,
      fileType: 'test/type',
      hostApp: 'serverside',
      speckleVersion: 'test'
    })
  })

  it('does not include workspace_id if project does not belong to a workspace', async () => {
    const projectWithoutWorkspace = buildBasicTestProject({ workspaceId: null })
    const events: MixpanelFakeEventRecord = []
    const workspaceTracking = fileuploadTrackingFactory({
      getProject: async () => projectWithoutWorkspace,
      getUserTrackingProperties: getUserTrackingPropertiesFactory({
        findPrimaryEmailForUser
      }),
      getServerTrackingProperties,
      mixpanel: buildMixpanelFake({ events })
    })

    await workspaceTracking({
      eventName: FileuploadEvents.Started,
      payload: {
        userId: user.id,
        projectId: projectWithoutWorkspace.id,
        fileSize: 1240,
        fileType: 'test/type'
      }
    })

    const event = events[0]
    expect(events).to.have.lengthOf(1)
    expect(event.event).to.be.eq(MixpanelEvents.FileUploadStarted)
    expect(event.payload).to.be.deep.eq({
      [USER_TRACKING_ID_KEY]: '@93942E96F5ACD83E2E047AD8FE03114D',
      [SERVER_TRACKING_ID_KEY]: 'tracking_server_id',
      fileSize: 1240,
      fileType: 'test/type',
      hostApp: 'serverside',
      speckleVersion: 'test'
    })
  })
})
