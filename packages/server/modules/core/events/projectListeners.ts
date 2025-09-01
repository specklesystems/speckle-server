import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Logger } from '@/observability/logging'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import type { StoreBranch } from '@/modules/core/domain/branches/operations'

const onUserCreatedFactory =
  (deps: { createBranch: StoreBranch }) =>
  async ({ payload }: EventPayload<typeof ProjectEvents.Created>) => {
    const { project, ownerId } = payload

    // Legacy flow for creating a default main branch
    await deps.createBranch({
      name: 'main',
      description: 'default branch',
      streamId: project.id,
      authorId: ownerId
    })
  }

export const projectListenersFactory =
  (
    deps: { eventBus: EventBus; logger: Logger } & DependenciesOf<
      typeof onUserCreatedFactory
    >
  ) =>
  () => {
    const onUserCreated = onUserCreatedFactory(deps)

    const cbs = [deps.eventBus.listen(ProjectEvents.Created, onUserCreated)]

    return () => cbs.forEach((cb) => cb())
  }
