import { useStorage } from '@vueuse/core'
import { isString, uniq } from 'lodash-es'
export {
  ThrottleOrDebounce,
  HorizontalDirection,
  useWindowResizeHandler,
  useOnBeforeWindowUnload,
  useResponsiveHorizontalDirectionCalculation
} from '@speckle/ui-components'

export function useDisableGlobalTextSelection() {
  const disableTextSelection = ref(false)

  if (import.meta.client) {
    watch(disableTextSelection, (newVal, oldVal) => {
      if (!!newVal === !!oldVal) return

      if (newVal) {
        document.body.classList.add('select-none')
      } else {
        document.body.classList.remove('select-none')
      }
    })
  }

  return { disableTextSelection }
}

export function useItemsExpandedState(params: { stateName: string }) {
  const initializer = () => ({
    expandedIds: [] as string[]
  })

  const fakeState = ref(initializer())
  const storageState = import.meta.server
    ? fakeState
    : useStorage('useItemsExpandedState-' + params.stateName, initializer)

  const hasMounted = ref(false)
  const useRealState = computed(() => import.meta.client && hasMounted.value)

  const state = computed({
    get: () => {
      const shouldUseRealState = useRealState.value
      return !shouldUseRealState ? fakeState.value : storageState.value
    },
    set: (newVal) => {
      const shouldUseRealState = useRealState.value

      if (!shouldUseRealState) {
        fakeState.value = newVal
      } else {
        storageState.value = newVal
      }
    }
  })

  const isExpanded = (id: string | ((id: string) => boolean)): boolean =>
    !!(isString(id)
      ? state.value.expandedIds.includes(id)
      : state.value.expandedIds.find(id))

  const toggleExpanded = (id: string, newState: boolean) => {
    if (!newState) {
      state.value = {
        ...state.value,
        expandedIds: state.value.expandedIds.filter((i) => i !== id)
      }
    } else {
      state.value = {
        ...state.value,
        expandedIds: uniq([...state.value.expandedIds, id])
      }
    }
  }

  onMounted(() => {
    // Only doing this after onMounted to avoid hydration mismatches
    hasMounted.value = true
  })

  return { isExpanded, toggleExpanded }
}

export const useIsItemExpanded = (params: {
  stateName: string
  id: MaybeRef<string>
}) => {
  const { stateName, id } = params
  const { isExpanded, toggleExpanded } = useItemsExpandedState({ stateName })

  const expanded = computed({
    get: () => isExpanded(unref(id)),
    set: (newVal) => toggleExpanded(unref(id), newVal)
  })

  // Re-calculate on mounted, when we actually have the id
  onMounted(() => {
    expanded.value = isExpanded(unref(id))
  })

  return {
    isExpanded: expanded
  }
}
