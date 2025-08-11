import type {
  CreateSavedView,
  CreateSavedViewGroup,
  DeleteSavedView,
  DeleteSavedViewRecord,
  GetGroupSavedViews,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetProjectSavedViewGroups,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetSavedView,
  GetSavedViewGroup,
  GetStoredViewCount,
  GetStoredViewGroupCount,
  RecalculateGroupResourceIds,
  StoreSavedView,
  StoreSavedViewGroup,
  UpdateSavedView,
  UpdateSavedViewRecord
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import {
  SavedViewCreationValidationError,
  SavedViewGroupCreationValidationError,
  SavedViewInvalidResourceTargetError,
  SavedViewUpdateValidationError
} from '@/modules/viewer/errors/savedViews'
import type { ResourceBuilder } from '@speckle/shared/viewer/route'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import type { VersionedSerializedViewerState } from '@speckle/shared/viewer/state'
import { inputToVersionedState } from '@speckle/shared/viewer/state'
import { isValidBase64Image } from '@speckle/shared/images/base64'
import type { GetViewerResourceGroups } from '@/modules/viewer/domain/operations/resources'
import { formatResourceIdsForGroup } from '@/modules/viewer/helpers/savedViews'
import { omit } from 'lodash-es'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import { removeNullOrUndefinedKeys } from '@speckle/shared'

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

const validateViewerStateFactory =
  () =>
  (params: {
    viewerState: unknown
    projectId: string
    resourceIds: ResourceBuilder
    errorMetadata: Record<string, unknown>
  }) => {
    const { viewerState, projectId, resourceIds, errorMetadata } = params

    const state = inputToVersionedState(viewerState)
    if (!state) {
      throw new SavedViewInvalidResourceTargetError(
        'Invalid viewer state provided. Must be a valid SerializedViewerState.',
        {
          info: errorMetadata
        }
      )
    }

    // Validate state match
    if (state.state.resources.request.resourceIdString !== resourceIds.toString()) {
      throw new SavedViewInvalidResourceTargetError(
        'Viewer state does not match the provided resourceIdString.',
        {
          info: errorMetadata
        }
      )
    }
    if (state.state.projectId !== projectId) {
      throw new SavedViewInvalidResourceTargetError(
        'Viewer state projectId does not match the provided projectId.',
        {
          info: errorMetadata
        }
      )
    }

    return state
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

    // Validate state
    const state = validateViewerStateFactory()({
      viewerState: input.viewerState,
      projectId,
      resourceIds,
      errorMetadata: {
        input,
        authorId
      }
    })

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
      name = `View - ${String(viewCount + 1).padStart(3, '0')}`
    } else if (name.length > 255) {
      throw new SavedViewCreationValidationError(
        'View name must be between 1 and 255 characters long',
        {
          info: {
            input,
            authorId
          }
        }
      )
    }

    const concreteResourceIds = resourceIds.toResources().map((r) => r.toString())
    const ret = await deps.storeSavedView({
      view: {
        projectId,
        resourceIds: concreteResourceIds,
        groupResourceIds: formatResourceIdsForGroup(concreteResourceIds),
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
    getStoredViewGroupCount: GetStoredViewGroupCount
  }): CreateSavedViewGroup =>
  async ({ input, authorId }) => {
    const { projectId, resourceIdString } = input
    let groupName = input.groupName?.trim()
    if (!groupName) {
      const groupCount = await deps.getStoredViewGroupCount({ projectId })
      groupName = `Group - ${String(groupCount + 1).padStart(3, '0')}`
    }

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

export const deleteSavedViewFactory =
  (deps: { deleteSavedViewRecord: DeleteSavedViewRecord }): DeleteSavedView =>
  async (params) => {
    const { id } = params
    await deps.deleteSavedViewRecord({ savedViewId: id })
  }

export const updateSavedViewFactory =
  (
    deps: {
      getSavedView: GetSavedView
      getSavedViewGroup: GetSavedViewGroup
      updateSavedViewRecord: UpdateSavedViewRecord
    } & DependenciesOf<typeof validateProjectResourceIdStringFactory>
  ): UpdateSavedView =>
  async (params) => {
    const { input, userId } = params
    const { projectId, id } = input

    // Check if view even exists
    const view = await deps.getSavedView({
      id: input.id,
      projectId
    })
    if (!view) {
      throw new SavedViewUpdateValidationError(
        "The specified saved view doesn't exist",
        {
          info: {
            input,
            userId
          }
        }
      )
    }

    // Validate that required fields are set
    const hasResourceIdString = 'resourceIdString' in input && input.resourceIdString
    const hasViewerState = 'viewerState' in input && input.viewerState
    const hasScreenshot = 'screenshot' in input && input.screenshot
    if (hasResourceIdString || hasViewerState) {
      if (!hasResourceIdString || !hasViewerState || !hasScreenshot) {
        throw new SavedViewUpdateValidationError(
          'If the resourceIdString or viewerState are being updated, resourceIdString, viewerState and screenshot must all be submitted.',
          {
            info: {
              input,
              userId
            }
          }
        )
      }
    }

    // Check if there's any actual changes
    const changes = removeNullOrUndefinedKeys(omit(input, ['id', 'projectId']))
    if (Object.keys(changes).length === 0) {
      throw new SavedViewUpdateValidationError('No changes submitted with the input.', {
        info: {
          input,
          userId
        }
      })
    }

    // Validate updated resourceIds
    let resourceIds: ResourceBuilder | undefined = undefined
    if ('resourceIdString' in changes && changes.resourceIdString) {
      const validate = validateProjectResourceIdStringFactory(deps)
      resourceIds = await validate({
        resourceIdString: changes.resourceIdString,
        projectId: input.projectId,
        errorMetadata: {
          input,
          userId
        }
      })
    }

    // Validate viewerState
    let viewerState: VersionedSerializedViewerState | undefined = undefined
    if ('viewerState' in changes && changes.viewerState) {
      // Validate state
      viewerState = validateViewerStateFactory()({
        viewerState: changes.viewerState,
        projectId,
        resourceIds: resourceIds!, // ts not smart enough, we checked for this above
        errorMetadata: {
          input,
          userId
        }
      })
    }

    // Validate groupId - group is a valid and accessible group in the project
    if (changes.groupId) {
      const group = await deps.getSavedViewGroup({
        id: changes.groupId,
        projectId
      })
      if (!group) {
        throw new SavedViewUpdateValidationError(
          'Provided groupId does not exist in the project.',
          {
            info: {
              input,
              userId
            }
          }
        )
      }
    }

    // Validate screenshot
    if (changes.screenshot && !isValidBase64Image(changes.screenshot)) {
      throw new SavedViewUpdateValidationError(
        'Invalid screenshot provided. Must be a valid base64 encoded image.',
        {
          info: {
            input,
            userId
          }
        }
      )
    }

    // Validate name
    if (changes.name && changes.name.length > 255) {
      throw new SavedViewUpdateValidationError(
        'View name must be between 1 and 255 characters long',
        {
          info: {
            input,
            userId
          }
        }
      )
    }

    const finalChanges = omit(changes, ['resourceIdString', 'viewerState'])
    const updatedView = await deps.updateSavedViewRecord({
      id,
      projectId,
      update: {
        ...finalChanges,
        ...(resourceIds
          ? {
              resourceIds: resourceIds
                ? resourceIds.map((r) => r.toString())
                : undefined,
              groupResourceIds: formatResourceIdsForGroup(resourceIds)
            }
          : { resourceIdString: undefined }),
        ...(viewerState
          ? {
              viewerState
            }
          : { viewerState: undefined })
      }
    })
    return updatedView! // should exist, we checked before
  }
