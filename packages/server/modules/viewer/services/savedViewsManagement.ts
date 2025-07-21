import { GetViewerResourceGroups } from '@/modules/comments/domain/operations'
import { NotImplementedError } from '@/modules/shared/errors'
import {
  CreateSavedView,
  GetStoredViewCount
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewCreationValidationError } from '@/modules/viewer/errors/savedViews'
import { resourceBuilder } from '@speckle/shared/viewer/route'

export const createSavedViewFactory =
  (deps: {
    getViewerResourceGroups: GetViewerResourceGroups
    getStoredViewCount: GetStoredViewCount
  }): CreateSavedView =>
  async ({ input, authorId }) => {
    const { resourceIdString, projectId } = input

    // TODO: Validate resourceIdString - it should only point to resources belonging to the project
    // and the ids should be in valid syntax too
    const resourceIds = resourceBuilder().addFromString(resourceIdString)
    if (!resourceIds.length()) {
      throw new SavedViewCreationValidationError(
        "No valid resources referenced in 'resourceIdString'",
        {
          info: {
            input,
            authorId
          }
        }
      )
    }
    const resourceGroups = await deps.getViewerResourceGroups({
      projectId,
      loadedVersionsOnly: true,
      resourceIdString: resourceIds.toString()
    })

    // Check if any of the resources could not be found
    const failingResources = resourceIds.toResources().filter((rId) => {
      const resourceGroup = resourceGroups.find(
        (rg) => rg.identifier === rId.toString()
      )
      if (!resourceGroup) return true
      if (!resourceGroup.items.length) return true
      return false
    })
    if (failingResources.length) {
      throw new SavedViewCreationValidationError(
        'One or more resources could not be found in the project: {resourceIdString}',
        {
          info: {
            input,
            authorId,
            resourceIdString: resourceBuilder()
              .addResources(failingResources)
              .toString()
          }
        }
      )
    }

    // Auto-generate name, if one not set
    let name = input.name?.trim()
    if (!name?.length) {
      const viewCount = await deps.getStoredViewCount({ projectId })
      name = `Scene - ${String(viewCount + 1).padStart(3, '0')}`
    }

    // TODO: Implement the saved view creation logic
    throw new NotImplementedError()
  }
