import { has } from 'lodash-es'
import type {
  ProjectPageLatestItemsModelItemFragment,
  PendingFileUploadFragment,
  ProjectModelPageVersionsCardVersionFragment
} from '~~/lib/common/generated/gql/graphql'

export function isPendingModelFragment(
  i: ProjectPageLatestItemsModelItemFragment | PendingFileUploadFragment
): i is PendingFileUploadFragment {
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
    .join('/')
}
