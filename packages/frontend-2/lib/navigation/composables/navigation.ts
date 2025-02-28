export const useNavigationState = () =>
  useState<{
    activeWorkspaceSlug: string | null
    isProjectsActive: boolean
  }>('navigation-state', () => ({
    activeWorkspaceSlug: null,
    isProjectsActive: false
  }))

export const useNavigation = () => {
  const state = useNavigationState()

  const activeWorkspaceSlug = computed({
    get: () => state.value.activeWorkspaceSlug,
    set: (newVal) => (state.value.activeWorkspaceSlug = newVal)
  })

  const isProjectsActive = computed({
    get: () => state.value.isProjectsActive,
    set: (newVal) => (state.value.isProjectsActive = newVal)
  })

  return {
    activeWorkspaceSlug,
    isProjectsActive
  }
}
