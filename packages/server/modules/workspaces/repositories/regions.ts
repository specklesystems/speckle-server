import { buildTableHelper } from '@/modules/core/dbSchema'
import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Regions } from '@/modules/multiregion/repositories'
import {
  GetDefaultRegion,
  UpsertRegionAssignment
} from '@/modules/workspaces/domain/operations'
import { WorkspaceRegionAssignment } from '@/modules/workspacesCore/domain/types'
import { Knex } from 'knex'

export const WorkspaceRegions = buildTableHelper('workspace_regions', [
  'workspaceId',
  'regionKey'
])

const tables = {
  workspaceRegions: (db: Knex) => db<WorkspaceRegionAssignment>(WorkspaceRegions.name),
  regions: (db: Knex) => db<RegionRecord>(Regions.name)
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
