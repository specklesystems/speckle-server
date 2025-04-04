import { Version } from '@/modules/core/domain/commits/types'
import { Project } from '@/modules/core/domain/streams/types'
import dayjs from 'dayjs'

export const getLimitedReferencedObjectFactory =
  ({
    environment: { personalProjectsLimitEnabled }
  }: // getWorkspacePlan
  {
    environment: { personalProjectsLimitEnabled: boolean }
    // getWorkspacePlan: GetWorkspacePlan
  }) =>
  async ({
    version,
    project
  }: {
    version: Pick<Version, 'referencedObject' | 'createdAt'>
    project: Pick<Project, 'workspaceId'>
  }) => {
    if (project?.workspaceId) {
      // TODO: needs the plan to get limits according to it
      // const workspacePlan = await getWorkspacePlan({
      //   workspaceId: project.workspaceId
      // })
      // TODO: get plan limits
    }

    if (!personalProjectsLimitEnabled) {
      return version.referencedObject
    }

    const oneWeekAgo = dayjs().subtract(1, 'week')

    if (oneWeekAgo.isAfter(version.createdAt)) return ''
    return version.referencedObject
  }
