import * as SpeckleViewer from '@speckle/shared/viewer'
import * as RichTextEditor from '@speckle/shared/rich-text-editor'

import { sortBy } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import {
  CommentContentInput,
  LinkableCommentFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { CommentEditorValue } from '~~/lib/viewer/composables/commentManagement'
import { ViewerHashStateKeys } from '~~/lib/viewer/composables/setup/urlHashState'
// import { Optional } from '@speckle/shared'
// ViewerHashStateKeys

export function convertCommentEditorValueToInput(
  value: CommentEditorValue
): CommentContentInput {
  return {
    doc: value.doc || null,
    blobIds: value.attachments?.map((a) => a.result.blobId) || []
  }
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
