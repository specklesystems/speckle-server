import { buildTableHelper } from '@/modules/core/dbSchema'
import type { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Regions } from '@/modules/multiregion/repositories'
import type {
  GetDefaultRegion,
  UpsertRegionAssignment
} from '@/modules/workspaces/domain/operations'
import type { WorkspaceRegionAssignment } from '@/modules/workspacesCore/domain/types'
import type { Knex } from 'knex'

export const WorkspaceRegions = buildTableHelper('workspace_regions', [
  'workspaceId',
  'regionKey'
])

const tables = {
  regions: (db: Knex) => db<RegionRecord>(Regions.name),
  workspaceRegions: (db: Knex) => db<WorkspaceRegionAssignment>(WorkspaceRegions.name)
}

export const upsertRegionAssignmentFactory =
  (deps: { db: Knex }): UpsertRegionAssignment =>
  async (params) => {
    const { workspaceId, regionKey } = params
    const [row] = await tables
      .workspaceRegions(deps.db)
      .insert({ workspaceId, regionKey }, '*')
      .onConflict(['workspaceId', 'regionKey'])
      .merge()

    return row
  }

export const getDefaultRegionFactory =
  (deps: { db: Knex }): GetDefaultRegion =>
  async (params) => {
    const { workspaceId } = params
    const row = await tables
      .regions(deps.db)
      .select<RegionRecord>(Regions.cols)
      .join(WorkspaceRegions.name, WorkspaceRegions.col.regionKey, Regions.col.key)
      .where({ [WorkspaceRegions.col.workspaceId]: workspaceId })
      .first()

    return row
  }
