import { has } from 'lodash-es'
import {
  ProjectPageLatestItemsModelItemFragment,
  ProjectPageLatestItemsPendingModelItemFragment
} from '~~/lib/common/generated/gql/graphql'

export function isPendingModelFragment(
  i:
    | ProjectPageLatestItemsModelItemFragment
    | ProjectPageLatestItemsPendingModelItemFragment
): i is ProjectPageLatestItemsPendingModelItemFragment {
  return has(i, 'convertedMessage')
}
