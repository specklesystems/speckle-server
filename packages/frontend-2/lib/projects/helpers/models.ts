import { resourceBuilder } from '@speckle/shared/viewer/route'
import { has } from 'lodash-es'
import { graphql } from '~/lib/common/generated/gql'
import { modelRoute } from '~/lib/common/helpers/route'
import type {
  PendingFileUploadFragment,
  ProjectModelPageVersionsCardVersionFragment,
  GetModelItemRoute_ModelFragment
} from '~~/lib/common/generated/gql/graphql'

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
  }
`)

export const getModelItemRoute = (
  i: GetModelItemRoute_ModelFragment | PendingFileUploadFragment
) => {
  if (isPendingModelFragment(i)) {
    return modelRoute(i.projectId, i.id)
  }

  return modelRoute(
    i.projectId,
    i.homeView?.id
      ? resourceBuilder().addResources(i.homeView.resourceIds).toString()
      : i.id
  )
}
