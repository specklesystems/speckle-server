import dayjs from 'dayjs'
import { GetWorkspaceLimits } from '../authz/domain/workspaces/operations.js'
import { PersonalProjectsLimits } from '../authz/index.js'

export const hidePropertyIfOutOfLimitFactory =
  ({
    environment: { personalProjectsLimitEnabled },
    getWorkspaceLimits
  }: {
    environment: { personalProjectsLimitEnabled: boolean }
    getWorkspaceLimits: GetWorkspaceLimits
  }) =>
  async <E extends { createdAt: Date }, P extends keyof E>({
    property,
    entity,
    workspaceId
  }: {
    property: P
    entity: E
    workspaceId?: string | null
  }): Promise<E[P] | null> => {
    const limitDate = await getDateFromLimitsFactory({
      environment: { personalProjectsLimitEnabled },
      getWorkspaceLimits
    })({ workspaceId })

    if (dayjs(limitDate).isAfter(entity.createdAt)) return null

    return entity[property]
  }

export const getDateFromLimitsFactory =
  ({
    getWorkspaceLimits,
    environment: { personalProjectsLimitEnabled }
  }: {
    getWorkspaceLimits: GetWorkspaceLimits
    environment: { personalProjectsLimitEnabled: boolean }
  }) =>
  async ({ workspaceId }: { workspaceId?: string | null }) => {
    if (workspaceId) {
      const limits = await getWorkspaceLimits({ workspaceId })
      if (!limits?.versionsHistory) {
        return null
      }

      return dayjs()
        .subtract(limits.versionsHistory.value, limits.versionsHistory.unit)
        .toDate()
    }

    if (!personalProjectsLimitEnabled) {
      return null
    }

    return dayjs()
      .subtract(
        PersonalProjectsLimits.versionsHistory.value,
        PersonalProjectsLimits.versionsHistory.unit
      )
      .toDate()
  }
