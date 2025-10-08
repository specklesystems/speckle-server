import { buildTestProject } from '@/modules/core/tests/helpers/creation'
import type { MixpanelFakeEventRecord } from '@/modules/shared/test/helpers/mixpanel'
import { buildMixpanelFake } from '@/modules/shared/test/helpers/mixpanel'
import { fileuploadTrackingFactory } from '@/modules/fileuploads/events/eventListener'
import { buildTestUserWithOptionalRole } from '@/test/authHelper'
import { MixpanelEvents } from '@/modules/shared/utils/mixpanel'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import { expect } from 'chai'
import { buildFileUploadRecord } from '@/modules/fileuploads/tests/helpers/creation'

describe('fileuploadsTrackingFactory creates a function, that @fileuploads', () => {
  const workspaceId = 'some_workspace_id'
  const project = buildTestProject({ workspaceId })
  const user = buildTestUserWithOptionalRole()
  const getProject = async () => project
  const getUser = async () => user

  it('emits events to mixpanel when a file upload has started', async () => {
    const events: MixpanelFakeEventRecord = []
    const workspaceTracking = fileuploadTrackingFactory({
      getProject,
      getUser,
      mixpanel: buildMixpanelFake({ events })
    })

    await workspaceTracking({
      eventName: FileuploadEvents.Started,
      payload: {
        upload: buildFileUploadRecord({
          userId: user.id,
          projectId: project.id,
          fileSize: 1240,
          fileType: 'test/type'
        })
      }
    })

    const event = events[0]
    expect(events).to.have.lengthOf(1)
    expect(event.eventName).to.be.eq(MixpanelEvents.FileUploadStarted)
    expect(event.userEmail).to.eq(user.email)
    expect(event.payload).to.be.deep.eq({
      fileSize: 1240,
      fileType: 'test/type'
    })
  })

  it('does not include workspace_id if project does not belong to a workspace', async () => {
    const projectWithoutWorkspace = buildTestProject({ workspaceId: null })
    const events: MixpanelFakeEventRecord = []
    const workspaceTracking = fileuploadTrackingFactory({
      getProject: async () => projectWithoutWorkspace,
      getUser,
      mixpanel: buildMixpanelFake({ events })
    })

    await workspaceTracking({
      eventName: FileuploadEvents.Started,
      payload: {
        upload: buildFileUploadRecord({
          userId: user.id,
          projectId: projectWithoutWorkspace.id,
          fileSize: 1240,
          fileType: 'test/type'
        })
      }
    })

    const event = events[0]
    expect(events).to.have.lengthOf(1)
    expect(event.eventName).to.be.eq(MixpanelEvents.FileUploadStarted)
    expect(event.userEmail).to.be.eq(user.email)
    expect(event.payload).to.be.deep.eq({
      fileSize: 1240,
      fileType: 'test/type'
    })
  })
})
