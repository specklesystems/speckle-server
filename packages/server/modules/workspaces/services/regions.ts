import { GetStreamBranchCount } from '@/modules/core/domain/branches/operations'
import { GetStreamCommitCount } from '@/modules/core/domain/commits/operations'
import { GetProject } from '@/modules/core/domain/projects/operations'
import { WorkspaceFeatureAccessFunction } from '@/modules/gatekeeper/domain/operations'
import { GetRegions } from '@/modules/multiregion/domain/operations'
import {
  AssignWorkspaceRegion,
  CopyProjectModels,
  CopyProjects,
  CopyProjectVersions,
  GetAvailableRegions,
  GetDefaultRegion,
  GetWorkspace,
  UpdateProjectRegion,
  UpsertRegionAssignment,
  UpsertWorkspace
} from '@/modules/workspaces/domain/operations'
import {
  ProjectRegionAssignmentError,
  WorkspaceRegionAssignmentError
} from '@/modules/workspaces/errors/regions'

export const getAvailableRegionsFactory =
  (deps: {
    getRegions: GetRegions
    canWorkspaceUseRegions: WorkspaceFeatureAccessFunction
  }): GetAvailableRegions =>
  async (params) => {
    const { workspaceId } = params
    const canUseMultiRegion = await deps.canWorkspaceUseRegions({ workspaceId })
    if (!canUseMultiRegion) {
      return []
    }

    return await deps.getRegions()
  }

export const assignWorkspaceRegionFactory =
  (deps: {
    getAvailableRegions: GetAvailableRegions
    upsertRegionAssignment: UpsertRegionAssignment
    getDefaultRegion: GetDefaultRegion
    getWorkspace: GetWorkspace
    insertRegionWorkspace: UpsertWorkspace
  }): AssignWorkspaceRegion =>
  async (params) => {
    const { workspaceId, regionKey } = params

    const workspace = await deps.getWorkspace({ workspaceId })
    if (!workspace) {
      throw new WorkspaceRegionAssignmentError('Workspace not found', {
        info: { params }
      })
    }

    const availableRegions = await deps.getAvailableRegions({ workspaceId })
    if (!availableRegions.find((region) => region.key === regionKey)) {
      throw new WorkspaceRegionAssignmentError(
        'Specified region not available for workspace',
        {
          info: { params }
        }
      )
    }

    const existingRegion = await deps.getDefaultRegion({ workspaceId })
    if (existingRegion) {
      throw new WorkspaceRegionAssignmentError(
        'Workspace already has a region assigned',
        {
          info: { params }
        }
      )
    }

    // Set up region
    await deps.upsertRegionAssignment({ workspaceId, regionKey })

    // Copy workspace into region db
    await deps.insertRegionWorkspace({ workspace })
  }

export const updateProjectRegionFactory =
  (deps: {
    getProject: GetProject
    countProjectModels: GetStreamBranchCount
    countProjectVersions: GetStreamCommitCount
    getAvailableRegions: GetAvailableRegions
    copyProjects: CopyProjects
    copyProjectModels: CopyProjectModels
    copyProjectVersions: CopyProjectVersions
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

    // Move commits
    const projectIds = await deps.copyProjects({ projectIds: [projectId] })
    const modelIds = await deps.copyProjectModels({ projectIds })
    const versionIds = await deps.copyProjectVersions({ projectIds })

    // TODO: Move objects
    // TODO: Move automations
    // TODO: Move comments
    // TODO: Move file blobs
    // TODO: Move webhooks

    // TODO: Validate state after move captures latest state of project
    const sourceProjectModelCount = await deps.countProjectModels(projectId)
    const sourceProjectVersionCount = await deps.countProjectVersions(projectId)

    const isReconciled =
      modelIds[projectId].length === sourceProjectModelCount &&
      versionIds[projectId].length === sourceProjectVersionCount

    if (!isReconciled) {
      // TODO: Move failed or source project added data while changing regions. Retry move.
      throw new ProjectRegionAssignmentError(
        'Missing data from source project in target region copy after move.'
      )
    }

    // TODO: Update project region in db
    return { ...project, regionKey }
  }
