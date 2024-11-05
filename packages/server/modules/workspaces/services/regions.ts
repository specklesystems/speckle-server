import { GetRegions } from '@/modules/multiregion/domain/operations'
import {
  AssignRegion,
  GetAvailableRegions,
  UpsertRegionAssignment,
  DeleteAllRegionAssignments
} from '@/modules/workspaces/domain/operations'
import { WorkspaceRegionAssignmentError } from '@/modules/workspaces/errors/regions'

export const getAvailableRegionsFactory =
  (deps: { getRegions: GetRegions }): GetAvailableRegions =>
  async () => {
    // TODO: Gatekeeper checks here? For now just returning all server regions
    return await deps.getRegions()
  }

export const assignRegionFactory =
  (deps: {
    getAvailableRegions: GetAvailableRegions
    upsertRegionAssignment: UpsertRegionAssignment
    deleteAllRegionAssignments: DeleteAllRegionAssignments
  }): AssignRegion =>
  async (params) => {
    const { workspaceId, regionKey } = params

    const availableRegions = await deps.getAvailableRegions({ workspaceId })
    if (!availableRegions.find((region) => region.key === regionKey)) {
      throw new WorkspaceRegionAssignmentError(
        'Specified region not available for workspace',
        {
          info: { params }
        }
      )
    }

    // For now, only 1 region - delete old assignments
    await deps.deleteAllRegionAssignments({ workspaceId })
    await deps.upsertRegionAssignment({ workspaceId, regionKey })
  }
