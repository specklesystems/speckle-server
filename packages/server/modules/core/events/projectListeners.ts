import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Logger } from '@/observability/logging'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { storeModelFactory } from '@/modules/core/repositories/models'

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

    const cbs = [deps.eventBus.listen(ProjectEvents.Created, onProjectCreated)]

    return () => cbs.forEach((cb) => cb())
  }
