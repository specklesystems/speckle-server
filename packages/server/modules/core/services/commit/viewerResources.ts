import { getCommentsResources } from '@/modules/comments/repositories/comments'
import {
  ResourceIdentifier,
  ResourceIdentifierInput,
  ResourceType,
  ViewerResourceGroup,
  ViewerResourceItem,
  ViewerUpdateTrackingTarget
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import {
  getBranchLatestCommits,
  getStreamBranchesByName
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommits,
  getCommitsAndTheirBranchIds,
  getSpecificBranchCommits
} from '@/modules/core/repositories/commits'
import { getStreamObjects } from '@/modules/core/repositories/objects'
import { Optional, SpeckleViewer } from '@speckle/shared'
import { flatten, keyBy, reduce, uniq, uniqWith } from 'lodash'

function isResourceItemEqual(a: ViewerResourceItem, b: ViewerResourceItem) {
  if (a.modelId !== b.modelId) return false
  if (a.objectId !== b.objectId) return false
  if (a.versionId !== b.versionId) return false
  return true
}

function isResourceIdentifierEqual(
  a: ResourceIdentifier | ResourceIdentifierInput,
  b: ResourceIdentifier | ResourceIdentifierInput
) {
  if (a.resourceId !== b.resourceId) return false
  if (a.resourceType !== b.resourceType) return false
  return true
}

async function getObjectResourceGroups(
  projectId: string,
  resources: SpeckleViewer.ViewerRoute.ViewerObjectResource[]
) {
  const objects = keyBy(
    await getStreamObjects(
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

async function getVersionResourceGroupsIncludingAllVersions(
  projectId: string,
  params: {
    modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
    folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
  }
) {
  // by default we pull all versions of all relevant branches, but if loadedVersionsOnly is set, we only pull
  // specifically requested versions (if version isn't set in identifier, then latest version)

  const { modelResources = [], folderResources = [] } = params
  const results: ViewerResourceGroup[] = []

  const foldersModels = await getStreamBranchesByName(
    projectId,
    folderResources.map((r) => r.folderName),
    { startsWithName: true }
  )

  const allBranchIds = [
    ...foldersModels.map((m) => m.id),
    ...modelResources.map((m) => m.modelId)
  ]

  // get all versions of all referenced branches
  const branchCommits = await getAllBranchCommits({ branchIds: allBranchIds })

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

async function getVersionResourceGroupsLoadedVersionsOnly(
  projectId: string,
  params: {
    modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
    folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
  }
) {
  // by default we pull all versions of all relevant branches, but if loadedVersionsOnly is set, we only pull
  // specifically requested versions (if version isn't set in identifier, then latest version)

  const { modelResources = [], folderResources = [] } = params
  const results: ViewerResourceGroup[] = []

  const foldersModels = await getStreamBranchesByName(
    projectId,
    folderResources.map((r) => r.folderName),
    { startsWithName: true }
  )

  const specificVersionPairs = modelResources
    .filter(
      (r): r is SpeckleViewer.ViewerRoute.ViewerModelResource & { versionId: string } =>
        !!r.versionId
    )
    .map((r) => ({ branchId: r.modelId, commitId: r.versionId }))

  const latestVersionModelIds = uniq([
    ...modelResources.filter((r) => !r.versionId).map((r) => r.modelId),
    ...foldersModels.map((m) => m.id)
  ])

  const [specificVersions, latestVersions] = await Promise.all([
    getSpecificBranchCommits(specificVersionPairs),
    getBranchLatestCommits(latestVersionModelIds)
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
        (v) => v.branchId === modelResource.modelId && v.id === modelResource.versionId
      )
    } else {
      item = modelLatestVersions[modelResource.modelId]
    }

    if (!item) continue
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

async function getAllModelsResourceGroup(
  projectId: string
): Promise<ViewerResourceGroup> {
  const allBranchCommits = await getBranchLatestCommits(undefined, projectId)
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

/**
 * Version resources can be resolved 2 ways:
 * * Default - Specific version IDs referenced in identifiers are ignored and the identifiers always
 * refer to all versions of any referenced branch/branches of folders.
 * * Loaded versions only - Identifiers only refer to specific version IDs referenced in resource
 * identifiers, or if none are specified then only the latest version is referenced (e.g. in folder
 * resources & model resources w/ an empty version ID)
 */
async function getVersionResourceGroups(
  projectId: string,
  params: {
    modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
    folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
    allModelsResource?: SpeckleViewer.ViewerRoute.ViewerAllModelsResource
  },
  loadedVersionsOnly?: boolean
) {
  const allModelsGroup = params.allModelsResource
    ? await getAllModelsResourceGroup(projectId)
    : null

  const groups = loadedVersionsOnly
    ? await getVersionResourceGroupsLoadedVersionsOnly(projectId, params)
    : await getVersionResourceGroupsIncludingAllVersions(projectId, params)

  return [...(allModelsGroup ? [allModelsGroup] : []), ...groups]
}

/**
 * Validate requested resource identifiers and build viewer resource groups & items with
 * the metadata that the viewer needs to work with these
 */
export async function getViewerResourceGroups(
  target: ViewerUpdateTrackingTarget
): Promise<ViewerResourceGroup[]> {
  const { resourceIdString, projectId, loadedVersionsOnly } = target
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
      getObjectResourceGroups(projectId, objectResources),
      getVersionResourceGroups(
        projectId,
        { modelResources, folderResources, allModelsResource },
        loadedVersionsOnly || false
      )
    ])
  )

  return results
}

export async function getViewerResourceItemsUngrouped(
  target: ViewerUpdateTrackingTarget
): Promise<ViewerResourceItem[]> {
  const { resourceIdString } = target
  if (!resourceIdString?.trim().length) return []

  let results: ViewerResourceItem[] = []
  const groups = await getViewerResourceGroups(target)
  for (const group of groups) {
    results = results.concat(group.items)
  }

  return uniqWith(results, isResourceItemEqual)
}

export async function getViewerResourcesFromLegacyIdentifiers(
  projectId: string,
  resources: Array<ResourceIdentifier | ResourceIdentifierInput>
): Promise<ViewerResourceItem[]> {
  if (!resources.length || !projectId) return []

  const objectIds = resources
    .filter((r) => r.resourceType === ResourceType.Object)
    .map((r) => r.resourceId)
  const commitIds = resources
    .filter((r) => r.resourceType === ResourceType.Commit)
    .map((r) => r.resourceId)
  const commentIds = resources
    .filter((r) => r.resourceType === ResourceType.Comment)
    .map((r) => r.resourceId)

  const objectResourcesBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
  for (const objectId of objectIds) {
    objectResourcesBuilder.addObject(objectId)
  }
  const objectResources = objectResourcesBuilder
    .toResources()
    .filter(SpeckleViewer.ViewerRoute.isObjectResource)

  const [objectResourceGroups, commitsWithBranchIds, commentResources] =
    await Promise.all([
      getObjectResourceGroups(projectId, objectResources),
      getCommitsAndTheirBranchIds(commitIds),
      getViewerResourcesForComments(projectId, commentIds) // recursively getting parent comment resources
    ])

  let results: ViewerResourceItem[] = []
  for (const group of objectResourceGroups) {
    results = results.concat(group.items)
  }
  for (const commit of commitsWithBranchIds) {
    results.push({
      objectId: commit.referencedObject,
      versionId: commit.id,
      modelId: commit.branchId
    })
  }
  results = results.concat(commentResources)

  return uniqWith(results, isResourceItemEqual)
}

export async function getViewerResourcesForComments(
  projectId: string,
  commentIds: string[]
): Promise<ViewerResourceItem[]> {
  const commentsResources = reduce(
    await getCommentsResources(commentIds),
    (result, item) => {
      const resources = item.resources
      return result.concat(resources)
    },
    [] as ResourceIdentifier[]
  )
  const uniqueResources = uniqWith(commentsResources, isResourceIdentifierEqual)

  return await getViewerResourcesFromLegacyIdentifiers(projectId, uniqueResources)
}

export async function getViewerResourcesForComment(
  projectId: string,
  commentId: string
): Promise<ViewerResourceItem[]> {
  return await getViewerResourcesForComments(projectId, [commentId])
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
