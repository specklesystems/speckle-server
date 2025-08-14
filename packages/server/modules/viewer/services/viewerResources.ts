import type {
  GetBranchesByIds,
  GetBranchLatestCommits,
  GetStreamBranchesByName
} from '@/modules/core/domain/branches/operations'
import type {
  GetAllBranchCommits,
  GetSpecificBranchCommits
} from '@/modules/core/domain/commits/operations'
import type { GetStreamObjects } from '@/modules/core/domain/objects/operations'
import type {
  SavedViewsLoadSettings,
  ViewerResourceGroup,
  ViewerResourceItem
} from '@/modules/core/graph/generated/graphql'
import type { CommitRecord } from '@/modules/core/helpers/types'
import { NotFoundError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import type {
  GetViewerResourceGroups,
  GetViewerResourceItemsUngrouped
} from '@/modules/viewer/domain/operations/resources'
import type { GetSavedView } from '@/modules/viewer/domain/operations/savedViews'
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { SpeckleViewer } from '@speckle/shared'
import {
  isModelResource,
  resourceBuilder,
  ViewerModelResource
} from '@speckle/shared/viewer/route'
import { flatten, keyBy, uniq, uniqWith } from 'lodash-es'

export function isResourceItemEqual(a: ViewerResourceItem, b: ViewerResourceItem) {
  if (a.modelId !== b.modelId) return false
  if (a.objectId !== b.objectId) return false
  if (a.versionId !== b.versionId) return false
  return true
}

export type GetObjectResourceGroupsDeps = {
  getStreamObjects: GetStreamObjects
}

export const getObjectResourceGroupsFactory =
  (deps: GetObjectResourceGroupsDeps) =>
  async (
    projectId: string,
    resources: SpeckleViewer.ViewerRoute.ViewerObjectResource[]
  ) => {
    const objects = keyBy(
      await deps.getStreamObjects(
        projectId,
        resources.map((r) => r.objectId)
      ),
      'id'
    )

    const results: ViewerResourceGroup[] = []
    for (const objectResource of resources) {
      if (!objects[objectResource.objectId]) continue

      results.push({
        identifier: objectResource.toString(),
        items: [{ modelId: null, versionId: null, objectId: objectResource.objectId }]
      })
    }

    return results
  }

type GetVersionResourceGroupsIncludingAllVersionsFactoryDeps = {
  getStreamBranchesByName: GetStreamBranchesByName
  getAllBranchCommits: GetAllBranchCommits
}

const getVersionResourceGroupsIncludingAllVersionsFactory =
  (deps: GetVersionResourceGroupsIncludingAllVersionsFactoryDeps) =>
  async (
    projectId: string,
    params: {
      modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
      folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
    }
  ) => {
    // by default we pull all versions of all relevant branches, but if loadedVersionsOnly is set, we only pull
    // specifically requested versions (if version isn't set in identifier, then latest version)

    const { modelResources = [], folderResources = [] } = params
    const results: ViewerResourceGroup[] = []

    const foldersModels = await deps.getStreamBranchesByName(
      projectId,
      folderResources.map((r) => r.folderName),
      { startsWithName: true }
    )

    const allBranchIds = [
      ...foldersModels.map((m) => m.id),
      ...modelResources.map((m) => m.modelId)
    ]

    // get all versions of all referenced branches
    const branchCommits = await deps.getAllBranchCommits({ branchIds: allBranchIds })

    for (const folderResource of folderResources) {
      const prefix = folderResource.folderName
      const folderModels = foldersModels.filter((m) =>
        m.name.toLowerCase().startsWith(prefix)
      )
      if (!folderModels.length) continue

      const items: ViewerResourceItem[] = []
      for (const folderModel of folderModels) {
        const modelVersions = branchCommits[folderModel.id]
        if (!modelVersions?.length) continue

        for (const modelVersion of modelVersions) {
          items.push({
            modelId: folderModel.id,
            versionId: modelVersion.id,
            objectId: modelVersion.referencedObject
          })
        }
      }

      results.push({
        identifier: folderResource.toString(),
        items
      })
    }

    for (const modelResource of modelResources) {
      const modelVersions = branchCommits[modelResource.modelId] || []

      const items: ViewerResourceItem[] = []
      for (const modelVersion of modelVersions) {
        items.push({
          modelId: modelResource.modelId,
          versionId: modelVersion.id,
          objectId: modelVersion.referencedObject
        })
      }

      results.push({
        identifier: modelResource.toString(),
        items
      })
    }

    return results
  }

type GetVersionResourceGroupsLoadedVersionsOnlyDeps = {
  getStreamBranchesByName: GetStreamBranchesByName
  getBranchesByIds: GetBranchesByIds
  getSpecificBranchCommits: GetSpecificBranchCommits
  getBranchLatestCommits: GetBranchLatestCommits
}

const getVersionResourceGroupsLoadedVersionsOnlyFactory =
  (deps: GetVersionResourceGroupsLoadedVersionsOnlyDeps) =>
  async (
    projectId: string,
    params: {
      modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
      folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
      allowEmptyModels?: boolean
    }
  ) => {
    // by default we pull all versions of all relevant branches, but if loadedVersionsOnly is set, we only pull
    // specifically requested versions (if version isn't set in identifier, then latest version)

    const { modelResources = [], folderResources = [], allowEmptyModels } = params
    const results: ViewerResourceGroup[] = []

    const foldersModels = await deps.getStreamBranchesByName(
      projectId,
      folderResources.map((r) => r.folderName),
      { startsWithName: true }
    )

    const specificVersionPairs = modelResources
      .filter(
        (
          r
        ): r is SpeckleViewer.ViewerRoute.ViewerModelResource & { versionId: string } =>
          !!r.versionId
      )
      .map((r) => ({ branchId: r.modelId, commitId: r.versionId }))

    const latestVersionModelIds = uniq([
      ...modelResources.filter((r) => !r.versionId).map((r) => r.modelId),
      ...foldersModels.map((m) => m.id)
    ])

    const [specificVersions, latestVersions] = await Promise.all([
      deps.getSpecificBranchCommits(specificVersionPairs),
      deps.getBranchLatestCommits(latestVersionModelIds)
    ])
    const modelLatestVersions = keyBy(latestVersions, 'branchId')

    for (const folderResource of folderResources) {
      const prefix = folderResource.folderName
      const folderModels = foldersModels.filter((m) =>
        m.name.toLowerCase().startsWith(prefix)
      )
      if (!folderModels.length) continue

      const items: ViewerResourceItem[] = []
      for (const folderModel of folderModels) {
        const latestVersion = modelLatestVersions[folderModel.id]
        if (!latestVersion) continue

        items.push({
          modelId: folderModel.id,
          versionId: latestVersion.id,
          objectId: latestVersion.referencedObject
        })
      }

      results.push({
        identifier: folderResource.toString(),
        items
      })
    }

    const emptyModels: ViewerModelResource[] = []
    for (const modelResource of modelResources) {
      let item: Optional<CommitRecord & { branchId: string }> = undefined
      if (modelResource.versionId) {
        item = specificVersions.find(
          (v) =>
            v.branchId === modelResource.modelId && v.id === modelResource.versionId
        )
      } else {
        item = modelLatestVersions[modelResource.modelId]
      }

      if (!item) {
        if (allowEmptyModels && !modelResource.versionId) {
          emptyModels.push(modelResource)
        }
        continue
      }

      results.push({
        identifier: modelResource.toString(),
        items: [
          {
            modelId: item.branchId,
            versionId: item.id,
            objectId: item.referencedObject
          }
        ]
      })
    }

    // Validate that empty model resources are actually real models
    if (emptyModels.length && allowEmptyModels) {
      const emptyModelRecords = await deps.getBranchesByIds(
        emptyModels.map((r) => r.modelId),
        { streamId: projectId }
      )
      const emptyModelIds = new Set(emptyModelRecords.map((m) => m.id))
      for (const emptyModelId of emptyModelIds) {
        results.push({
          identifier: emptyModelId,
          items: []
        })
      }
    }

    return results
  }

type GetAllModelsResourceGroupDeps = {
  getBranchLatestCommits: GetBranchLatestCommits
}

const getAllModelsResourceGroupFactory =
  (deps: GetAllModelsResourceGroupDeps) =>
  async (projectId: string): Promise<ViewerResourceGroup> => {
    const allBranchCommits = await deps.getBranchLatestCommits(undefined, projectId)
    return {
      identifier: 'all',
      items: allBranchCommits.map(
        (c): ViewerResourceItem => ({
          modelId: c.branchId,
          versionId: c.id,
          objectId: c.referencedObject
        })
      )
    }
  }

type GetVersionResourceGroupsDeps = GetAllModelsResourceGroupDeps &
  GetVersionResourceGroupsLoadedVersionsOnlyDeps &
  GetVersionResourceGroupsIncludingAllVersionsFactoryDeps

/**
 * Version resources can be resolved 2 ways:
 * * Default - Specific version IDs referenced in identifiers are ignored and the identifiers always
 * refer to all versions of any referenced branch/branches of folders.
 * * Loaded versions only - Identifiers only refer to specific version IDs referenced in resource
 * identifiers, or if none are specified then only the latest version is referenced (e.g. in folder
 * resources & model resources w/ an empty version ID)
 */
const getVersionResourceGroupsFactory =
  (deps: GetVersionResourceGroupsDeps) =>
  async (
    projectId: string,
    params: {
      modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
      folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
      allModelsResource?: SpeckleViewer.ViewerRoute.ViewerAllModelsResource
      loadedVersionsOnly?: boolean
      allowEmptyModels?: boolean
    }
  ) => {
    const allModelsGroup = params.allModelsResource
      ? await getAllModelsResourceGroupFactory(deps)(projectId)
      : null

    const groups = params.loadedVersionsOnly
      ? await getVersionResourceGroupsLoadedVersionsOnlyFactory(deps)(projectId, params)
      : await getVersionResourceGroupsIncludingAllVersionsFactory(deps)(
          projectId,
          params
        )

    return [...(allModelsGroup ? [allModelsGroup] : []), ...groups]
  }

/**
 * Resolve final resourceIdString based on the saved view and its load settings
 */
const adjustResourceIdStringWithSavedViewSettingsFactory =
  (deps: { getSavedView: GetSavedView }) =>
  async (params: {
    projectId: string
    resourceIdString: string
    savedViewId: string
    savedViewSettings: MaybeNullOrUndefined<SavedViewsLoadSettings>
  }): Promise<string> => {
    const { resourceIdString, projectId, savedViewId, savedViewSettings } = params
    const { loadOriginal } = savedViewSettings || {}

    const savedView = await deps.getSavedView({
      id: savedViewId,
      projectId
    })
    if (!savedView) {
      throw new NotFoundError(
        `Saved view with ID ${savedViewId} not found in project ${projectId}`
      )
    }

    const savedViewResources = resourceBuilder().addFromString(savedView.resourceIds)
    const baseResources = resourceBuilder().addFromString(resourceIdString)
    const finalSavedViewResources = savedViewResources.map((r) => {
      if (!isModelResource(r) || !r.versionId) {
        return r
      }

      const matchingBaseResource = baseResources.filter(isModelResource).find((r2) => {
        return r2.modelId === r.modelId
      })
      const versionId = loadOriginal ? r.versionId : matchingBaseResource?.versionId
      return new ViewerModelResource(r.modelId, versionId)
    })

    return resourceBuilder()
      .addResources(finalSavedViewResources)
      .addNew(baseResources) // keep other stuff around
      .toString()
  }

/**
 * Validate requested resource identifiers and build viewer resource groups & items with
 * the metadata that the viewer needs to work with these
 */
export const getViewerResourceGroupsFactory =
  (
    deps: GetObjectResourceGroupsDeps &
      GetVersionResourceGroupsDeps &
      DependenciesOf<typeof adjustResourceIdStringWithSavedViewSettingsFactory>
  ): GetViewerResourceGroups =>
  async (params): Promise<ViewerResourceGroup[]> => {
    const {
      projectId,
      loadedVersionsOnly,
      allowEmptyModels,
      savedViewId,
      savedViewSettings
    } = params

    let resourceIdString = params.resourceIdString
    if (savedViewId && getFeatureFlags().FF_SAVED_VIEWS_ENABLED) {
      resourceIdString = await adjustResourceIdStringWithSavedViewSettingsFactory(deps)(
        {
          resourceIdString,
          projectId,
          savedViewId,
          savedViewSettings
        }
      )
    }

    if (!resourceIdString?.trim().length) return []
    const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(resourceIdString)

    const allModelsResource = resources.find(
      SpeckleViewer.ViewerRoute.isAllModelsResource
    )
    const objectResources = resources.filter(SpeckleViewer.ViewerRoute.isObjectResource)
    const modelResources = resources.filter(SpeckleViewer.ViewerRoute.isModelResource)
    const folderResources = resources.filter(
      SpeckleViewer.ViewerRoute.isModelFolderResource
    )

    const results: ViewerResourceGroup[] = flatten(
      await Promise.all([
        getObjectResourceGroupsFactory(deps)(projectId, objectResources),
        getVersionResourceGroupsFactory(deps)(projectId, {
          modelResources,
          folderResources,
          allModelsResource,
          loadedVersionsOnly: loadedVersionsOnly || false,
          allowEmptyModels
        })
      ])
    )

    return results
  }

export const getViewerResourceItemsUngroupedFactory =
  (deps: {
    getViewerResourceGroups: GetViewerResourceGroups
  }): GetViewerResourceItemsUngrouped =>
  async (params): Promise<ViewerResourceItem[]> => {
    const { resourceIdString } = params
    if (!resourceIdString?.trim().length) return []

    let results: ViewerResourceItem[] = []
    const groups = await deps.getViewerResourceGroups(params)
    for (const group of groups) {
      results = results.concat(group.items)
    }

    return uniqWith(results, isResourceItemEqual)
  }

/**
 * Whether any of the resource items match
 */
export function doViewerResourcesFit(
  requestedResources: ViewerResourceItem[],
  incomingResources: ViewerResourceItem[]
) {
  return incomingResources.some((ir) =>
    requestedResources.some((rr) => isResourceItemEqual(ir, rr))
  )
}

export function viewerResourcesToString(resources: ViewerResourceItem[]): string {
  const builder = SpeckleViewer.ViewerRoute.resourceBuilder()
  for (const resource of resources) {
    if (resource.modelId && resource.versionId) {
      builder.addModel(resource.modelId, resource.versionId)
    } else {
      builder.addObject(resource.objectId)
    }
  }

  return builder.toString()
}
