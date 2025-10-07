import { has } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import { modelRoute } from '~/lib/common/helpers/route'
import type {
  PendingFileUploadFragment,
  ProjectModelPageVersionsCardVersionFragment,
  GetModelItemRoute_ModelFragment
} from '~~/lib/common/generated/gql/graphql'
import { resourceBuilder } from '@speckle/shared/viewer/route'

export function isPendingModelFragment(i: unknown): i is PendingFileUploadFragment {
  return has(i, 'convertedMessage')
}

export function isPendingVersionFragment(
  i: ProjectModelPageVersionsCardVersionFragment | PendingFileUploadFragment
): i is PendingFileUploadFragment {
  return has(i, 'convertedMessage')
}

// Function to sanitize model name by trimming spaces around slashes
export function sanitizeModelName(name: string): string {
  return name
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join('/')
}

graphql(`
  fragment GetModelItemRoute_Model on Model {
    id
    projectId
    homeView {
      id
      resourceIds
    }
    resourceIdString
  }
`)

export const getModelItemRoute = (
  i:
    | GetModelItemRoute_ModelFragment
    | PendingFileUploadFragment
    | { projectId: string; id: string },
  versionId?: string
) => {
  if (isPendingModelFragment(i)) {
    return modelRoute(i.projectId, i.id)
  }

  if (versionId) {
    return modelRoute(
      i.projectId,
      resourceBuilder().addModel(i.id, versionId).toString()
    )
  }

  if (!('resourceIdString' in i)) {
    return modelRoute(i.projectId, i.id)
  }

  return modelRoute(i.projectId, i.resourceIdString)
}
