import { useIsItemExpanded } from '~~/lib/common/composables/window'

export const useIsModelExpanded = (params: {
  fullName: MaybeRef<string>
  projectId: MaybeRef<string>
}) => {
  const id = computed(() => `${unref(params.projectId)}:${unref(params.fullName)}`)
  const state = useIsItemExpanded({ stateName: 'ModelExpandedState', id })
  return state.isExpanded
}
