import {
  GetCommentsResources,
  GetViewerResourcesForComment,
  GetViewerResourcesForComments,
  GetViewerResourcesFromLegacyIdentifiers
} from '@/modules/comments/domain/operations'
import { GetCommitsAndTheirBranchIds } from '@/modules/core/domain/commits/operations'
import {
  ResourceIdentifier,
  ResourceIdentifierInput,
  ResourceType,
  ViewerResourceItem
} from '@/modules/core/graph/generated/graphql'
import {
  GetObjectResourceGroupsDeps,
  getObjectResourceGroupsFactory,
  isResourceItemEqual
} from '@/modules/viewer/services/viewerResources'
import { SpeckleViewer } from '@speckle/shared'
import { reduce, uniqWith } from 'lodash-es'

function isResourceIdentifierEqual(
  a: ResourceIdentifier | ResourceIdentifierInput,
  b: ResourceIdentifier | ResourceIdentifierInput
) {
  if (a.resourceId !== b.resourceId) return false
  if (a.resourceType !== b.resourceType) return false
  return true
}

export const getViewerResourcesFromLegacyIdentifiersFactory =
  (
    deps: {
      getViewerResourcesForComments: GetViewerResourcesForComments
      getCommitsAndTheirBranchIds: GetCommitsAndTheirBranchIds
    } & GetObjectResourceGroupsDeps
  ): GetViewerResourcesFromLegacyIdentifiers =>
  async (
    projectId: string,
    resources: Array<ResourceIdentifier | ResourceIdentifierInput>
  ): Promise<ViewerResourceItem[]> => {
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
        getObjectResourceGroupsFactory(deps)(projectId, objectResources),
        deps.getCommitsAndTheirBranchIds(commitIds),
        deps.getViewerResourcesForComments(projectId, commentIds) // recursively getting parent comment resources
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

type GetViewerResourcesForCommentsDeps = {
  getCommentsResources: GetCommentsResources
  getViewerResourcesFromLegacyIdentifiers: GetViewerResourcesFromLegacyIdentifiers
}

export const getViewerResourcesForCommentsFactory =
  (deps: GetViewerResourcesForCommentsDeps): GetViewerResourcesForComments =>
  async (projectId: string, commentIds: string[]): Promise<ViewerResourceItem[]> => {
    const commentsResources = reduce(
      await deps.getCommentsResources(commentIds),
      (result, item) => {
        const resources = item.resources
        return result.concat(resources)
      },
      [] as ResourceIdentifier[]
    )
    const uniqueResources = uniqWith(commentsResources, isResourceIdentifierEqual)

    return await deps.getViewerResourcesFromLegacyIdentifiers(
      projectId,
      uniqueResources
    )
  }

export const getViewerResourcesForCommentFactory =
  (deps: GetViewerResourcesForCommentsDeps): GetViewerResourcesForComment =>
  async (projectId: string, commentId: string): Promise<ViewerResourceItem[]> => {
    return await getViewerResourcesForCommentsFactory(deps)(projectId, [commentId])
  }
