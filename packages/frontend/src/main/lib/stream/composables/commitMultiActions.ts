import { SetupProps } from '@/helpers/typeHelpers'
import { BatchActionType } from '@/main/lib/stream/services/commitMultiActions'
import { ref, computed, SetupContext } from 'vue'

export { BatchActionType }

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

/**
 * Use inside a component that represents a commit that can be selected (e.g. for batch actions)
 */
export function useSelectableCommit(
  props: SetupProps<{
    selectable: boolean
    selectDisabled: boolean
    selected: boolean
  }>,
  ctx: SetupContext
) {
  const canBeSelected = computed(() => props.selectable && !props.selectDisabled)

  const selectedState = computed({
    get: () => (canBeSelected.value ? props.selected : false),
    set: (newVal) => ctx.emit('update:selected', canBeSelected.value ? !!newVal : false)
  })
  const highlighted = computed(() => selectedState.value)
  const onSelect = () => ctx.emit('select', { value: selectedState.value })

  return {
    highlighted,
    onSelect,
    selectedState
  }
}
