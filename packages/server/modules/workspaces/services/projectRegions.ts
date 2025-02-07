import { GetProjectAutomationCount } from '@/modules/automate/domain/operations'
import { GetStreamCommentCount } from '@/modules/comments/domain/operations'
import { GetStreamBranchCount } from '@/modules/core/domain/branches/operations'
import { GetStreamCommitCount } from '@/modules/core/domain/commits/operations'
import { GetStreamObjectCount } from '@/modules/core/domain/objects/operations'
import { GetProject } from '@/modules/core/domain/projects/operations'
import {
  CopyProjectAutomations,
  CopyProjectComments,
  CopyProjectModels,
  CopyProjectObjects,
  CopyProjects,
  CopyProjectVersions,
  CopyWorkspace,
  GetAvailableRegions,
  UpdateProjectRegion
} from '@/modules/workspaces/domain/operations'
import { ProjectRegionAssignmentError } from '@/modules/workspaces/errors/regions'

export const updateProjectRegionFactory =
  (deps: {
    getProject: GetProject
    countProjectModels: GetStreamBranchCount
    countProjectVersions: GetStreamCommitCount
    countProjectObjects: GetStreamObjectCount
    countProjectAutomations: GetProjectAutomationCount
    countProjectComments: GetStreamCommentCount
    getAvailableRegions: GetAvailableRegions
    copyWorkspace: CopyWorkspace
    copyProjects: CopyProjects
    copyProjectModels: CopyProjectModels
    copyProjectVersions: CopyProjectVersions
    copyProjectObjects: CopyProjectObjects
    copyProjectAutomations: CopyProjectAutomations
    copyProjectComments: CopyProjectComments
  }): UpdateProjectRegion =>
  async (params) => {
    const { projectId, regionKey } = params

    const project = await deps.getProject({ projectId })
    if (!project) {
      throw new ProjectRegionAssignmentError('Project not found', {
        info: { params }
      })
    }
    if (!project.workspaceId) {
      throw new ProjectRegionAssignmentError('Project not a part of a workspace', {
        info: { params }
      })
    }

    const availableRegions = await deps.getAvailableRegions({
      workspaceId: project.workspaceId
    })
    if (!availableRegions.find((region) => region.key === regionKey)) {
      throw new ProjectRegionAssignmentError(
        'Specified region not available for workspace',
        {
          info: {
            params,
            workspaceId: project.workspaceId
          }
        }
      )
    }

    // Move workspace
    await deps.copyWorkspace({ workspaceId: project.workspaceId })

    // Move commits
    const projectIds = await deps.copyProjects({ projectIds: [projectId] })
    const copiedModelCount = await deps.copyProjectModels({ projectIds })
    const copiedVersionCount = await deps.copyProjectVersions({ projectIds })

    // Move objects
    const copiedObjectCount = await deps.copyProjectObjects({ projectIds })

    // Move automations
    const copiedAutomationCount = await deps.copyProjectAutomations({ projectIds })

    // Move comments
    const copiedCommentCount = await deps.copyProjectComments({ projectIds })
    // TODO: Move file blobs
    // TODO: Move webhooks

    // TODO: Validate state after move captures latest state of project
    const sourceProjectModelCount = await deps.countProjectModels(projectId)
    const sourceProjectVersionCount = await deps.countProjectVersions(projectId)
    const sourceProjectObjectCount = await deps.countProjectObjects({
      streamId: projectId
    })
    const sourceProjectAutomationCount = await deps.countProjectAutomations({
      projectId
    })
    const sourceProjectCommentCount = await deps.countProjectComments(projectId)

    const tests = [
      copiedModelCount[projectId] === sourceProjectModelCount,
      copiedVersionCount[projectId] === sourceProjectVersionCount,
      copiedObjectCount[projectId] === sourceProjectObjectCount,
      copiedAutomationCount[projectId] === sourceProjectAutomationCount,
      copiedCommentCount[projectId] === sourceProjectCommentCount
    ]

    if (!tests.every((test) => !!test)) {
      // TODO: Move failed or source project added data while changing regions. Retry move.
      throw new ProjectRegionAssignmentError(
        'Missing data from source project in target region copy after move.'
      )
    }

    // TODO: Update project region in db
    return { ...project, regionKey }
  }
