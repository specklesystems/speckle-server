import { Version } from '@/modules/core/domain/commits/types'
import { Project } from '@/modules/core/domain/streams/types'
import { GetWorkspaceLimits } from '@speckle/shared/dist/commonjs/authz/domain/workspaces/operations'
import dayjs from 'dayjs'

const PersonalProjectsLimits: {
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
    project
  }: {
    version: Pick<Version, 'referencedObject' | 'createdAt'>
    project: Pick<Project, 'workspaceId'>
  }) => {
    if (project?.workspaceId) {
      const workspaceLimits = await getWorkspaceLimits({
        workspaceId: project.workspaceId
      })
      if (!workspaceLimits?.versionsHistory) {
        return version.referencedObject
      }
      const oneWeekAgo = dayjs().subtract(
        workspaceLimits.versionsHistory.value,
        workspaceLimits.versionsHistory.unit
      )
      if (oneWeekAgo.isAfter(version.createdAt)) return null
      return version.referencedObject
    }

    if (!personalProjectsLimitEnabled) {
      return version.referencedObject
    }

    const oneWeekAgo = dayjs().subtract(
      PersonalProjectsLimits.versionHistory.value,
      PersonalProjectsLimits.versionHistory.unit
    )

    if (oneWeekAgo.isAfter(version.createdAt)) return null
    return version.referencedObject
  }
