import {
  GetBranchLatestCommits,
  GetStreamBranchesByName
} from '@/modules/core/domain/branches/operations'
import {
  GetAllBranchCommits,
  GetSpecificBranchCommits
} from '@/modules/core/domain/commits/operations'
import { GetStreamObjects } from '@/modules/core/domain/objects/operations'
import {
  ViewerResourceGroup,
  ViewerResourceItem,
  ViewerUpdateTrackingTarget
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import {
  GetViewerResourceGroups,
  GetViewerResourceItemsUngrouped
} from '@/modules/viewer/domain/operations/resources'
import { Optional, SpeckleViewer } from '@speckle/shared'
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
        if (allowEmptyModels) {
          results.push({
            identifier: modelResource.toString(),
            items: []
          })
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
 * Validate requested resource identifiers and build viewer resource groups & items with
 * the metadata that the viewer needs to work with these
 */
export const getViewerResourceGroupsFactory =
  (
    deps: GetObjectResourceGroupsDeps & GetVersionResourceGroupsDeps
  ): GetViewerResourceGroups =>
  async (
    target: ViewerUpdateTrackingTarget & {
      /**
       * By default this only returns groups w/ resources in them. W/ this flag set, it will also
       * return valid model groups that have no resources in them
       */
      allowEmptyModels?: boolean
    }
  ): Promise<ViewerResourceGroup[]> => {
    const { resourceIdString, projectId, loadedVersionsOnly, allowEmptyModels } = target
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
  async (target: ViewerUpdateTrackingTarget): Promise<ViewerResourceItem[]> => {
    const { resourceIdString } = target
    if (!resourceIdString?.trim().length) return []

    let results: ViewerResourceItem[] = []
    const groups = await deps.getViewerResourceGroups(target)
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
