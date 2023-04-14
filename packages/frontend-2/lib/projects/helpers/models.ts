import { has } from 'lodash-es'
import {
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
