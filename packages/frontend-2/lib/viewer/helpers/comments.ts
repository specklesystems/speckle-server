import { RichTextEditor, SpeckleViewer } from '@speckle/shared'
import { sortBy } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  CommentContentInput,
  LinkableCommentFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute, threadRedirectRoute } from '~~/lib/common/helpers/route'
import type { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import { ViewerHashStateKeys } from '~~/lib/viewer/composables/setup/urlHashState'

export function convertCommentEditorValueToInput(
  value: CommentEditorValue
): CommentContentInput {
  return {
    doc: value.doc || null,
    blobIds: value.attachments?.map((a) => a.result.blobId) || []
  }
}

export function isValidCommentEditorValue(val: CommentEditorValue) {
  const input = convertCommentEditorValueToInput(val)
  return isValidCommentContentInput(input)
}

export function isValidCommentContentInput(input: CommentContentInput) {
  if (!input.doc && !(input.blobIds || []).length) return false
  if (input.doc && RichTextEditor.isDocEmpty(input.doc)) return false

  return true
}

graphql(`
  fragment LinkableComment on Comment {
    id
    viewerResources {
      modelId
      versionId
      objectId
    }
  }
`)

/**
 * Resolving the actual full link requires viewerResources which are pretty heavy to fetch.
 * This link defers viewerResources resolution to when the link is actually clicked
 */
export function getLightLinkToThread(projectId: string, threadId: string) {
  return threadRedirectRoute(projectId, threadId)
}

export function getLinkToThread(projectId: string, thread: LinkableCommentFragment) {
  if (!thread.viewerResources.length) return undefined
  const sortedResources = sortBy(thread.viewerResources, (r) => {
    if (r.versionId) return 1
    if (r.modelId) return 2
    if (r.objectId) return 3
  })

  const resource = sortedResources[0]
  const resourceUrlBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
  if (resource.modelId) {
    resourceUrlBuilder.addModel(resource.modelId, resource.versionId || undefined)
  } else {
    resourceUrlBuilder.addObject(resource.objectId)
  }

  return modelRoute(projectId, resourceUrlBuilder.toString(), {
    [ViewerHashStateKeys.FocusedThreadId]: thread.id
  })
}
