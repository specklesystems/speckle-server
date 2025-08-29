import type { GetProject } from '@/modules/core/domain/projects/operations'
import type { UpdateProjectRegionKey } from '@/modules/multiregion/services/projectRegion'
import type {
  CopyProjectAutomations,
  CopyProjectBlobs,
  CopyProjectComments,
  CopyProjectModels,
  CopyProjectObjects,
  CopyProjects,
  CopyProjectVersions,
  CopyProjectWebhooks,
  CopyWorkspace,
  CountProjectAutomations,
  CountProjectComments,
  CountProjectModels,
  CountProjectObjects,
  CountProjectVersions,
  CountProjectWebhooks,
  GetAvailableRegions,
  UpdateProjectRegion,
  ValidateProjectRegionCopy
} from '@/modules/workspaces/domain/operations'
import { ProjectRegionAssignmentError } from '@/modules/workspaces/errors/regions'
import { logger } from '@/observability/logging'

export const updateProjectRegionFactory =
  (deps: {
    getProject: GetProject
    getAvailableRegions: GetAvailableRegions
    copyWorkspace: CopyWorkspace
    copyProjects: CopyProjects
    copyProjectModels: CopyProjectModels
    copyProjectVersions: CopyProjectVersions
    copyProjectObjects: CopyProjectObjects
    copyProjectAutomations: CopyProjectAutomations
    copyProjectComments: CopyProjectComments
    copyProjectWebhooks: CopyProjectWebhooks
    copyProjectBlobs: CopyProjectBlobs
    validateProjectRegionCopy: ValidateProjectRegionCopy
    updateProjectRegionKey: UpdateProjectRegionKey
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

    // Move webhooks
    const copiedWebhookCount = await deps.copyProjectWebhooks({ projectIds })

    // Move file blobs
    await deps.copyProjectBlobs({ projectIds })

    // Validate that state after move captures latest state of project
    const targetProjectResources = {
      models: copiedModelCount[projectId] ?? 0,
      versions: copiedVersionCount[projectId] ?? 0,
      objects: copiedObjectCount[projectId] ?? 0,
      automations: copiedAutomationCount[projectId] ?? 0,
      comments: copiedCommentCount[projectId] ?? 0,
      webhooks: copiedWebhookCount[projectId] ?? 0
    }

    const [isValidCopy, sourceProjectResources] = await deps.validateProjectRegionCopy({
      projectId,
      copiedRowCount: targetProjectResources
    })

    if (!isValidCopy) {
      // TODO: Move failed or source project added data while changing regions. Retry move.
      logger.error(
        {
          sourceData: sourceProjectResources,
          targetData: targetProjectResources
        },
        'Failed to copy all project resources during project region move.'
      )
      throw new ProjectRegionAssignmentError(
        'Missing data from source project in target region copy after move.'
      )
    }

    // Update project region in db and update relevant caches

    // TODO: this is the only thing multiregion operation
    return await deps.updateProjectRegionKey({ projectId, regionKey })
  }

export const validateProjectRegionCopyFactory =
  (deps: {
    countProjectModels: CountProjectModels
    countProjectVersions: CountProjectVersions
    countProjectObjects: CountProjectObjects
    countProjectAutomations: CountProjectAutomations
    countProjectComments: CountProjectComments
    countProjectWebhooks: CountProjectWebhooks
  }): ValidateProjectRegionCopy =>
  async ({ projectId, copiedRowCount }) => {
    const sourceProjectModelCount = await deps.countProjectModels({ projectId })
    const sourceProjectVersionCount = await deps.countProjectVersions({ projectId })
    const sourceProjectObjectCount = await deps.countProjectObjects({ projectId })
    const sourceProjectAutomationCount = await deps.countProjectAutomations({
      projectId
    })
    const sourceProjectCommentCount = await deps.countProjectComments({ projectId })
    const sourceProjectWebhooksCount = await deps.countProjectWebhooks({ projectId })

    const tests = [
      copiedRowCount.models === sourceProjectModelCount,
      copiedRowCount.versions === sourceProjectVersionCount,
      copiedRowCount.objects === sourceProjectObjectCount,
      copiedRowCount.automations === sourceProjectAutomationCount,
      copiedRowCount.comments === sourceProjectCommentCount,
      copiedRowCount.webhooks === sourceProjectWebhooksCount
    ]

    return [
      tests.every((test) => !!test),
      {
        models: sourceProjectModelCount,
        versions: sourceProjectVersionCount,
        objects: sourceProjectObjectCount,
        automations: sourceProjectAutomationCount,
        comments: sourceProjectCommentCount,
        webhooks: sourceProjectWebhooksCount
      }
    ]
  }
