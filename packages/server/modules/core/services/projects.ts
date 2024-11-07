import { generateProjectName } from '@/modules/core/domain/projects/logic'
import {
  CreateProject,
  DeleteProject,
  GetProject,
  ProjectVisibility,
  StoreModel,
  StoreProject,
  StoreProjectRole
} from '@/modules/core/domain/projects/operations'
import { Project } from '@/modules/core/domain/streams/types'
import { RegionalProjectCreationError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  ProjectEvents,
  ProjectsEventsEmitter
} from '@/modules/core/events/projectsEmitter'
import { retry } from '@lifeomic/attempt'
import { Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

export const createNewProjectFactory =
  ({
    storeProject,
    getProject,
    deleteProject,
    storeProjectRole,
    storeModel,
    projectsEventsEmitter
  }: {
    storeProject: StoreProject
    getProject: GetProject
    deleteProject: DeleteProject
    storeProjectRole: StoreProjectRole
    projectsEventsEmitter: ProjectsEventsEmitter
    storeModel: StoreModel
  }): CreateProject =>
  async ({ description, name, regionKey, visibility, workspaceId, ownerId }) => {
    const publicVisibilities: ProjectVisibility[] = ['PUBLIC', 'UNLISTED']
    const isPublic = !visibility || publicVisibilities.includes(visibility)
    const isDiscoverable = visibility === 'PUBLIC'
    const project: Project = {
      id: cryptoRandomString({ length: 10 }),
      name: name || generateProjectName(),
      description: description || '',
      isPublic,
      isDiscoverable,
      createdAt: new Date(),
      clonedFrom: null,
      updatedAt: new Date(),
      workspaceId: workspaceId || null,
      regionKey: regionKey || null,
      allowPublicComments: false
    }

    await storeProject({ project })
    const projectId = project.id
    // if regionKey, we need to make sure it is actually written and synced
    if (regionKey) {
      try {
        await retry(
          async () => {
            await getProject({ projectId })
          },
          { maxAttempts: 10 }
        )
      } catch (err) {
        if (err instanceof StreamNotFoundError) {
          // delete from region
          await deleteProject({ projectId })
          throw new RegionalProjectCreationError()
        }
        // else throw as is
        throw err
      }
    }
    await storeProjectRole({ projectId, userId: ownerId, role: Roles.Stream.Owner })
    await storeModel({
      name: 'main',
      description: 'default model',
      projectId,
      authorId: ownerId
    })
    await projectsEventsEmitter(ProjectEvents.Created, { project, ownerId })
    return project
  }
