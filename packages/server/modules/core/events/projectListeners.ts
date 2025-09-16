import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Logger } from '@/observability/logging'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import {
  getProjectDbClient,
  getProjectReplicationDbs
} from '@/modules/multiregion/utils/dbSelector'
import { storeModelFactory } from '@/modules/core/repositories/models'
import { ModelEvents } from '@/modules/core/domain/branches/events'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { updateStreamFactory } from '@/modules/core/repositories/streams'
import { VersionEvents } from '@/modules/core/domain/commits/events'
import { throwUncoveredError } from '@speckle/shared'

const onProjectModifiedFactory =
  ({ logger }: { logger: Logger }) =>
  async (
    params: EventPayload<
      | typeof VersionEvents.Created
      | typeof VersionEvents.Updated
      | typeof VersionEvents.Deleted
      | typeof ModelEvents.Deleted
      | typeof ProjectEvents.PermissionsRevoked
      | typeof ProjectEvents.PermissionsBeingAdded
    >
  ) => {
    const { eventName, payload } = params

    let projectId: string
    switch (eventName) {
      case ModelEvents.Deleted:
      case VersionEvents.Created:
      case VersionEvents.Updated:
      case VersionEvents.Deleted:
      case ProjectEvents.PermissionsBeingAdded:
        projectId = payload.projectId
        break
      case ProjectEvents.PermissionsRevoked:
        projectId = payload.project.id
        break
      default:
        throwUncoveredError(eventName)
    }

    await asMultiregionalOperation(
      ({ allDbs }) =>
        replicateFactory(
          allDbs,
          updateStreamFactory
        )({ id: projectId, updatedAt: new Date() }),
      {
        dbs: await getProjectReplicationDbs({ projectId }),
        logger,
        name: 'Project listener update'
      }
    )
  }

const onProjectCreatedFactory =
  () =>
  async ({ payload }: EventPayload<typeof ProjectEvents.Created>) => {
    const { project, ownerId } = payload
    const projectDb = await getProjectDbClient({ projectId: project.id })
    const storeModel = storeModelFactory({ db: projectDb })

    // Legacy flow for creating a default main branch
    await storeModel({
      name: 'main',
      description: 'default model',
      projectId: project.id,
      authorId: ownerId
    })
  }

export const projectListenersFactory =
  (
    deps: { eventBus: EventBus; logger: Logger } & DependenciesOf<
      typeof onProjectCreatedFactory
    >
  ) =>
  () => {
    const onProjectCreated = onProjectCreatedFactory()
    const onProjectModified = onProjectModifiedFactory(deps)

    const cbs = [
      deps.eventBus.listen(ProjectEvents.Created, onProjectCreated),
      deps.eventBus.listen(ModelEvents.Deleted, onProjectModified),
      deps.eventBus.listen(VersionEvents.Created, onProjectModified),
      deps.eventBus.listen(VersionEvents.Updated, onProjectModified),
      deps.eventBus.listen(VersionEvents.Deleted, onProjectModified),
      deps.eventBus.listen(ProjectEvents.PermissionsRevoked, onProjectModified),
      deps.eventBus.listen(ProjectEvents.PermissionsBeingAdded, onProjectModified)
    ]

    return () => cbs.forEach((cb) => cb())
  }
