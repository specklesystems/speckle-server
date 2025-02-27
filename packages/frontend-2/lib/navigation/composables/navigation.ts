export const useNavigationState = () =>
  useState<{
    activeWorkspaceSlug: string
  }>('navigation-state', () => ({
    activeWorkspaceSlug: 'raid-hq'
  }))

export const useNavigation = () => {
  const state = useNavigationState()

  const activeWorkspaceSlug = computed({
    get: () => state.value.activeWorkspaceSlug,
    set: (newVal) => (state.value.activeWorkspaceSlug = newVal)
  })

  return {
    activeWorkspaceSlug
  }
}
