import dayjs from 'dayjs'
import { GetWorkspaceLimits } from '../authz/domain/workspaces/operations.js'
import { GetHistoryLimits, HistoryLimitTypes, HistoryLimits } from './domain.js'
import { Project } from '../authz/domain/projects/types.js'

export const isCreatedBeyondHistoryLimitCutoffFactory =
  ({ getProjectLimitDate }: { getProjectLimitDate: GetProjectLimitDate }) =>
  async ({
    entity,
    project,
    limitType
  }: {
    entity: { createdAt: Date }
    project: Pick<Project, 'workspaceId'>
    limitType: HistoryLimitTypes
  }): Promise<boolean> => {
    const limitDate = await getProjectLimitDate({
      project,
      limitType
    })
    return limitDate ? dayjs(limitDate).isAfter(entity.createdAt) : false
  }

export type IsCreatedBeyondHistoryLimitCutoff = ReturnType<
  typeof isCreatedBeyondHistoryLimitCutoffFactory
>

export const calculateLimitCutoffDate = (
  historyLimits: HistoryLimits | null,
  limitType: HistoryLimitTypes
): Date | null => {
  if (!historyLimits) return null
  if (!historyLimits[limitType]) return null
  return dayjs()
    .subtract(historyLimits[limitType].value, historyLimits[limitType].unit)
    .toDate()
}

export type GetProjectLimitDate = (args: {
  project: Pick<Project, 'workspaceId'>
  limitType: HistoryLimitTypes
}) => Promise<Date | null>

export const getProjectLimitDateFactory =
  ({
    getWorkspaceLimits,
    getPersonalProjectLimits
  }: {
    getWorkspaceLimits: GetWorkspaceLimits
    getPersonalProjectLimits: GetHistoryLimits
  }): GetProjectLimitDate =>
  async ({ project, limitType }) => {
    const limits = project.workspaceId
      ? await getWorkspaceLimits({ workspaceId: project.workspaceId })
      : await getPersonalProjectLimits()
    return calculateLimitCutoffDate(limits, limitType)
  }
