import type {
  CreateSavedView,
  CreateSavedViewGroup,
  DeleteSavedView,
  DeleteSavedViewGroup,
  DeleteSavedViewGroupRecord,
  DeleteSavedViewRecord,
  GetGroupSavedViews,
  GetGroupSavedViewsPageItems,
  GetGroupSavedViewsTotalCount,
  GetNewViewSpecificPosition,
  GetProjectSavedViewGroups,
  GetProjectSavedViewGroupsPageItems,
  GetProjectSavedViewGroupsTotalCount,
  GetSavedView,
  GetSavedViewGroup,
  GetStoredViewCount,
  GetStoredViewGroupCount,
  RebalanceViewPositions,
  RecalculateGroupResourceIds,
  SetNewHomeView,
  StoreSavedView,
  StoreSavedViewGroup,
  UpdateSavedView,
  UpdateSavedViewGroup,
  UpdateSavedViewGroupRecord,
  UpdateSavedViewRecord
} from '@/modules/viewer/domain/operations/savedViews'
import type { SavedViewGroup } from '@/modules/viewer/domain/types/savedViews'
import { SavedViewVisibility } from '@/modules/viewer/domain/types/savedViews'
import {
  SavedViewCreationValidationError,
  SavedViewGroupCreationValidationError,
  SavedViewGroupNotFoundError,
  SavedViewGroupUpdateValidationError,
  SavedViewInvalidHomeViewSettingsError,
  SavedViewInvalidResourceTargetError,
  SavedViewUpdateValidationError
} from '@/modules/viewer/errors/savedViews'
import type {
  ResourceBuilder,
  ViewerResourcesTarget
} from '@speckle/shared/viewer/route'
import { isModelResource, resourceBuilder } from '@speckle/shared/viewer/route'
import type { VersionedSerializedViewerState } from '@speckle/shared/viewer/state'
import { inputToVersionedState } from '@speckle/shared/viewer/state'
import { isValidBase64Image } from '@speckle/shared/images/base64'
import type { GetViewerResourceGroups } from '@/modules/viewer/domain/operations/resources'
import { formatResourceIdsForGroup } from '@/modules/viewer/helpers/savedViews'
import { isString, isUndefined, omit } from 'lodash-es'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { removeNullOrUndefinedKeys, firstDefinedValue } from '@speckle/shared'
import { isUngroupedGroup } from '@speckle/shared/saved-views'
import { NotFoundError } from '@/modules/shared/errors'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { SavedViewsEvents } from '@/modules/viewer/domain/events/savedViews'

/**
 * Validates an incoming resourceIdString against the resources in the project and returns the validated list (as a builder)
 */
const validateProjectResourceIdStringFactory =
  (deps: { getViewerResourceGroups: GetViewerResourceGroups }) =>
  async (params: {
    resourceIdString: ViewerResourcesTarget
    projectId: string
    errorMetadata: Record<string, unknown>
  }) => {
    const { resourceIdString, errorMetadata, projectId } = params

    // Validate resourceIdString - it should only point to valid resources belonging to the project
    const resourceIds = resourceBuilder().addResources(resourceIdString)
    if (!resourceIds.length) {
      throw new SavedViewInvalidResourceTargetError(
        "No valid resources referenced in 'resourceIdString'",
        {
          info: errorMetadata
        }
      )
    }

    const { groups: resourceGroups } = await deps.getViewerResourceGroups({
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

const validateHomeViewSettingsFactory =
  () =>
  (params: {
    isHomeView: MaybeNullOrUndefined<boolean>
    visibility: MaybeNullOrUndefined<SavedViewVisibility>
    errorMetadata: Record<string, unknown>
    resourceIds: ResourceBuilder
  }) => {
    const { isHomeView, visibility, errorMetadata, resourceIds } = params

    if (isHomeView) {
      if (visibility !== SavedViewVisibility.public) {
        throw new SavedViewInvalidHomeViewSettingsError('Home views must be public.', {
          info: errorMetadata
        })
      }

      const firstResource = resourceIds.toResources().at(0)
      const modelResource =
        firstResource && isModelResource(firstResource) ? firstResource : undefined

      const isSingleModelView = resourceIds.length === 1 && modelResource
      if (!isSingleModelView) {
        throw new SavedViewInvalidHomeViewSettingsError(
          `Home views can't be federated and must refer to a single model.`,
          {
            info: errorMetadata
          }
        )
      }

      return {
        homeViewModel: modelResource
      }
    }

    return {
      homeViewModel: undefined
    }
  }

const resolveViewGroupSettingsFactory =
  (deps: { getSavedViewGroup: GetSavedViewGroup }) =>
  async (params: {
    groupId: MaybeNullOrUndefined<string>
    projectId: string
    errorMetadata: Record<string, unknown>
  }) => {
    const { groupId, projectId, errorMetadata } = params

    if (!groupId) return isString(groupId) ? null : groupId // null or undefined (different meanings)

    // Validate groupId - group is a valid and accessible group in the project
    // Check if default group (actually means - null group)
    const isDefaultGroup = isUngroupedGroup(groupId)
    if (isDefaultGroup) {
      return null
    } else {
      const group = await deps.getSavedViewGroup({
        id: groupId,
        projectId
      })
      if (!group) {
        throw new SavedViewGroupNotFoundError(
          'Provided groupId does not exist in the project.',
          {
            info: errorMetadata
          }
        )
      }
      return group
    }
  }

export const createSavedViewFactory =
  (deps: {
    getViewerResourceGroups: GetViewerResourceGroups
    getStoredViewCount: GetStoredViewCount
    storeSavedView: StoreSavedView
    getSavedViewGroup: GetSavedViewGroup
    recalculateGroupResourceIds: RecalculateGroupResourceIds
    setNewHomeView: SetNewHomeView
    getNewViewSpecificPosition: GetNewViewSpecificPosition
    rebalanceViewPositions: RebalanceViewPositions
    emit: EventBusEmit
  }): CreateSavedView =>
  async ({ input, authorId }) => {
    const { resourceIdString, projectId, position: positionInput } = input
    const visibility = input.visibility || SavedViewVisibility.public // default to public
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
    let group =
      (await resolveViewGroupSettingsFactory(deps)({
        groupId: input.groupId?.trim(),
        projectId,
        errorMetadata: {
          input,
          authorId
        }
      })) || null

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

    // Validate home view settings
    const { homeViewModel } = validateHomeViewSettingsFactory()({
      isHomeView,
      visibility,
      errorMetadata: {
        input,
        authorId
      },
      resourceIds
    })

    // Resolve new position
    const { newPosition: position, needsRebalancing } =
      await deps.getNewViewSpecificPosition({
        projectId,
        groupId: group?.id || null,
        resourceIdString: resourceIds.toString(),
        beforeId: positionInput?.beforeViewId,
        afterId: positionInput?.afterViewId
      })

    const concreteResourceIds = resourceIds.toResources().map((r) => r.toString())
    const ret = await deps.storeSavedView({
      view: {
        projectId,
        resourceIds: concreteResourceIds,
        groupResourceIds: formatResourceIdsForGroup(concreteResourceIds),
        groupId: group?.id,
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

    await Promise.all([
      ...(group?.id
        ? [
            deps.recalculateGroupResourceIds({ groupId: group.id }).then((g) => {
              // Update reference to have new ids
              group = g || group
            })
          ]
        : []),
      ...(homeViewModel
        ? [
            deps.setNewHomeView({
              projectId,
              modelId: homeViewModel.modelId,
              newHomeViewId: ret.id
            })
          ]
        : []),
      ...(needsRebalancing
        ? [
            deps.rebalanceViewPositions({
              projectId,
              groupId: ret!.groupId || null,
              resourceIdString: ret!.resourceIds.join(',')
            })
          ]
        : [])
    ])

    await Promise.all([
      ...(group?.id
        ? [
            deps.emit({
              eventName: SavedViewsEvents.GroupUpdated,
              payload: {
                savedViewGroup: group,
                updaterId: authorId,
                isIndirectUpdate: true
              }
            })
          ]
        : []),
      deps.emit({
        eventName: SavedViewsEvents.Created,
        payload: {
          savedView: ret,
          creatorId: authorId
        }
      })
    ])

    return ret
  }

export const createSavedViewGroupFactory =
  (deps: {
    storeSavedViewGroup: StoreSavedViewGroup
    getViewerResourceGroups: GetViewerResourceGroups
    getStoredViewGroupCount: GetStoredViewGroupCount
    emit: EventBusEmit
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
      resourceIdString: formatResourceIdsForGroup(resourceIdString),
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
        resourceIds: resourceIds.map((r) => r.toString()),
        name: groupName,
        authorId
      }
    })

    await deps.emit({
      eventName: SavedViewsEvents.GroupCreated,
      payload: {
        savedViewGroup: group,
        creatorId: authorId
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
  (deps: {
    getSavedView: GetSavedView
    deleteSavedViewRecord: DeleteSavedViewRecord
    recalculateGroupResourceIds: RecalculateGroupResourceIds
    emit: EventBusEmit
  }): DeleteSavedView =>
  async (params) => {
    const { id, projectId, userId } = params
    const view = await deps.getSavedView({
      id,
      projectId
    })
    if (!view) {
      throw new NotFoundError('Saved view not found', {
        info: params
      })
    }

    await deps.deleteSavedViewRecord({ savedViewId: id })

    let group: SavedViewGroup | undefined = undefined
    if (view.groupId) {
      group = await deps.recalculateGroupResourceIds({ groupId: view.groupId })
    }

    await Promise.all([
      deps.emit({
        eventName: SavedViewsEvents.Deleted,
        payload: {
          savedView: view,
          deleterId: userId
        }
      }),
      ...(group
        ? [
            deps.emit({
              eventName: SavedViewsEvents.GroupUpdated,
              payload: {
                savedViewGroup: group,
                updaterId: userId,
                isIndirectUpdate: true
              }
            })
          ]
        : [])
    ])
  }

export const updateSavedViewFactory =
  (
    deps: {
      getSavedView: GetSavedView
      getSavedViewGroup: GetSavedViewGroup
      updateSavedViewRecord: UpdateSavedViewRecord
      recalculateGroupResourceIds: RecalculateGroupResourceIds
      setNewHomeView: SetNewHomeView
      getNewViewSpecificPosition: GetNewViewSpecificPosition
      rebalanceViewPositions: RebalanceViewPositions
      emit: EventBusEmit
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

    const changes = {
      ...removeNullOrUndefinedKeys(omit(input, ['id', 'projectId'])),
      ...(!isUndefined(input.groupId)
        ? {
            groupId: input.groupId // we want to allow null, which means - no group
          }
        : {})
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
    changes.groupId = (
      await resolveViewGroupSettingsFactory(deps)({
        groupId: changes.groupId,
        projectId,
        errorMetadata: {
          input,
          userId
        }
      })
    )?.id
    if (isUndefined(changes.groupId)) {
      delete changes.groupId // the key shouldnt even be there
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
    if (changes.name?.trim()) {
      if (changes.name.length > 255) {
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
    } else {
      delete changes['name']
    }

    // Validate home view settings
    const { homeViewModel } = validateHomeViewSettingsFactory()({
      isHomeView: firstDefinedValue(changes.isHomeView, view.isHomeView),
      visibility: firstDefinedValue(changes.visibility, view.visibility),
      errorMetadata: {
        input,
        userId
      },
      resourceIds: resourceIds || resourceBuilder().addResources(view.resourceIds)
    })

    // Position
    let position: number | undefined = undefined
    let needsRebalancing = false
    if ('position' in changes && changes.position) {
      const posInput = changes.position
      const newPos = await deps.getNewViewSpecificPosition({
        projectId,
        groupId: ('groupId' in changes ? changes.groupId : view.groupId) || null,
        resourceIdString: resourceIds
          ? resourceIds.toString()
          : view.resourceIds.join(','),
        beforeId: posInput.type === 'between' ? posInput.beforeViewId || null : null,
        afterId: posInput.type === 'between' ? posInput.afterViewId || null : null
      })
      position = newPos.newPosition
      needsRebalancing = newPos.needsRebalancing
    }

    const finalChanges = omit(changes, ['resourceIdString', 'viewerState', 'position'])
    const update = {
      ...finalChanges,
      ...(resourceIds
        ? {
            resourceIds: resourceIds ? resourceIds.toResourceIds() : undefined,
            groupResourceIds: formatResourceIdsForGroup(resourceIds)
          }
        : {}),
      ...(viewerState
        ? {
            viewerState
          }
        : {}),
      ...(!isUndefined(position) ? { position } : {})
    }

    // Check if there's any actual changes
    const updateKeys = Object.keys(update) as Array<keyof typeof update>
    if (updateKeys.length === 0) {
      throw new SavedViewUpdateValidationError('No changes submitted with the input.', {
        info: {
          input,
          userId
        }
      })
    }

    // Only update date on: replace, group change
    const shouldUpdateDate = hasViewerState || 'groupId' in update
    const updatedView = (await deps.updateSavedViewRecord(
      {
        id,
        projectId,
        update
      },
      {
        skipUpdatingDate: !shouldUpdateDate
      }
    ))!

    let newGroup: SavedViewGroup | undefined = undefined
    let oldGroup: SavedViewGroup | undefined = undefined
    await Promise.all([
      ...(updatedView.groupId !== view.groupId || update.resourceIds?.length
        ? [
            ...(updatedView.groupId
              ? [
                  deps
                    .recalculateGroupResourceIds({
                      groupId: updatedView.groupId
                    })
                    .then((g) => (newGroup = g))
                ]
              : []),
            ...(view.groupId && updatedView.groupId !== view.groupId
              ? [
                  deps
                    .recalculateGroupResourceIds({
                      groupId: view.groupId
                    })
                    .then((g) => (oldGroup = g))
                ]
              : [])
          ]
        : []),
      ...(homeViewModel
        ? [
            deps.setNewHomeView({
              projectId,
              newHomeViewId: updatedView.id,
              modelId: homeViewModel.modelId
            })
          ]
        : []),
      ...(needsRebalancing
        ? [
            deps.rebalanceViewPositions({
              projectId,
              groupId: updatedView!.groupId || null,
              resourceIdString: updatedView!.resourceIds.join(',')
            })
          ]
        : [])
    ])

    await Promise.all([
      deps.emit({
        eventName: SavedViewsEvents.Updated,
        payload: {
          savedView: updatedView!,
          updaterId: userId
        }
      }),
      ...(newGroup
        ? [
            deps.emit({
              eventName: SavedViewsEvents.GroupUpdated,
              payload: {
                savedViewGroup: newGroup,
                updaterId: userId,
                isIndirectUpdate: true
              }
            })
          ]
        : []),
      ...(oldGroup
        ? [
            deps.emit({
              eventName: SavedViewsEvents.GroupUpdated,
              payload: {
                savedViewGroup: oldGroup,
                updaterId: userId,
                isIndirectUpdate: true
              }
            })
          ]
        : [])
    ])

    return updatedView
  }

export const deleteSavedViewGroupFactory =
  (deps: {
    deleteSavedViewGroupRecord: DeleteSavedViewGroupRecord
    emit: EventBusEmit
    getSavedViewGroup: GetSavedViewGroup
  }): DeleteSavedViewGroup =>
  async ({ input, userId }) => {
    const { groupId, projectId } = input

    if (isUngroupedGroup(groupId)) {
      throw new SavedViewGroupUpdateValidationError(
        'Cannot mutate ungrouped/default saved view group.'
      )
    }

    const group = await deps.getSavedViewGroup({
      id: groupId,
      projectId
    })
    if (!group) {
      throw new SavedViewGroupUpdateValidationError('Group not found', {
        info: {
          input,
          userId
        }
      })
    }

    const ret = await deps.deleteSavedViewGroupRecord({
      groupId,
      projectId
    })

    if (ret) {
      await deps.emit({
        eventName: SavedViewsEvents.GroupDeleted,
        payload: {
          savedViewGroup: group,
          deleterId: userId
        }
      })
    }

    return ret
  }

export const updateSavedViewGroupFactory =
  (deps: {
    updateSavedViewGroupRecord: UpdateSavedViewGroupRecord
    getSavedViewGroup: GetSavedViewGroup
    emit: EventBusEmit
  }): UpdateSavedViewGroup =>
  async ({ input, userId }) => {
    const { groupId, projectId } = input

    if (isUngroupedGroup(groupId)) {
      throw new SavedViewGroupUpdateValidationError(
        'Cannot update ungrouped/default saved view group.'
      )
    }

    const group = await deps.getSavedViewGroup({
      id: groupId,
      projectId
    })
    if (!group) {
      throw new SavedViewGroupUpdateValidationError('Group not found.', {
        info: {
          input,
          userId
        }
      })
    }

    const changes = removeNullOrUndefinedKeys(omit(input, ['groupId', 'projectId']))

    // Validate name
    if (changes.name?.trim()) {
      if (changes.name.length > 255) {
        throw new SavedViewGroupUpdateValidationError(
          'View name must be between 1 and 255 characters long',
          {
            info: {
              input,
              userId
            }
          }
        )
      }
    } else {
      delete changes['name']
    }

    if (Object.keys(changes).length === 0) {
      throw new SavedViewGroupUpdateValidationError(
        'No changes submitted with the input.',
        {
          info: {
            input,
            userId
          }
        }
      )
    }

    // Update the saved view group
    const updatedGroup = (await deps.updateSavedViewGroupRecord({
      groupId,
      projectId,
      update: changes
    }))!

    await deps.emit({
      eventName: SavedViewsEvents.GroupUpdated,
      payload: {
        savedViewGroup: updatedGroup,
        updaterId: userId,
        isIndirectUpdate: false
      }
    })

    return updatedGroup
  }
