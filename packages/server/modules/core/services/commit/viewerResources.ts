import {
  ViewerResourceGroup,
  ViewerResourceItem
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import {
  getBranchLatestCommits,
  getStreamBranchesByName
} from '@/modules/core/repositories/branches'
import { getSpecificBranchCommits } from '@/modules/core/repositories/commits'
import { getStreamObjects } from '@/modules/core/repositories/objects'
import { Optional, SpeckleViewer } from '@speckle/shared'
import { flatten, keyBy, uniq } from 'lodash'

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

async function getVersionResourceGroups(
  projectId: string,
  params: {
    modelResources?: SpeckleViewer.ViewerRoute.ViewerModelResource[]
    folderResources?: SpeckleViewer.ViewerRoute.ViewerModelFolderResource[]
  }
) {
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

/**
 * Validate requested resource identifiers and build viewer resource groups & items with
 * the metadata that the viewer needs to work with these
 */
export async function getViewerResourceGroups(
  projectId: string,
  resourceIdString: string
): Promise<ViewerResourceGroup[]> {
  const resources = SpeckleViewer.ViewerRoute.parseUrlParameters(resourceIdString)

  const objectResources = resources.filter(
    (r): r is SpeckleViewer.ViewerRoute.ViewerObjectResource =>
      SpeckleViewer.ViewerRoute.isObjectResource(r)
  )
  const modelResources = resources.filter(
    (r): r is SpeckleViewer.ViewerRoute.ViewerModelResource =>
      SpeckleViewer.ViewerRoute.isModelResource(r)
  )
  const folderResources = resources.filter(
    (r): r is SpeckleViewer.ViewerRoute.ViewerModelFolderResource =>
      SpeckleViewer.ViewerRoute.isModelFolderResource(r)
  )

  const results: ViewerResourceGroup[] = flatten(
    await Promise.all([
      getObjectResourceGroups(projectId, objectResources),
      getVersionResourceGroups(projectId, { modelResources, folderResources })
    ])
  )

  return results
}
