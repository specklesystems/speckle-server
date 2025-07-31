import type {
  CreateSavedView,
  CreateSavedViewGroup,
  GetGroupSavedViews,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetProjectSavedViewGroups,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetSavedViewGroup,
  GetStoredViewCount,
  RecalculateGroupResourceIds,
  StoreSavedView,
  StoreSavedViewGroup
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import {
  SavedViewCreationValidationError,
  SavedViewGroupCreationValidationError,
  SavedViewInvalidResourceTargetError
} from '@/modules/viewer/errors/savedViews'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { inputToVersionedState } from '@speckle/shared/viewer/state'
import { isValidBase64Image } from '@speckle/shared/images/base64'
import type { GetViewerResourceGroups } from '@/modules/viewer/domain/operations/resources'

/**
 * Validates an incoming resourceIdString against the resources in the project and returns the validated list (as a builder)
 */
const validateProjectResourceIdStringFactory =
  (deps: { getViewerResourceGroups: GetViewerResourceGroups }) =>
  async (params: {
    resourceIdString: string
    projectId: string
    errorMetadata: Record<string, unknown>
  }) => {
    const { resourceIdString, errorMetadata, projectId } = params

    // Validate resourceIdString - it should only point to valid resources belonging to the project
    const resourceIds = resourceBuilder().addFromString(resourceIdString)
    if (!resourceIds.length) {
      throw new SavedViewInvalidResourceTargetError(
        "No valid resources referenced in 'resourceIdString'",
        {
          info: errorMetadata
        }
      )
    }

    const resourceGroups = await deps.getViewerResourceGroups({
      projectId,
      loadedVersionsOnly: true,
      resourceIdString: resourceIds.toString(),
      allowEmptyModels: true
    })

    // Check if any of the resources could not be found
    const failingResources = resourceIds.clone().filter((rId) => {
      const resourceGroup = resourceGroups.find(
        (rg) => rg.identifier === rId.toString()
      )
      if (!resourceGroup) return true
      return false
    })
    if (failingResources.length) {
      throw new SavedViewInvalidResourceTargetError(
        'One or more resources could not be found in the project: {resourceIdString}',
        {
          info: {
            ...errorMetadata,
            resourceIdString: failingResources.toString()
          }
        }
      )
    }

    return resourceIds
  }

export const createSavedViewFactory =
  (deps: {
    getViewerResourceGroups: GetViewerResourceGroups
    getStoredViewCount: GetStoredViewCount
    storeSavedView: StoreSavedView
    getSavedViewGroup: GetSavedViewGroup
    recalculateGroupResourceIds: RecalculateGroupResourceIds
  }): CreateSavedView =>
  async ({ input, authorId }) => {
    const { resourceIdString, projectId } = input
    const visibility = input.visibility || SavedViewVisibility.public
    const position = 0 // TODO: Resolve based on existing views
    const groupId = input.groupId?.trim() || null
    const description = input.description?.trim() || null
    const isHomeView = input.isHomeView || false

    // Validate resourceIdString - it should only point to valid resources belonging to the project
    const resourceIds = await validateProjectResourceIdStringFactory(deps)({
      resourceIdString,
      projectId,
      errorMetadata: {
        input,
        authorId
      }
    })

    const screenshot = input.screenshot.trim()
    if (!isValidBase64Image(screenshot)) {
      throw new SavedViewCreationValidationError(
        'Invalid screenshot provided. Must be a valid base64 encoded image.',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    const state = inputToVersionedState(input.viewerState)
    if (!state) {
      throw new SavedViewCreationValidationError(
        'Invalid viewer state provided. Must be a valid SerializedViewerState.',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    // Validate state match
    if (state.state.resources.request.resourceIdString !== input.resourceIdString) {
      throw new SavedViewCreationValidationError(
        'Viewer state does not match the provided resourceIdString.',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }
    if (state.state.projectId !== projectId) {
      throw new SavedViewCreationValidationError(
        'Viewer state projectId does not match the provided projectId.',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    // Validate groupId - group is a valid and accessible group in the project
    if (groupId) {
      const group = await deps.getSavedViewGroup({
        id: groupId,
        projectId
      })
      if (!group) {
        throw new SavedViewCreationValidationError(
          'Provided groupId does not exist in the project.',
          {
            info: {
              input,
              authorId
            }
          }
        )
      }
    }

    // Auto-generate name, if one not set
    let name = input.name?.trim()
    if (!name?.length) {
      const viewCount = await deps.getStoredViewCount({ projectId })
      name = `Scene - ${String(viewCount + 1).padStart(3, '0')}`
    }

    const ret = await deps.storeSavedView({
      view: {
        projectId,
        resourceIds: resourceIds.toResources().map((r) => r.toString()),
        groupId,
        name,
        description,
        viewerState: state,
        screenshot,
        visibility,
        position,
        authorId,
        isHomeView
      }
    })

    // If grouped view, recalculate its resourceIds
    if (groupId) {
      await deps.recalculateGroupResourceIds({ groupId })
    }

    return ret
  }

export const createSavedViewGroupFactory =
  (deps: {
    storeSavedViewGroup: StoreSavedViewGroup
    getViewerResourceGroups: GetViewerResourceGroups
  }): CreateSavedViewGroup =>
  async ({ input, authorId }) => {
    const { projectId, resourceIdString } = input
    const groupName = input.groupName.trim()
    if (groupName.length < 1 || groupName.length > 255) {
      throw new SavedViewGroupCreationValidationError(
        'Group name must be between 1 and 255 characters long',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    // Validate resourceIdString - it should only point to valid resources belonging to the project
    const resourceIds = await validateProjectResourceIdStringFactory(deps)({
      resourceIdString,
      projectId,
      errorMetadata: {
        input,
        authorId
      }
    })

    // Insert
    const group = await deps.storeSavedViewGroup({
      group: {
        projectId,
        resourceIds: resourceIds.toResources().map((r) => r.toString()),
        name: groupName,
        authorId
      }
    })

    return group
  }

export const getProjectSavedViewGroupsFactory =
  (deps: {
    getProjectSavedViewGroupsPageItems: GetProjectSavedViewGroupsPageItems
    getProjectSavedViewGroupsTotalCount: GetProjectSavedViewGroupsTotalCount
  }): GetProjectSavedViewGroups =>
  async (params) => {
    const noItemsNeeded = params.limit === 0
    const [totalCount, pageItems] = await Promise.all([
      deps.getProjectSavedViewGroupsTotalCount(params),
      noItemsNeeded
        ? Promise.resolve({ items: [], cursor: null })
        : deps.getProjectSavedViewGroupsPageItems(params)
    ])

    return {
      totalCount,
      ...pageItems
    }
  }

export const getGroupSavedViewsFactory =
  (deps: {
    getGroupSavedViewsPageItems: GetGroupSavedViewsPageItems
    getGroupSavedViewsTotalCount: GetGroupSavedViewsTotalCount
  }): GetGroupSavedViews =>
  async (params) => {
    const noItemsNeeded = params.limit === 0
    const [totalCount, pageItems] = await Promise.all([
      deps.getGroupSavedViewsTotalCount(params),
      noItemsNeeded
        ? Promise.resolve({ items: [], cursor: null })
        : deps.getGroupSavedViewsPageItems(params)
    ])

    return {
      totalCount,
      ...pageItems
    }
  }
