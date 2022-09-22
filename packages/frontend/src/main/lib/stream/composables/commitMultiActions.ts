import { ref, computed } from 'vue'

export enum BatchActionType {
  Move = 'move',
  Delete = 'delete'
}

/**
 * Composable for setting up commit multi-select & actions like delete, move etc.
 */
export function useCommitMultiActions() {
  const selectedCommitsState = ref({} as Record<string, boolean>)
  const selectedCommitIds = computed(() => {
    const results: string[] = []
    for (const [key, val] of Object.entries(selectedCommitsState.value)) {
      if (val) results.push(key)
    }

    return results
  })

  const clearSelectedCommits = () => {
    selectedCommitsState.value = {}
  }

  const hasSelectedCommits = computed(() => selectedCommitIds.value.length > 0)

  return {
    /**
     * Selected commit IDs (read-only)
     */
    selectedCommitIds,
    /**
     * Object with selected commit keys and bool values
     */
    selectedCommitsState,
    /**
     * Whether there are any selected commit ids
     */
    hasSelectedCommits,
    /**
     * Clear selected commits
     */
    clearSelectedCommits
  }
}
