import { Version } from '@/modules/core/domain/commits/types'
import { GetWorkspaceLimits } from '@speckle/shared/dist/commonjs/authz/domain/workspaces/operations'
import dayjs from 'dayjs'

export const PersonalProjectsLimits: {
  versionHistory: { value: number; unit: 'week' }
} = {
  versionHistory: {
    value: 1,
    unit: 'week'
  }
}

export const getLimitedReferencedObjectFactory =
  ({
    environment: { personalProjectsLimitEnabled },
    getWorkspaceLimits
  }: {
    environment: { personalProjectsLimitEnabled: boolean }
    getWorkspaceLimits: GetWorkspaceLimits
  }) =>
  async ({
    version,
    workspaceId
  }: {
    version: Pick<Version, 'referencedObject' | 'createdAt'>
    workspaceId?: string | null
  }) => {
    const limitDate = await getDateFromLimitsFactory({
      environment: { personalProjectsLimitEnabled },
      getWorkspaceLimits
    })({ workspaceId })

    if (dayjs(limitDate).isAfter(version.createdAt)) return null
    return version.referencedObject
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
        PersonalProjectsLimits.versionHistory.value,
        PersonalProjectsLimits.versionHistory.unit
      )
      .toDate()
  }
