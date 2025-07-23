import type {
  CreateSavedView,
  GetGroupSavedViews,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetProjectSavedViewGroups,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetStoredViewCount,
  StoreSavedView
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import { SavedViewCreationValidationError } from '@/modules/viewer/errors/savedViews'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { inputToVersionedState } from '@speckle/shared/viewer/state'
import { isValidBase64Image } from '@speckle/shared/images/base64'
import type { GetViewerResourceGroups } from '@/modules/viewer/domain/operations/resources'
import { NULL_GROUP_NAME_VALUE } from '@/modules/viewer/helpers/savedViews'

export const createSavedViewFactory =
  (deps: {
    getViewerResourceGroups: GetViewerResourceGroups
    getStoredViewCount: GetStoredViewCount
    storeSavedView: StoreSavedView
  }): CreateSavedView =>
  async ({ input, authorId }) => {
    const { resourceIdString, projectId } = input

    // Validate resourceIdString - it should only point to valid resources belonging to the project
    const resourceIds = resourceBuilder().addFromString(resourceIdString)
    if (!resourceIds.length) {
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
      throw new SavedViewCreationValidationError(
        'One or more resources could not be found in the project: {resourceIdString}',
        {
          info: {
            input,
            authorId,
            resourceIdString: failingResources.toString()
          }
        }
      )
    }

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

    const visibility = input.visibility || SavedViewVisibility.public
    const position = 0 // TODO: Resolve based on existing views
    const groupName = input.groupName?.trim() || null
    const description = input.description?.trim() || null
    const isHomeView = input.isHomeView || false

    // Auto-generate name, if one not set
    let name = input.name?.trim()
    if (!name?.length) {
      const viewCount = await deps.getStoredViewCount({ projectId })
      name = `Scene - ${String(viewCount + 1).padStart(3, '0')}`
    }

    if (name === NULL_GROUP_NAME_VALUE) {
      throw new SavedViewCreationValidationError(
        'This name is reserved and cannot be used.',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    const ret = await deps.storeSavedView({
      view: {
        projectId,
        resourceIds: resourceIds.toResources().map((r) => r.toString()),
        groupName,
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

    return ret
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
