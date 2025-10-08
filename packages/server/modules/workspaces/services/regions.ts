import type { WorkspaceFeatureAccessFunction } from '@/modules/gatekeeper/domain/operations'
import type { GetRegions } from '@/modules/multiregion/domain/operations'
import type {
  AssignWorkspaceRegion,
  GetAvailableRegions,
  GetDefaultRegion,
  GetWorkspace,
  UpsertRegionAssignment
} from '@/modules/workspaces/domain/operations'
import { WorkspaceRegionAssignmentError } from '@/modules/workspaces/errors/regions'

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
  }
