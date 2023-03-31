import { has } from 'lodash-es'
import {
  ProjectPageLatestItemsModelItemFragment,
  PendingFileUploadFragment
} from '~~/lib/common/generated/gql/graphql'

export function isPendingModelFragment(
  i: ProjectPageLatestItemsModelItemFragment | PendingFileUploadFragment
): i is PendingFileUploadFragment {
  return has(i, 'convertedMessage')
}
