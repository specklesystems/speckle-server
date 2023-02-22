import { ref, Ref } from 'vue'
import { computed } from 'vue'

import { useQuery, useQueryLoading } from '@vue/apollo-composable'
import { StreamAllBranchesDocument } from '@/graphql/generated/graphql'
import { Nullable } from '@speckle/shared'

export function useAllStreamBranches(streamId: Ref<string>) {
  const {
    result: branchesResult,
    fetchMore: branchesFetchMore,
    refetch: refetchBranches,
    onResult
  } = useQuery(
    StreamAllBranchesDocument,
    () => ({ streamId: streamId.value, cursor: null as Nullable<string> }),
    { fetchPolicy: 'no-cache' }
  )

  const localBranches = computed(
    () => branchesResult.value?.stream?.branches?.items || []
  )

  const totalBranchCount = computed(
    () => branchesResult.value?.stream?.branches?.totalCount || 0
  )

  const branchesLoading = useQueryLoading()

  // Keep fetching until no more branches found
  const currentCursor = ref(null as Nullable<string>)
  onResult((res) => {
    if (res.errors?.length) return

    const newCursor = res.data?.stream?.branches?.cursor || null
    const newItems = res.data?.stream?.branches?.items || []

    if (newItems.length && newCursor && newCursor !== currentCursor.value) {
      currentCursor.value = newCursor
      branchesFetchMore({
        variables: { cursor: newCursor }
      })
    }
  })

  const refetchBranchesWrapper: typeof refetchBranches = (...args) => {
    currentCursor.value = null
    return refetchBranches(...args)
  }

  return {
    localBranches,
    refetchBranches: refetchBranchesWrapper,
    totalBranchCount,
    branchesLoading
  }
}
